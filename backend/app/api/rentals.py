from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps import get_current_user, require_assistant
from app.models.enums import RentalStatus
from app.models.equipment import Equipment
from app.models.rental import Rental
from app.models.user import User
from app.schemas.rental import RentalCreateIn, RentalOut

router = APIRouter(prefix="/rentals", tags=["rentals"])


async def _load_rental_with_relations(db: AsyncSession, rental: Rental, base_url: str = "") -> RentalOut:
    equipment_result = await db.execute(select(Equipment).where(Equipment.id == rental.equipment_id))
    equipment = equipment_result.scalar_one()
    applicant_result = await db.execute(select(User).where(User.id == rental.user_id))
    applicant = applicant_result.scalar_one()
    return RentalOut.from_models(rental, equipment, applicant, base_url)


@router.post("", response_model=RentalOut, status_code=status.HTTP_201_CREATED)
async def create_rental(
    payload: RentalCreateIn,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 행 잠금 — 동시에 여러 신청이 들어와도 재고 체크·차감이 원자적으로 처리되도록 한다.
    equipment_result = await db.execute(
        select(Equipment).where(Equipment.id == payload.equipment_id).with_for_update()
    )
    equipment = equipment_result.scalar_one_or_none()
    if equipment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="기자재를 찾을 수 없습니다.")

    if equipment.available_quantity < payload.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="대여 가능한 수량이 없습니다.",
        )

    equipment.available_quantity -= payload.quantity

    rental = Rental(
        user_id=current_user.id,
        equipment_id=payload.equipment_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        quantity=payload.quantity,
        reason=payload.purpose,
        status=RentalStatus.PENDING,
        is_cross_department=equipment.department != current_user.department,
    )
    db.add(rental)
    await db.commit()
    await db.refresh(rental)

    return await _load_rental_with_relations(db, rental, str(request.base_url))


@router.get("", response_model=list[RentalOut])
async def get_my_rentals(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Rental).where(Rental.user_id == current_user.id).order_by(Rental.created_at.desc())
    )
    rentals = result.scalars().all()
    base_url = str(request.base_url)
    return [await _load_rental_with_relations(db, rental, base_url) for rental in rentals]


@router.get("/all", response_model=list[RentalOut])
async def get_all_department_rentals(
    request: Request,
    current_user: User = Depends(require_assistant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Rental)
        .join(Equipment, Rental.equipment_id == Equipment.id)
        .where(Equipment.department == current_user.department)
        .order_by(Rental.created_at.desc())
    )
    rentals = result.scalars().all()
    base_url = str(request.base_url)
    return [await _load_rental_with_relations(db, rental, base_url) for rental in rentals]


async def _get_own_department_rental_or_404(rental_id: int, current_user: User, db: AsyncSession) -> Rental:
    result = await db.execute(select(Rental).where(Rental.id == rental_id))
    rental = result.scalar_one_or_none()
    if rental is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="대여 신청을 찾을 수 없습니다.")

    equipment_result = await db.execute(select(Equipment).where(Equipment.id == rental.equipment_id))
    equipment = equipment_result.scalar_one_or_none()
    if equipment is None or equipment.department != current_user.department:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인 학과 기자재에 대한 대여 신청만 처리할 수 있습니다.",
        )
    return rental


@router.post("/{rental_id}/approve", response_model=RentalOut)
async def approve_rental(
    rental_id: int,
    request: Request,
    current_user: User = Depends(require_assistant),
    db: AsyncSession = Depends(get_db),
):
    rental = await _get_own_department_rental_or_404(rental_id, current_user, db)
    if rental.status != RentalStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="이미 처리된 대여 신청입니다.")

    rental.status = RentalStatus.APPROVED
    rental.processed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(rental)
    return await _load_rental_with_relations(db, rental, str(request.base_url))


@router.post("/{rental_id}/reject", response_model=RentalOut)
async def reject_rental(
    rental_id: int,
    request: Request,
    current_user: User = Depends(require_assistant),
    db: AsyncSession = Depends(get_db),
):
    rental = await _get_own_department_rental_or_404(rental_id, current_user, db)
    if rental.status != RentalStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="이미 처리된 대여 신청입니다.")

    equipment_result = await db.execute(select(Equipment).where(Equipment.id == rental.equipment_id))
    equipment = equipment_result.scalar_one()
    equipment.available_quantity += rental.quantity

    rental.status = RentalStatus.REJECTED
    rental.processed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(rental)
    return await _load_rental_with_relations(db, rental, str(request.base_url))


@router.post("/{rental_id}/return", response_model=RentalOut)
async def return_rental(
    rental_id: int,
    request: Request,
    current_user: User = Depends(require_assistant),
    db: AsyncSession = Depends(get_db),
):
    rental = await _get_own_department_rental_or_404(rental_id, current_user, db)
    if rental.status != RentalStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="대여중인 신청만 반납 처리할 수 있습니다.")

    equipment_result = await db.execute(select(Equipment).where(Equipment.id == rental.equipment_id))
    equipment = equipment_result.scalar_one()
    equipment.available_quantity += rental.quantity

    rental.status = RentalStatus.RETURNED
    rental.processed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(rental)
    return await _load_rental_with_relations(db, rental, str(request.base_url))


@router.post("/{rental_id}/cancel", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_rental(
    rental_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Rental).where(Rental.id == rental_id, Rental.user_id == current_user.id)
    )
    rental = result.scalar_one_or_none()
    if rental is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="대여 신청을 찾을 수 없습니다.")
    if rental.status != RentalStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="심사 중인 신청만 취소할 수 있습니다.")

    equipment_result = await db.execute(select(Equipment).where(Equipment.id == rental.equipment_id))
    equipment = equipment_result.scalar_one_or_none()
    if equipment is not None:
        equipment.available_quantity += rental.quantity

    await db.delete(rental)
    await db.commit()
