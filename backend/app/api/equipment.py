from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.storage import delete_equipment_image, save_equipment_image
from app.deps import require_assistant
from app.models.departments import department_by_id
from app.models.equipment import Equipment
from app.models.user import User
from app.schemas.equipment import EquipmentOut

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("", response_model=list[EquipmentOut])
async def list_equipment(
    request: Request,
    department_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Equipment).order_by(Equipment.id)
    if department_id is not None:
        department = department_by_id(department_id)
        if department is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="존재하지 않는 학과 ID입니다.")
        query = query.where(Equipment.department == department)

    result = await db.execute(query)
    base_url = str(request.base_url)
    return [EquipmentOut.from_equipment(equipment, base_url) for equipment in result.scalars().all()]


@router.get("/{equipment_id}", response_model=EquipmentOut)
async def get_equipment(equipment_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    equipment = result.scalar_one_or_none()
    if equipment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="기자재를 찾을 수 없습니다.")
    return EquipmentOut.from_equipment(equipment, str(request.base_url))


@router.post("", response_model=EquipmentOut, status_code=status.HTTP_201_CREATED)
async def create_equipment(
    request: Request,
    name: str = Form(...),
    department_id: int = Form(...),
    total_quantity: int = Form(..., gt=0),
    category: str | None = Form(None),
    description: str | None = Form(None),
    image: UploadFile | None = File(None),
    current_user: User = Depends(require_assistant),
    db: AsyncSession = Depends(get_db),
):
    department = department_by_id(department_id)
    if department is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="존재하지 않는 학과 ID입니다.")
    if department != current_user.department:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인 학과의 기자재만 등록할 수 있습니다.",
        )

    image_url = None
    if image is not None and image.filename:
        image_url = await save_equipment_image(image)

    equipment = Equipment(
        name=name,
        department=department,
        category=category,
        total_quantity=total_quantity,
        available_quantity=total_quantity,
        description=description,
        image_url=image_url,
    )
    db.add(equipment)
    await db.commit()
    await db.refresh(equipment)
    return EquipmentOut.from_equipment(equipment, str(request.base_url))


@router.patch("/{equipment_id}", response_model=EquipmentOut)
async def update_equipment(
    equipment_id: int,
    request: Request,
    name: str | None = Form(None),
    total_quantity: int | None = Form(None, gt=0),
    category: str | None = Form(None),
    description: str | None = Form(None),
    image: UploadFile | None = File(None),
    current_user: User = Depends(require_assistant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    equipment = result.scalar_one_or_none()
    if equipment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="기자재를 찾을 수 없습니다.")
    if equipment.department != current_user.department:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인 학과의 기자재만 수정할 수 있습니다.",
        )

    if name is not None:
        equipment.name = name
    if category is not None:
        equipment.category = category
    if description is not None:
        equipment.description = description
    if total_quantity is not None:
        delta = total_quantity - equipment.total_quantity
        equipment.total_quantity = total_quantity
        equipment.available_quantity = max(0, equipment.available_quantity + delta)
    if image is not None and image.filename:
        relative_url = await save_equipment_image(image)
        delete_equipment_image(equipment.image_url)
        equipment.image_url = relative_url

    await db.commit()
    await db.refresh(equipment)
    return EquipmentOut.from_equipment(equipment, str(request.base_url))
