from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import delete_equipment_image, save_equipment_image
from app.database import get_db
from app.deps import require_assistant
from app.models.enums import RentalStatus
from app.models.equipment import Equipment
from app.models.rental import Rental
from app.models.user import User
from app.schemas.equipment import EquipmentOut
from app.schemas.rental import RentalStatusUpdate, RentalWithApplicantOut

router = APIRouter(prefix="/api/v1/assistant", tags=["assistant"])


async def _get_own_equipment_or_404(equipment_id: int, current_user: User, db: AsyncSession) -> Equipment:
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    equipment = result.scalar_one_or_none()
    if equipment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="기자재를 찾을 수 없습니다.")
    if equipment.department != current_user.department:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인 학과의 기자재만 관리할 수 있습니다.",
        )
    return equipment


@router.get("/equipments", response_model=list[EquipmentOut])
async def list_equipments(
    current_user: User = Depends(require_assistant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Equipment).where(Equipment.department == current_user.department).order_by(Equipment.id)
    )
    return result.scalars().all()


@router.post("/equipments", response_model=EquipmentOut, status_code=status.HTTP_201_CREATED)
async def create_equipment(
    name: str = Form(...),
    total_quantity: int = Form(..., gt=0),
    description: str | None = Form(None),
    image: UploadFile | None = File(None),
    current_user: User = Depends(require_assistant),
    db: AsyncSession = Depends(get_db),
):
    image_url = await save_equipment_image(image) if image is not None else None

    equipment = Equipment(
        name=name,
        department=current_user.department,
        total_quantity=total_quantity,
        available_quantity=total_quantity,
        description=description,
        image_url=image_url,
    )
    db.add(equipment)
    await db.commit()
    await db.refresh(equipment)
    return equipment


@router.put("/equipments/{equipment_id}", response_model=EquipmentOut)
async def update_equipment(
    equipment_id: int,
    name: str | None = Form(None),
    total_quantity: int | None = Form(None, gt=0),
    available_quantity: int | None = Form(None, ge=0),
    description: str | None = Form(None),
    image: UploadFile | None = File(None),
    current_user: User = Depends(require_assistant),
    db: AsyncSession = Depends(get_db),
):
    equipment = await _get_own_equipment_or_404(equipment_id, current_user, db)

    if name is not None:
        equipment.name = name
    if total_quantity is not None:
        equipment.total_quantity = total_quantity
    if available_quantity is not None:
        equipment.available_quantity = available_quantity
    if description is not None:
        equipment.description = description
    if image is not None:
        new_image_url = await save_equipment_image(image)
        delete_equipment_image(equipment.image_url)
        equipment.image_url = new_image_url

    if equipment.available_quantity > equipment.total_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="대여 가능 수량이 총 수량보다 많을 수 없습니다.",
        )

    await db.commit()
    await db.refresh(equipment)
    return equipment


@router.delete("/equipments/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment(
    equipment_id: int,
    current_user: User = Depends(require_assistant),
    db: AsyncSession = Depends(get_db),
):
    equipment = await _get_own_equipment_or_404(equipment_id, current_user, db)
    delete_equipment_image(equipment.image_url)
    await db.delete(equipment)
    await db.commit()


@router.get("/rentals", response_model=list[RentalWithApplicantOut])
async def list_department_rentals(
    current_user: User = Depends(require_assistant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Rental, Equipment, User)
        .join(Equipment, Rental.equipment_id == Equipment.id)
        .join(User, Rental.user_id == User.id)
        .where(Equipment.department == current_user.department)
        .order_by(Rental.created_at.desc())
    )

    rentals = []
    for rental, equipment, applicant in result.all():
        rentals.append(
            RentalWithApplicantOut(
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
                applicant_name=applicant.name,
                applicant_student_id=applicant.student_id,
                applicant_department=applicant.department.value,
            )
        )
    return rentals


@router.patch("/rentals/{rental_id}", response_model=RentalWithApplicantOut)
async def update_rental_status(
    rental_id: int,
    payload: RentalStatusUpdate,
    current_user: User = Depends(require_assistant),
    db: AsyncSession = Depends(get_db),
):
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

    if rental.status != RentalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 처리된 대여 신청입니다.",
        )

    if payload.status == RentalStatus.APPROVED:
        if equipment.available_quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="대여 가능한 수량이 없습니다.",
            )
        equipment.available_quantity -= 1

    rental.status = payload.status
    await db.commit()
    await db.refresh(rental)

    applicant_result = await db.execute(select(User).where(User.id == rental.user_id))
    applicant = applicant_result.scalar_one()

    return RentalWithApplicantOut(
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
        applicant_name=applicant.name,
        applicant_student_id=applicant.student_id,
        applicant_department=applicant.department.value,
    )
