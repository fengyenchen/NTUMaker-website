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
    admin_email: EmailStr | None = None
    admin_password: str | None = None
    r2_account_id: str | None = None
    r2_bucket_name: str | None = None
    r2_endpoint: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_public_url: str | None = None
    meta_api_version: str = "v25.0"
    meta_graph_base_url: str = "https://graph.facebook.com"
    instagram_api_base_url: str = "https://graph.facebook.com"
    threads_api_base_url: str = "https://graph.threads.net"
    threads_api_version: str = "v1.0"
    instagram_user_id: str | None = None
    instagram_access_token: str | None = None
    facebook_page_id: str | None = None
    facebook_page_access_token: str | None = None
    threads_user_id: str | None = None
    threads_access_token: str | None = None
    social_scheduler_enabled: bool = True
    social_scheduler_interval_seconds: int = 30
    r2_cleanup_enabled: bool = True
    r2_cleanup_interval_seconds: int = 86400
    r2_cleanup_grace_seconds: int = 86400

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
