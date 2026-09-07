from pydantic import BaseModel, EmailStr, Field, field_validator


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


class CurrentUserUpdate(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("顯示名稱不可空白")
        return normalized
