import uuid

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
