from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=200)


class LoginSucceeded(BaseModel):
    message: str
    redirect_to: str


class CurrentUser(BaseModel):
    id: str
    email: EmailStr
    display_name: str | None
    roles: list[str]
    membership_expires_at: str | None
