from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr


class LoginRequested(BaseModel):
    message: str
    development_token: str | None = None


class CurrentUser(BaseModel):
    id: str
    email: EmailStr
    display_name: str | None
    roles: list[str]
    membership_expires_at: str | None
