from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import Department


class EquipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    department: Department
    total_quantity: int
    available_quantity: int
    description: str | None = None
    image_url: str | None = None
    created_at: datetime


class ReservedDateRange(BaseModel):
    start_date: date
    end_date: date


class StudentEquipmentOut(BaseModel):
    id: int
    name: str
    department: Department
    total_quantity: int
    available_quantity: int
    description: str | None = None
    image_url: str | None = None
    created_at: datetime
    reservation_count: int
    is_available: bool
    requires_pledge: bool
    reserved_dates: list[ReservedDateRange]
