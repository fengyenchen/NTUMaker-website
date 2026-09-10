from __future__ import annotations

from datetime import datetime, timedelta, timezone
from hashlib import sha256

import httpx
from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.content import SocialToken

TOKEN_ENV_KEYS = {
    "instagram": "instagram_access_token",
    "facebook": "facebook_page_access_token",
    "threads": "threads_access_token",
}


def get_social_access_token(platform: str) -> str | None:
    """Use the persisted refreshed token, falling back to the deployment secret."""
    with SessionLocal() as db:
        token = db.scalar(select(SocialToken).where(SocialToken.platform == platform))
        if token and token.access_token:
            return token.access_token
    return getattr(get_settings(), TOKEN_ENV_KEYS[platform], None)


def _refresh_endpoint(platform: str) -> tuple[str, str | None] | None:
    settings = get_settings()
    if platform == "instagram":
        return (
            f"{settings.instagram_api_base_url.rstrip('/')}/refresh_access_token",
            settings.instagram_app_secret,
        )
    if platform == "threads":
        return (
            f"{settings.threads_api_base_url.rstrip('/')}/refresh_access_token",
            settings.threads_app_secret,
        )
    return None


def _refresh_token(platform: str, token: str) -> tuple[str, datetime | None]:
    endpoint = _refresh_endpoint(platform)
    if not endpoint:
        raise RuntimeError("尚未設定可用的 Token 更新憑證")
    url, _app_secret = endpoint
    grant_type = "ig_refresh_token" if platform == "instagram" else "th_refresh_token"
    response = httpx.get(
        url,
        params={"grant_type": grant_type, "access_token": token},
        timeout=20,
    )
    response.raise_for_status()
    body = response.json()
    if body.get("error") or not body.get("access_token"):
        raise RuntimeError(str(body.get("error") or "Meta 沒有回傳新 Token"))
    expires_at = None
    if body.get("expires_in"):
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(body["expires_in"]))
    return str(body["access_token"]), expires_at


def check_and_refresh_social_tokens() -> None:
    """Check configured Meta tokens and refresh supported long-lived tokens."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    refresh_before = timedelta(seconds=max(3600, settings.social_token_refresh_before_seconds))

    with SessionLocal() as db:
        for platform, env_key in TOKEN_ENV_KEYS.items():
            configured_token = getattr(settings, env_key, None)
            if not configured_token:
                continue
            state = db.scalar(select(SocialToken).where(SocialToken.platform == platform))
            if not state:
                state = SocialToken(
                    platform=platform,
                    access_token=configured_token,
                    source_token_hash=sha256(configured_token.encode()).hexdigest(),
                )
                db.add(state)
                db.flush()
            elif state.source_token_hash != sha256(configured_token.encode()).hexdigest():
                # A changed deployment secret means the administrator re-authorized the app.
                state.access_token = configured_token
                state.source_token_hash = sha256(configured_token.encode()).hexdigest()
                state.expires_at = None

            # A newly configured deployment token seeds the database once.
            token = state.access_token
            state.last_checked_at = now
            state.last_error = None
            try:
                if platform in {"instagram", "threads"}:
                    new_token, expires_at = _refresh_token(platform, token)
                    state.access_token = new_token
                    state.expires_at = expires_at
                elif settings.meta_app_id and settings.meta_app_secret:
                    response = httpx.get(
                        f"{settings.meta_graph_base_url.rstrip('/')}/{settings.meta_api_version}/debug_token",
                        params={
                            "input_token": token,
                            "access_token": f"{settings.meta_app_id}|{settings.meta_app_secret}",
                        },
                        timeout=20,
                    )
                    response.raise_for_status()
                    data = response.json().get("data", {})
                    if not data.get("is_valid"):
                        raise RuntimeError("Token 已失效，請重新授權 Facebook Page")
                    expiration = data.get("expires_at")
                    state.expires_at = datetime.fromtimestamp(expiration, timezone.utc) if expiration else None
                    if state.expires_at and state.expires_at - now <= refresh_before:
                        state.last_error = "Facebook Page Token 即將到期，請重新授權"
            except Exception as error:
                state.last_error = str(error)[:2000]
        db.commit()
