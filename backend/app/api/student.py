from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps import require_student
from app.models.enums import Department, RentalStatus
from app.models.equipment import Equipment
from app.models.rental import Rental
from app.models.user import User
from app.schemas.equipment import ReservedDateRange, StudentEquipmentOut
from app.schemas.rental import RentalCreate, RentalOut, RentalWithEquipmentOut

router = APIRouter(prefix="/api/v1/student", tags=["student"])

ACTIVE_RENTAL_STATUSES = (RentalStatus.PENDING, RentalStatus.APPROVED)


@router.get("/equipments", response_model=list[StudentEquipmentOut])
async def list_equipments(
    department: Department | None = Query(default=None),
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    target_department = department or current_user.department

    equipment_result = await db.execute(
        select(Equipment).where(Equipment.department == target_department).order_by(Equipment.id)
    )
    equipments = equipment_result.scalars().all()

    if not equipments:
        return []

    equipment_ids = [e.id for e in equipments]

    rental_result = await db.execute(
        select(Rental).where(
            Rental.equipment_id.in_(equipment_ids),
            Rental.status.in_(ACTIVE_RENTAL_STATUSES),
        )
    )
    rentals_by_equipment: dict[int, list[Rental]] = defaultdict(list)
    for rental in rental_result.scalars().all():
        rentals_by_equipment[rental.equipment_id].append(rental)

    requires_pledge = target_department != current_user.department

    response = []
    for equipment in equipments:
        active_rentals = rentals_by_equipment.get(equipment.id, [])
        response.append(
            StudentEquipmentOut(
                id=equipment.id,
                name=equipment.name,
                department=equipment.department,
                total_quantity=equipment.total_quantity,
                available_quantity=equipment.available_quantity,
                description=equipment.description,
                image_url=equipment.image_url,
                created_at=equipment.created_at,
                reservation_count=len(active_rentals),
                is_available=equipment.available_quantity > 0,
                requires_pledge=requires_pledge,
                reserved_dates=[
                    ReservedDateRange(start_date=r.start_date, end_date=r.end_date) for r in active_rentals
                ],
            )
        )
    return response


@router.post("/rentals", response_model=RentalOut, status_code=status.HTTP_201_CREATED)
async def create_rental(
    payload: RentalCreate,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    equipment_result = await db.execute(select(Equipment).where(Equipment.id == payload.equipment_id))
    equipment = equipment_result.scalar_one_or_none()
    if equipment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="기자재를 찾을 수 없습니다.")

    is_cross_department = equipment.department != current_user.department

    if is_cross_department and not payload.pledge_agreed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="타 학과 기자재 대여 시 서약서 동의가 필수입니다.",
        )

    overlap_result = await db.execute(
        select(Rental).where(
            Rental.equipment_id == payload.equipment_id,
            Rental.status.in_(ACTIVE_RENTAL_STATUSES),
            and_(
                Rental.start_date <= payload.end_date,
                Rental.end_date >= payload.start_date,
            ),
        )
    )
    if overlap_result.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="해당 기간에 이미 예약(대기/승인)된 내역이 있습니다.",
        )

    rental = Rental(
        user_id=current_user.id,
        equipment_id=payload.equipment_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        reason=payload.reason,
        status=RentalStatus.PENDING,
        is_cross_department=is_cross_department,
        pledge_agreed=payload.pledge_agreed,
    )
    db.add(rental)
    await db.commit()
    await db.refresh(rental)
    return rental


@router.get("/rentals/me", response_model=list[RentalWithEquipmentOut])
async def get_my_rentals(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Rental, Equipment)
        .join(Equipment, Rental.equipment_id == Equipment.id)
        .where(Rental.user_id == current_user.id)
        .order_by(Rental.created_at.desc())
    )

    rentals = []
    for rental, equipment in result.all():
        rentals.append(
            RentalWithEquipmentOut(
                id=rental.id,
                user_id=rental.user_id,
                equipment_id=rental.equipment_id,
                start_date=rental.start_date,
                end_date=rental.end_date,
                reason=rental.reason,
                status=rental.status,
                is_cross_department=rental.is_cross_department,
                pledge_agreed=rental.pledge_agreed,
                created_at=rental.created_at,
                equipment_name=equipment.name,
                equipment_department=equipment.department.value,
            )
        )
    return rentals
