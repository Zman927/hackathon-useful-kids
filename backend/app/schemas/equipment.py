from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.departments import department_id_of


class EquipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    image_url: str | None = None
    category: str | None = None
    description: str | None = None
    department_id: int
    is_available: bool
    remaining_quantity: int
    total_quantity: int
    created_at: datetime

    @staticmethod
    def from_equipment(equipment, base_url: str = "") -> "EquipmentOut":
        image_url = equipment.image_url
        if image_url and image_url.startswith("/"):
            image_url = base_url.rstrip("/") + image_url
        return EquipmentOut(
            id=equipment.id,
            name=equipment.name,
            image_url=image_url,
            category=equipment.category,
            description=equipment.description,
            department_id=department_id_of(equipment.department),
            is_available=equipment.available_quantity > 0,
            remaining_quantity=equipment.available_quantity,
            total_quantity=equipment.total_quantity,
            created_at=equipment.created_at,
        )
