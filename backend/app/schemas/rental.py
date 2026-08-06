from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.enums import RentalStatus


class RentalCreate(BaseModel):
    equipment_id: int
    start_date: date
    end_date: date
    reason: str | None = None
    pledge_agreed: bool = False

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date는 start_date보다 빠를 수 없습니다.")
        return self


class RentalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    equipment_id: int
    start_date: date
    end_date: date
    reason: str | None = None
    status: RentalStatus
    is_cross_department: bool
    pledge_agreed: bool
    created_at: datetime


class RentalWithEquipmentOut(RentalOut):
    equipment_name: str
    equipment_department: str


class RentalWithApplicantOut(RentalOut):
    equipment_name: str
    applicant_name: str
    applicant_student_id: str
    applicant_department: str


class RentalStatusUpdate(BaseModel):
    status: Literal[RentalStatus.APPROVED, RentalStatus.REJECTED]
