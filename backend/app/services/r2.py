import uuid

import boto3
from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings


def _client():
    settings = get_settings()
    if not all((settings.r2_endpoint, settings.r2_access_key_id, settings.r2_secret_access_key, settings.r2_bucket_name, settings.r2_public_url)):
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
    return {"r2_object_key": key, "public_url": f"{get_settings().r2_public_url.rstrip('/')}/{key}", "image_name": file.filename or "image", "image_mime_type": file.content_type}
