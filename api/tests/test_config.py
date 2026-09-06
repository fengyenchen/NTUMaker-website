from app.core.config import Settings


def test_neon_database_url_uses_psycopg_v3() -> None:
    settings = Settings(database_url="postgresql://user:password@example.com/database?sslmode=require")

    assert settings.database_url.startswith("postgresql+psycopg://")
