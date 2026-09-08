import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, auth, content
from app.core.config import get_settings
from app.services.social_publisher import publish_due_social_posts

settings = get_settings()


async def _social_scheduler() -> None:
    while True:
        try:
            await asyncio.to_thread(publish_due_social_posts)
        except Exception:
            # A failed polling cycle must not stop future scheduled posts.
            pass
        await asyncio.sleep(max(10, settings.social_scheduler_interval_seconds))


@asynccontextmanager
async def lifespan(_: FastAPI):
    scheduler = asyncio.create_task(_social_scheduler()) if settings.social_scheduler_enabled else None
    try:
        yield
    finally:
        if scheduler:
            scheduler.cancel()
            await asyncio.gather(scheduler, return_exceptions=True)


app = FastAPI(
    title="NTUMaker 後端 API",
    description="提供社團公告、社課教材、社員權限與管理功能。",
    version="0.1.0",
    lifespan=lifespan,
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
app.include_router(admin.router, prefix=settings.api_prefix)


@app.get("/api/v1/health", tags=["系統"], summary="健康檢查")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "NTUMaker API"}
