from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from urllib.parse import unquote, urlsplit

from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.content import Announcement, Resource, SocialPostImage
from app.services.r2 import delete_image, list_image_objects


MARKDOWN_IMAGE_RE = re.compile(r"!\[[^\]]*\]\(([^)\s]+)(?:\s+['\"][^)]*['\"])?\)")
PROXY_PREFIX = "/api/v1/content/assets/"


def _object_key_from_url(raw_url: str | None) -> str | None:
    if not raw_url:
        return None
    value = raw_url.strip().strip("<>")
    settings = get_settings()
    public_prefix = f"{(settings.r2_public_url or '').rstrip('/')}/"
    if public_prefix and value.startswith(public_prefix):
        return unquote(value[len(public_prefix):].split("?", 1)[0])
    path = urlsplit(value).path
    if path.startswith(PROXY_PREFIX):
        return unquote(path[len(PROXY_PREFIX):])
    return None


def _referenced_keys() -> set[str]:
    with SessionLocal() as db:
        keys = set(db.scalars(select(SocialPostImage.r2_object_key)))
        for body in db.scalars(select(Announcement.body)):
            for match in MARKDOWN_IMAGE_RE.finditer(body or ""):
                key = _object_key_from_url(match.group(1))
                if key:
                    keys.add(key)
        for url in db.scalars(select(Resource.url)):
            key = _object_key_from_url(url)
            if key:
                keys.add(key)
        return keys


def cleanup_unreferenced_r2_images() -> int:
    """刪除超過保留時間且沒有被任何內容引用的社群或教材檔案。"""
    settings = get_settings()
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=max(0, settings.r2_cleanup_grace_seconds))
    referenced = _referenced_keys()
    deleted = 0
    for prefix in ("social/", "resources/"):
        for item in list_image_objects(prefix):
            key = item.get("Key")
            last_modified = item.get("LastModified")
            if not key or key in referenced or not last_modified:
                continue
            if last_modified.tzinfo is None:
                last_modified = last_modified.replace(tzinfo=timezone.utc)
            if last_modified >= cutoff:
                continue
            try:
                delete_image(key)
                deleted += 1
            except Exception:
                # 單一物件刪除失敗不應中斷後續清理。
                continue
    return deleted
