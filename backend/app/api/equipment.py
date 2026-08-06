from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.storage import save_equipment_image
from app.deps import require_assistant
from app.models.departments import department_by_id
from app.models.equipment import Equipment
from app.models.user import User
from app.schemas.equipment import EquipmentOut

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("", response_model=list[EquipmentOut])
async def list_equipment(
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
    return [EquipmentOut.from_equipment(equipment) for equipment in result.scalars().all()]


@router.get("/{equipment_id}", response_model=EquipmentOut)
async def get_equipment(equipment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    equipment = result.scalar_one_or_none()
    if equipment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="기자재를 찾을 수 없습니다.")
    return EquipmentOut.from_equipment(equipment)


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

    image_url = None
    if image is not None and image.filename:
        relative_url = await save_equipment_image(image)
        image_url = str(request.base_url).rstrip("/") + relative_url

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
    return EquipmentOut.from_equipment(equipment)
