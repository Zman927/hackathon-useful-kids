from datetime import date, datetime

from pydantic import BaseModel, field_validator, model_validator

STATUS_TO_FRONTEND = {
    "PENDING": "pending",
    "APPROVED": "rented",
    "REJECTED": "rejected",
}


class RentalCreateIn(BaseModel):
    equipment_id: int
    start_date: date
    end_date: date
    quantity: int = 1
    purpose: str | None = None

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value: int) -> int:
        if value < 1:
            raise ValueError("quantity는 1 이상이어야 합니다.")
        return value

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date는 start_date보다 빠를 수 없습니다.")
        return self


class RentalOut(BaseModel):
    id: int
    student_name: str
    student_id: str
    student_department: str
    equipment_id: int
    equipment_name: str
    equipment_image_url: str | None = None
    equipment_category: str | None = None
    department_name: str
    start_date: date
    end_date: date
    quantity: int
    purpose: str | None = None
    status: str
    created_at: datetime

    @staticmethod
    def from_models(rental, equipment, applicant) -> "RentalOut":
        return RentalOut(
            id=rental.id,
            student_name=applicant.name,
            student_id=applicant.student_id,
            student_department=applicant.department.value,
            equipment_id=equipment.id,
            equipment_name=equipment.name,
            equipment_image_url=equipment.image_url,
            equipment_category=equipment.category,
            department_name=equipment.department.value,
            start_date=rental.start_date,
            end_date=rental.end_date,
            quantity=rental.quantity,
            purpose=rental.reason,
            status=STATUS_TO_FRONTEND.get(rental.status.value, rental.status.value.lower()),
            created_at=rental.created_at,
        )
