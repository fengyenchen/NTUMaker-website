import asyncio
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, auth, content
from app.core.config import get_settings
from app.services.social_publisher import publish_due_social_posts
from app.services.r2_cleanup import cleanup_unreferenced_r2_images
from app.services.social_tokens import check_and_refresh_social_tokens

settings = get_settings()


async def _social_scheduler() -> None:
    last_cleanup_at = 0.0
    last_token_check_at = 0.0
    while True:
        try:
            await asyncio.to_thread(publish_due_social_posts)
        except Exception:
            # A failed polling cycle must not stop future scheduled posts.
            pass
        if time.monotonic() - last_token_check_at >= max(300, settings.social_token_check_interval_seconds):
            try:
                await asyncio.to_thread(check_and_refresh_social_tokens)
            except Exception:
                # Token 狀態會留在資料庫，下一個週期再檢查。
                pass
            last_token_check_at = time.monotonic()
        if settings.r2_cleanup_enabled and time.monotonic() - last_cleanup_at >= max(60, settings.r2_cleanup_interval_seconds):
            try:
                await asyncio.to_thread(cleanup_unreferenced_r2_images)
            except Exception:
                # R2 暫時不可用時，下一個週期再試，不影響排程發文。
                pass
            last_cleanup_at = time.monotonic()
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
