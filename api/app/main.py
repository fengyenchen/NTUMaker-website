from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, content
from app.core.config import get_settings

settings = get_settings()
app = FastAPI(
    title="NTUMaker 後端 API",
    description="提供社團公告、社課教材、社員權限與管理功能。",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(content.router, prefix=settings.api_prefix)


@app.get("/api/v1/health", tags=["系統"], summary="健康檢查")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "NTUMaker API"}
