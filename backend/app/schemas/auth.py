from pydantic import BaseModel


class LoginRequest(BaseModel):
    student_id: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    user_id: str
    user_name: str
    role: str
