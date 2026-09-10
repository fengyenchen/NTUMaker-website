from __future__ import annotations

import json
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.content import SocialPost, SocialPostImage, SocialPostStatus
from app.services.r2 import public_image_url
from app.services.social_tokens import get_social_access_token


class SocialPublishError(RuntimeError):
    """Raised when a platform cannot publish a social post."""


def _settings():
    settings = get_settings()
    return settings


def _endpoint(path: str, *, base_url: str | None = None, version: str | None = None) -> str:
    settings = _settings()
    host = (base_url or settings.meta_graph_base_url).rstrip("/")
    api_version = version or settings.meta_api_version
    return f"{host}/{api_version}/{path.lstrip('/')}"


def _post(path: str, *, token: str, data: dict[str, str], base_url: str | None = None, version: str | None = None) -> dict:
    payload = {**data, "access_token": token}
    try:
        response = httpx.post(_endpoint(path, base_url=base_url, version=version), data=payload, timeout=45)
        response.raise_for_status()
        body = response.json()
    except (httpx.HTTPError, ValueError) as error:
        detail = response.text[:500] if "response" in locals() else str(error)
        raise SocialPublishError(detail) from error
    if not isinstance(body, dict):
        raise SocialPublishError("Meta API 回傳格式不正確")
    if body.get("error"):
        raise SocialPublishError(str(body["error"]))
    return body


def _image_urls(images: list[SocialPostImage]) -> list[str]:
    if not images:
        return []
    try:
        return [public_image_url(image.r2_object_key) for image in images]
    except Exception as error:
        raise SocialPublishError(str(error)) from error


def _publish_instagram(post: SocialPost, images: list[SocialPostImage]) -> str:
    settings = _settings()
    instagram_token = get_social_access_token("instagram")
    if not settings.instagram_user_id or not instagram_token:
        raise SocialPublishError("尚未設定 INSTAGRAM_USER_ID 或 INSTAGRAM_ACCESS_TOKEN")
    urls = _image_urls(images)
    if not urls:
        raise SocialPublishError("Instagram 貼文至少需要一張圖片")
    if len(urls) > 10:
        raise SocialPublishError("Instagram 輪播貼文最多 10 張圖片")

    if len(urls) == 1:
        container = _post(f"{settings.instagram_user_id}/media", token=instagram_token, data={"image_url": urls[0], "caption": post.caption, "media_type": "IMAGE"}, base_url=settings.instagram_api_base_url)
    else:
        children = []
        for url in urls:
            child = _post(f"{settings.instagram_user_id}/media", token=instagram_token, data={"image_url": url, "media_type": "IMAGE", "is_carousel_item": "true"}, base_url=settings.instagram_api_base_url)
            children.append(str(child.get("id", "")))
        if not all(children):
            raise SocialPublishError("Instagram 圖片容器建立失敗")
        container = _post(f"{settings.instagram_user_id}/media", token=instagram_token, data={"media_type": "CAROUSEL", "children": ",".join(children), "caption": post.caption}, base_url=settings.instagram_api_base_url)
    creation_id = container.get("id")
    if not creation_id:
        raise SocialPublishError("Instagram 貼文容器未回傳 ID")
    published = _post(f"{settings.instagram_user_id}/media_publish", token=instagram_token, data={"creation_id": str(creation_id)}, base_url=settings.instagram_api_base_url)
    return str(published.get("id", creation_id))


def _publish_facebook(post: SocialPost, images: list[SocialPostImage]) -> str:
    settings = _settings()
    facebook_token = get_social_access_token("facebook")
    if not settings.facebook_page_id or not facebook_token:
        raise SocialPublishError("尚未設定 FACEBOOK_PAGE_ID 或 FACEBOOK_PAGE_ACCESS_TOKEN")
    urls = _image_urls(images)
    if not urls:
        result = _post(f"{settings.facebook_page_id}/feed", token=facebook_token, data={"message": post.caption})
        return str(result.get("id", ""))

    attached_media = []
    for url in urls:
        photo = _post(f"{settings.facebook_page_id}/photos", token=facebook_token, data={"url": url, "published": "false"})
        photo_id = photo.get("id")
        if not photo_id:
            raise SocialPublishError("Facebook 圖片上傳未回傳 ID")
        attached_media.append(json.dumps({"media_fbid": photo_id}))
    feed_data = {"message": post.caption}
    feed_data.update({f"attached_media[{index}]": media for index, media in enumerate(attached_media)})
    result = _post(f"{settings.facebook_page_id}/feed", token=facebook_token, data=feed_data)
    return str(result.get("id", ""))


def _publish_threads(post: SocialPost, images: list[SocialPostImage]) -> str:
    settings = _settings()
    threads_token = get_social_access_token("threads")
    if not settings.threads_user_id or not threads_token:
        raise SocialPublishError("尚未設定 THREADS_USER_ID 或 THREADS_ACCESS_TOKEN")
    urls = _image_urls(images)
    if not urls:
        container = _post(f"{settings.threads_user_id}/threads", token=threads_token, data={"media_type": "TEXT", "text": post.caption}, base_url=settings.threads_api_base_url, version=settings.threads_api_version)
    elif len(urls) == 1:
        container = _post(f"{settings.threads_user_id}/threads", token=threads_token, data={"media_type": "IMAGE", "image_url": urls[0], "text": post.caption}, base_url=settings.threads_api_base_url, version=settings.threads_api_version)
    else:
        children = []
        for url in urls[:10]:
            child = _post(f"{settings.threads_user_id}/threads", token=threads_token, data={"media_type": "IMAGE", "image_url": url, "is_carousel_item": "true"}, base_url=settings.threads_api_base_url, version=settings.threads_api_version)
            children.append(str(child.get("id", "")))
        container = _post(f"{settings.threads_user_id}/threads", token=threads_token, data={"media_type": "CAROUSEL", "children": ",".join(children), "text": post.caption}, base_url=settings.threads_api_base_url, version=settings.threads_api_version)
    creation_id = container.get("id")
    if not creation_id:
        raise SocialPublishError("Threads 貼文容器未回傳 ID")
    published = _post(f"{settings.threads_user_id}/threads_publish", token=threads_token, data={"creation_id": str(creation_id)}, base_url=settings.threads_api_base_url, version=settings.threads_api_version)
    return str(published.get("id", creation_id))


def publish_social_post(post: SocialPost) -> dict[str, str]:
    images = sorted(post.images, key=lambda image: image.order_index)
    publication_ids: dict[str, str] = {}
    for platform in post.platforms:
        if platform == "instagram":
            publication_ids[platform] = _publish_instagram(post, images)
        elif platform == "facebook":
            publication_ids[platform] = _publish_facebook(post, images)
        elif platform == "threads":
            publication_ids[platform] = _publish_threads(post, images)
        else:
            raise SocialPublishError(f"不支援的平台：{platform}")
    return publication_ids


def dry_run_social_post(post: SocialPost) -> dict:
    """Validate a post and return the planned platform actions without network calls."""
    settings = _settings()
    images = sorted(post.images, key=lambda image: image.order_index)
    urls = _image_urls(images) if images else []
    actions = []
    for platform in post.platforms:
        if platform == "instagram":
            if not settings.instagram_user_id or not get_social_access_token("instagram"):
                raise SocialPublishError("尚未設定 INSTAGRAM_USER_ID 或 INSTAGRAM_ACCESS_TOKEN")
            if not urls:
                raise SocialPublishError("Instagram 貼文至少需要一張圖片")
            actions.append({"platform": platform, "media_count": len(urls), "mode": "carousel" if len(urls) > 1 else "image"})
        elif platform == "facebook":
            if not settings.facebook_page_id or not get_social_access_token("facebook"):
                raise SocialPublishError("尚未設定 FACEBOOK_PAGE_ID 或 FACEBOOK_PAGE_ACCESS_TOKEN")
            actions.append({"platform": platform, "media_count": len(urls), "mode": "photos" if urls else "text"})
        elif platform == "threads":
            if not settings.threads_user_id or not get_social_access_token("threads"):
                raise SocialPublishError("尚未設定 THREADS_USER_ID 或 THREADS_ACCESS_TOKEN")
            actions.append({"platform": platform, "media_count": len(urls), "mode": "carousel" if len(urls) > 1 else "image" if urls else "text"})
        else:
            raise SocialPublishError(f"不支援的平台：{platform}")
    return {"dry_run": True, "post_id": str(post.id), "caption_length": len(post.caption), "image_count": len(urls), "actions": actions}


def publish_due_social_posts() -> int:
    now = datetime.now(timezone.utc)
    published_count = 0
    with SessionLocal() as db:
        posts = db.scalars(
            select(SocialPost)
            .options(selectinload(SocialPost.images))
            .where(SocialPost.status == SocialPostStatus.SCHEDULED, SocialPost.scheduled_at <= now)
            .order_by(SocialPost.scheduled_at)
            .limit(10)
        ).all()
        for post in posts:
            try:
                publish_social_post(post)
                post.status = SocialPostStatus.PUBLISHED
                post.published_at = now
                post.error_message = None
                published_count += 1
            except Exception as error:
                post.status = SocialPostStatus.FAILED
                post.error_message = str(error)[:2000]
        db.commit()
    return published_count
