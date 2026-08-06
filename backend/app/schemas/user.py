from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import Department, Role


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: str
    name: str
    department: Department
    role: Role
    created_at: datetime
