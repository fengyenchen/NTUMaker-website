import uuid
from pathlib import PurePath

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings


def _client():
    settings = get_settings()
    if not all((settings.r2_endpoint, settings.r2_access_key_id, settings.r2_secret_access_key, settings.r2_bucket_name)):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Cloudflare R2 尚未完整設定")
    return boto3.client("s3", endpoint_url=settings.r2_endpoint, aws_access_key_id=settings.r2_access_key_id, aws_secret_access_key=settings.r2_secret_access_key, region_name="auto")


def upload_image(file: UploadFile) -> dict[str, str]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="只接受圖片檔案")
    data = file.file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="圖片不可超過 10 MB")
    key = f"social/{uuid.uuid4()}-{file.filename or 'image'}"
    _client().put_object(Bucket=get_settings().r2_bucket_name, Key=key, Body=data, ContentType=file.content_type)
    public_url = get_settings().r2_public_url
    return {"r2_object_key": key, "public_url": f"{public_url.rstrip('/')}/{key}" if public_url else "", "image_name": file.filename or "image", "image_mime_type": file.content_type}


def upload_resource_file(file: UploadFile) -> dict[str, str]:
    """上傳社課教材圖片或常見文件，與社群圖片分開存放。"""
    content_type = file.content_type or "application/octet-stream"
    allowed_types = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "application/zip",
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/ogg",
    }
    if not (content_type.startswith("image/") or content_type in allowed_types):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="只接受圖片、影片或常見文件（PDF、Word、Excel、PowerPoint、ZIP、文字檔）")
    data = file.file.read()
    if len(data) > 50 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="教材檔案不可超過 50 MB")
    filename = PurePath(file.filename or "file").name
    key = f"resources/{uuid.uuid4()}-{filename}"
    _client().put_object(Bucket=get_settings().r2_bucket_name, Key=key, Body=data, ContentType=content_type)
    public_url = get_settings().r2_public_url
    return {"r2_object_key": key, "public_url": f"{public_url.rstrip('/')}/{key}" if public_url else "", "image_name": filename, "image_mime_type": content_type}


def read_image(key: str) -> tuple[bytes, str | None]:
    try:
        response = _client().get_object(Bucket=get_settings().r2_bucket_name, Key=key)
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") in {"NoSuchKey", "404", "NotFound"}:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到圖片") from error
        raise
    return response["Body"].read(), response.get("ContentType")


def delete_image(key: str) -> None:
    _client().delete_object(Bucket=get_settings().r2_bucket_name, Key=key)


def list_image_objects(prefix: str = "social/") -> list[dict]:
    """列出 R2 圖片物件，使用分頁避免超過單次回傳上限。"""
    client = _client()
    settings = get_settings()
    objects: list[dict] = []
    continuation_token: str | None = None
    while True:
        params: dict[str, str] = {"Bucket": settings.r2_bucket_name, "Prefix": prefix}
        if continuation_token:
            params["ContinuationToken"] = continuation_token
        response = client.list_objects_v2(**params)
        objects.extend(response.get("Contents", []))
        if not response.get("IsTruncated"):
            return objects
        continuation_token = response.get("NextContinuationToken")
        if not continuation_token:
            return objects


def public_image_url(key: str) -> str:
    public_url = get_settings().r2_public_url
    if not public_url:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="R2_PUBLIC_URL 尚未設定，無法讓社群平台讀取圖片")
    return f"{public_url.rstrip('/')}/{key}"
