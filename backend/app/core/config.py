from functools import lru_cache

from pydantic import EmailStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """應用程式設定，正式環境由 backend/.env 或部署平台注入。"""

    app_name: str = "NTUMaker API"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    frontend_url: str = "http://localhost:3000"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/ntumaker"
    session_secret: str = "development-only-secret-please-replace"
    email_from: EmailStr = "no-reply@example.com"
    resend_api_key: str | None = None
    admin_email: EmailStr | None = None

    @field_validator("database_url", mode="before")
    @classmethod
    def use_psycopg_v3(cls, value: object) -> object:
        """Neon 的標準網址未指定驅動，統一交給已安裝的 psycopg v3。"""
        if isinstance(value, str):
            if value.startswith("postgresql://"):
                return value.replace("postgresql://", "postgresql+psycopg://", 1)
            if value.startswith("postgres://"):
                return value.replace("postgres://", "postgresql+psycopg://", 1)
        return value

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
