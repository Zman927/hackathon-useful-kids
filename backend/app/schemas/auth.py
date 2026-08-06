from pydantic import BaseModel

from app.models.enums import Department, Role


class LoginRequest(BaseModel):
    student_id: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    student_id: str | None = None
    role: Role | None = None
    department: Department | None = None
