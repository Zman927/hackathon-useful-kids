from datetime import datetime

from pydantic import BaseModel

from app.models.enums import Role

ROLE_TO_FRONTEND = {
    Role.ASSISTANT: "admin",
    Role.STUDENT: "student",
}


class UserOut(BaseModel):
    id: int
    student_id: str
    name: str
    department: str
    role: str
    created_at: datetime

    @staticmethod
    def from_user(user) -> "UserOut":
        return UserOut(
            id=user.id,
            student_id=user.student_id,
            name=user.name,
            department=user.department.value,
            role=ROLE_TO_FRONTEND[user.role],
            created_at=user.created_at,
        )
