from datetime import datetime, timedelta, timezone
from uuid import UUID
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.content import Announcement, CourseSeries, CourseSession, PublishStatus, Resource, SiteSetting, SocialPost, SocialPostImage, SocialPostStatus, Visibility
from app.models.user import Membership, Role, User, UserRole
from app.schemas.admin import (
    AdminUserSummary,
    AnnouncementAdminSummary,
    AnnouncementWrite,
    CourseSeriesAdminSummary,
    CourseSeriesWrite,
    CourseSessionWrite,
    MemberUpdate,
    MemberWrite,
    ResourceAdminSummary,
    ResourceWrite,
    SiteSettingSummary,
    SiteSettingWrite,
    SocialPostImageOrderUpdate,
    SocialPostImageSummary,
    SocialPostSummary,
    SocialPostUpdate,
    SocialPostWrite,
)
from app.schemas.content import CourseSeriesSummary, CourseSessionSummary
from app.services.memberships import taipei_today
from app.services.passwords import hash_password
from app.services.r2 import delete_image, read_image, upload_image
from app.services.social_publisher import SocialPublishError, dry_run_social_post, publish_social_post

router = APIRouter(prefix="/admin", tags=["管理後台"], dependencies=[Depends(require_admin)])

PUBLISH_STATUS_LABELS = {
    PublishStatus.DRAFT: "草稿",
    PublishStatus.PUBLISHED: "已發布",
    PublishStatus.ARCHIVED: "已封存",
}

@router.get("/overview", summary="取得管理後台總覽")
def get_overview(db: Session = Depends(get_db)) -> dict:
    today = taipei_today()
    active_members = db.scalar(
        select(func.count(distinct(Membership.user_id)))
        .join(User, User.id == Membership.user_id)
        .where(User.is_active.is_(True), Membership.starts_at <= today, Membership.expires_at >= today)
    ) or 0
    expiring_members = db.scalar(
        select(func.count(distinct(Membership.user_id)))
        .join(User, User.id == Membership.user_id)
        .where(User.is_active.is_(True), Membership.expires_at >= today, Membership.expires_at <= today + timedelta(days=30))
    ) or 0
    current_semester = db.scalar(select(CourseSeries.semester).order_by(CourseSeries.semester.desc()).limit(1)) or ""
    semester_sessions = db.scalar(
        select(func.count(CourseSession.id)).join(CourseSeries).where(CourseSeries.semester == current_semester)
    ) or 0
    published_resources = db.scalar(select(func.count(Resource.id))) or 0
    member_resources = db.scalar(select(func.count(Resource.id)).where(Resource.visibility == Visibility.MEMBER)) or 0
    next_session = db.scalar(
        select(CourseSession).join(CourseSeries).where(CourseSeries.semester == current_semester, CourseSession.starts_at >= datetime.now(timezone.utc)).order_by(CourseSession.starts_at).limit(1)
    )
    recent = [
        {"title": item.title, "type": "公告", "visibility": "公開", "status": PUBLISH_STATUS_LABELS[item.status], "updated_at": item.updated_at}
        for item in db.scalars(select(Announcement).order_by(Announcement.updated_at.desc()).limit(3))
    ]
    recent.extend(
        {"title": item.title, "type": "資源", "visibility": "社員限定" if item.visibility == Visibility.MEMBER else "公開", "status": "已發布", "updated_at": item.created_at}
        for item in db.scalars(select(Resource).order_by(Resource.created_at.desc()).limit(3))
    )
    recent.sort(key=lambda item: item["updated_at"], reverse=True)
    return {
        "active_members": active_members,
        "expiring_members": expiring_members,
        "current_semester": current_semester,
        "semester_sessions": semester_sessions,
        "published_resources": published_resources,
        "member_resources": member_resources,
        "next_session": {"title": next_session.title, "starts_at": next_session.starts_at} if next_session else None,
        "recent": recent[:5],
    }


@router.post("/uploads/images", summary="上傳管理後台圖片")
def upload_admin_image(file: UploadFile = File(...)) -> dict[str, str]:
    uploaded = upload_image(file)
    public_url = uploaded["public_url"]
    return {
        "url": public_url or f"/api/v1/content/assets/{quote(uploaded['r2_object_key'], safe='/')}" ,
        "r2_object_key": uploaded["r2_object_key"],
        "image_name": uploaded["image_name"],
        "image_mime_type": uploaded["image_mime_type"],
    }


@router.get("/settings", response_model=list[SiteSettingSummary], summary="列出網站文字設定")
def list_settings(db: Session = Depends(get_db)) -> list[SiteSetting]:
    return list(db.scalars(select(SiteSetting).order_by(SiteSetting.sort_order, SiteSetting.key)))


@router.put("/settings/{key}", response_model=SiteSettingSummary, summary="更新網站文字設定")
def update_setting(key: str, payload: SiteSettingWrite, db: Session = Depends(get_db)) -> SiteSetting:
    item = db.get(SiteSetting, key)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到網站設定")
    item.value = payload.value
    db.commit()
    db.refresh(item)
    return item


def serialize_social_post(item: SocialPost) -> SocialPostSummary:
    return SocialPostSummary(
        id=item.id,
        caption=item.caption,
        platforms=item.platforms,
        images=[
            SocialPostImageSummary(
                id=image.id,
                r2_object_key=image.r2_object_key,
                image_name=image.image_name,
                image_mime_type=image.image_mime_type,
                order_index=image.order_index,
                image_url=f"/api/v1/admin/social-posts/{item.id}/images/{image.id}/preview",
            )
            for image in item.images
        ],
        scheduled_at=item.scheduled_at,
        status=item.status,
        published_at=item.published_at,
        error_message=item.error_message,
        created_at=item.created_at,
    )


@router.get("/social-posts", response_model=list[SocialPostSummary], summary="列出社群貼文")
def list_social_posts(db: Session = Depends(get_db)) -> list[SocialPostSummary]:
    posts = db.scalars(select(SocialPost).options(selectinload(SocialPost.images)).order_by(SocialPost.created_at.desc()))
    return [serialize_social_post(item) for item in posts]


@router.get("/social-posts/{item_id}", response_model=SocialPostSummary, summary="取得社群草稿或排程")
def get_social_post(item_id: UUID, db: Session = Depends(get_db)) -> SocialPostSummary:
    item = db.scalar(select(SocialPost).options(selectinload(SocialPost.images)).where(SocialPost.id == item_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到社群草稿")
    return serialize_social_post(item)


@router.post("/social-posts", response_model=SocialPostSummary, status_code=status.HTTP_201_CREATED, summary="建立社群貼文草稿或排程")
def create_social_post(payload: SocialPostWrite, db: Session = Depends(get_db)) -> SocialPostSummary:
    allowed = {"instagram", "facebook", "threads"}
    platforms = list(dict.fromkeys(payload.platforms))
    if not set(platforms).issubset(allowed):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="包含不支援的發布平台")
    if payload.status == SocialPostStatus.SCHEDULED and payload.scheduled_at is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="排程貼文必須設定排程時間")
    if payload.status == SocialPostStatus.SCHEDULED and not payload.caption.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="排程貼文必須輸入貼文文字")
    item = SocialPost(caption=payload.caption, platforms=platforms, scheduled_at=payload.scheduled_at, status=payload.status)
    item.images = [SocialPostImage(r2_object_key=image.r2_object_key, image_name=image.image_name, image_mime_type=image.image_mime_type, order_index=index) for index, image in enumerate(payload.images)]
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_social_post(item)


@router.put("/social-posts/{item_id}", response_model=SocialPostSummary, summary="編輯社群草稿或排程")
def update_social_post(item_id: UUID, payload: SocialPostUpdate, db: Session = Depends(get_db)) -> SocialPostSummary:
    item = db.scalar(select(SocialPost).options(selectinload(SocialPost.images)).where(SocialPost.id == item_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到社群草稿")
    allowed = {"instagram", "facebook", "threads"}
    platforms = list(dict.fromkeys(payload.platforms))
    if not set(platforms).issubset(allowed):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="包含不支援的發布平台")
    if payload.status == SocialPostStatus.SCHEDULED and payload.scheduled_at is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="排程貼文必須設定排程時間")
    if payload.status == SocialPostStatus.SCHEDULED and not payload.caption.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="排程貼文必須輸入貼文文字")
    item.caption = payload.caption
    item.platforms = platforms
    item.scheduled_at = payload.scheduled_at
    item.status = payload.status
    db.commit()
    db.refresh(item)
    return serialize_social_post(item)


@router.post("/social-posts/{item_id}/images", response_model=SocialPostImageSummary, status_code=status.HTTP_201_CREATED, summary="為既有社群草稿上傳圖片")
def add_social_post_image(item_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db)) -> SocialPostImage:
    item = db.scalar(select(SocialPost).options(selectinload(SocialPost.images)).where(SocialPost.id == item_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到社群草稿")
    if len(item.images) >= 10:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="一則貼文最多 10 張照片")

    uploaded = upload_image(file)
    image = SocialPostImage(
        r2_object_key=uploaded["r2_object_key"],
        image_name=uploaded["image_name"],
        image_mime_type=uploaded["image_mime_type"],
        order_index=len(item.images),
    )
    item.images.append(image)
    db.commit()
    db.refresh(image)
    return image


@router.put("/social-posts/{item_id}/images/order", response_model=SocialPostSummary, summary="更新社群圖片順序")
def reorder_social_post_images(item_id: UUID, payload: SocialPostImageOrderUpdate, db: Session = Depends(get_db)) -> SocialPostSummary:
    item = db.scalar(select(SocialPost).options(selectinload(SocialPost.images)).where(SocialPost.id == item_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到社群草稿")
    current_ids = {image.id for image in item.images}
    requested_ids = payload.image_ids
    if len(requested_ids) != len(current_ids) or set(requested_ids) != current_ids:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="圖片順序資料不完整")
    images_by_id = {image.id: image for image in item.images}
    for index, image_id in enumerate(requested_ids):
        images_by_id[image_id].order_index = index
    item.images.sort(key=lambda image: image.order_index)
    db.commit()
    db.refresh(item)
    return serialize_social_post(item)


@router.get("/social-posts/{item_id}/images/{image_id}/preview", summary="預覽社群圖片")
def preview_social_post_image(item_id: UUID, image_id: UUID, db: Session = Depends(get_db)) -> Response:
    image = db.scalar(select(SocialPostImage).where(SocialPostImage.id == image_id, SocialPostImage.post_id == item_id))
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到圖片")
    data, content_type = read_image(image.r2_object_key)
    return Response(content=data, media_type=content_type or image.image_mime_type, headers={"Cache-Control": "private, max-age=3600"})


@router.delete("/social-posts/{item_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT, summary="刪除社群圖片")
def delete_social_post_image(item_id: UUID, image_id: UUID, db: Session = Depends(get_db)) -> None:
    image = db.scalar(select(SocialPostImage).where(SocialPostImage.id == image_id, SocialPostImage.post_id == item_id))
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到圖片")
    delete_image(image.r2_object_key)
    db.delete(image)
    db.commit()


@router.delete("/social-posts/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="刪除社群貼文")
def delete_social_post(item_id: UUID, db: Session = Depends(get_db)) -> None:
    item = db.scalar(select(SocialPost).options(selectinload(SocialPost.images)).where(SocialPost.id == item_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到社群貼文")
    for image in item.images:
        delete_image(image.r2_object_key)
    db.delete(item)
    db.commit()


@router.post("/social-posts/{item_id}/publish", response_model=SocialPostSummary, summary="立即發布社群貼文")
def publish_social_post_now(item_id: UUID, db: Session = Depends(get_db)) -> SocialPostSummary:
    item = db.scalar(select(SocialPost).options(selectinload(SocialPost.images)).where(SocialPost.id == item_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到社群貼文")
    try:
        publish_social_post(item)
    except SocialPublishError as error:
        item.status = SocialPostStatus.FAILED
        item.error_message = str(error)[:2000]
        db.commit()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error
    item.status = SocialPostStatus.PUBLISHED
    item.published_at = datetime.now(timezone.utc)
    item.error_message = None
    db.commit()
    db.refresh(item)
    return serialize_social_post(item)


@router.post("/social-posts/{item_id}/publish-test", summary="測試社群發文設定（不會實際發布）")
def test_social_post_publish(item_id: UUID, db: Session = Depends(get_db)) -> dict:
    item = db.scalar(select(SocialPost).options(selectinload(SocialPost.images)).where(SocialPost.id == item_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到社群貼文")
    try:
        return dry_run_social_post(item)
    except SocialPublishError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error


def serialize_user(user: User) -> AdminUserSummary:
    membership = max(user.memberships, key=lambda item: item.expires_at, default=None)
    return AdminUserSummary(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_active=user.is_active,
        roles=[item.role.value for item in user.roles],
        membership_starts_at=membership.starts_at if membership else None,
        membership_expires_at=membership.expires_at if membership else None,
    )


def load_user(db: Session, user_id: UUID) -> User:
    user = db.scalar(select(User).options(selectinload(User.roles), selectinload(User.memberships)).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到使用者")
    return user


@router.get("/users", response_model=list[AdminUserSummary], summary="列出社員與管理員")
def list_users(db: Session = Depends(get_db)) -> list[AdminUserSummary]:
    users = db.scalars(select(User).options(selectinload(User.roles), selectinload(User.memberships)).order_by(User.email)).unique()
    return [serialize_user(user) for user in users]


@router.post("/users", response_model=AdminUserSummary, status_code=status.HTTP_201_CREATED, summary="新增社員")
def create_member(payload: MemberWrite, db: Session = Depends(get_db)) -> AdminUserSummary:
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="這個 Email 已存在")
    starts_at = taipei_today()
    if payload.expires_at < starts_at:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="結束日期不可早於今天")
    user = User(email=payload.email.lower(), display_name=payload.display_name)
    user.roles.append(UserRole(role=Role.MEMBER))
    if payload.is_admin:
        user.roles.append(UserRole(role=Role.ADMIN))
        user.password_hash = hash_password(payload.admin_password or "")
    user.memberships.append(Membership(starts_at=starts_at, expires_at=payload.expires_at, note=payload.note))
    db.add(user)
    db.commit()
    return serialize_user(load_user(db, user.id))


@router.patch("/users/{user_id}", response_model=AdminUserSummary, summary="更新社員資料")
def update_member(
    user_id: UUID,
    payload: MemberUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> AdminUserSummary:
    user = load_user(db, user_id)
    values = payload.model_dump(exclude_unset=True)
    if user.id == current_admin.id and (values.get("is_active") is False or values.get("is_admin") is False):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不可停用自己的帳號或移除自己的管理員權限")
    if "display_name" in values:
        user.display_name = values["display_name"]
    if "is_active" in values:
        user.is_active = values["is_active"]
    if payload.expires_at is not None:
        membership = max(user.memberships, key=lambda item: item.expires_at, default=None)
        if membership:
            if payload.expires_at < membership.starts_at:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="結束日期不可早於開始日期")
            membership.expires_at = payload.expires_at
        else:
            starts_at = taipei_today()
            if payload.expires_at < starts_at:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="結束日期不可早於今天")
            user.memberships.append(Membership(starts_at=starts_at, expires_at=payload.expires_at))
    if payload.is_admin is not None:
        admin_role = next((item for item in user.roles if item.role == Role.ADMIN), None)
        if payload.is_admin and not admin_role:
            if not user.password_hash and not payload.admin_password:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="授予管理員權限時必須設定至少 12 字元的密碼")
            user.roles.append(UserRole(role=Role.ADMIN))
        elif not payload.is_admin and admin_role:
            user.roles.remove(admin_role)
    if payload.admin_password:
        user.password_hash = hash_password(payload.admin_password)
    db.commit()
    return serialize_user(load_user(db, user.id))


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="刪除社員")
def delete_member(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> None:
    user = load_user(db, user_id)
    if user.id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不可刪除自己的管理員帳號")
    if any(item.role == Role.ADMIN for item in user.roles):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不可刪除管理員帳號")
    db.delete(user)
    db.commit()


@router.get("/announcements", response_model=list[AnnouncementAdminSummary], summary="列出所有公告")
def list_admin_announcements(db: Session = Depends(get_db)) -> list[Announcement]:
    return list(db.scalars(select(Announcement).order_by(Announcement.updated_at.desc())))


@router.post("/announcements", response_model=AnnouncementAdminSummary, status_code=status.HTTP_201_CREATED, summary="新增公告")
def create_announcement(payload: AnnouncementWrite, db: Session = Depends(get_db)) -> Announcement:
    if db.scalar(select(Announcement).where(Announcement.slug == payload.slug)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="公告網址代稱已存在")
    values = payload.model_dump()
    if payload.status == PublishStatus.PUBLISHED and payload.published_at is None:
        values["published_at"] = datetime.now(timezone.utc)
    item = Announcement(**values)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/announcements/{item_id}", response_model=AnnouncementAdminSummary, summary="更新公告")
def update_announcement(item_id: UUID, payload: AnnouncementWrite, db: Session = Depends(get_db)) -> Announcement:
    item = db.get(Announcement, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到公告")
    values = payload.model_dump()
    if payload.status == PublishStatus.PUBLISHED and payload.published_at is None:
        values["published_at"] = datetime.now(timezone.utc)
    for key, value in values.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/announcements/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="刪除公告")
def delete_announcement(item_id: UUID, db: Session = Depends(get_db)) -> None:
    item = db.get(Announcement, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到公告")
    db.delete(item)
    db.commit()


@router.post("/course-series", response_model=CourseSeriesSummary, status_code=status.HTTP_201_CREATED, summary="新增課程路線")
def create_course_series(payload: CourseSeriesWrite, db: Session = Depends(get_db)) -> CourseSeries:
    item = CourseSeries(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/course-library", response_model=list[CourseSeriesAdminSummary], summary="列出完整課程與教材")
def list_admin_course_library(db: Session = Depends(get_db)) -> list[dict]:
    series_list = db.scalars(
        select(CourseSeries)
        .options(selectinload(CourseSeries.sessions).selectinload(CourseSession.resources))
        .order_by(CourseSeries.semester.desc(), CourseSeries.track)
    ).unique()
    return [
        {
            "id": series.id,
            "title": series.title,
            "semester": series.semester,
            "track": series.track,
            "time": series.time,
            "description": series.description,
            "sessions": [
                {
                    "id": session.id,
                    "series_id": session.series_id,
                    "title": session.title,
                    "week_label": session.week_label,
                    "summary": session.summary,
                    "starts_at": session.starts_at,
                    "order_index": session.order_index,
                    "visibility": session.visibility,
                    "resources": sorted(session.resources, key=lambda resource: resource.created_at),
                }
                for session in sorted(series.sessions, key=lambda item: item.order_index)
            ],
        }
        for series in series_list
    ]


@router.put("/course-series/{item_id}", response_model=CourseSeriesSummary, summary="更新課程路線")
def update_course_series(item_id: UUID, payload: CourseSeriesWrite, db: Session = Depends(get_db)) -> CourseSeries:
    item = db.get(CourseSeries, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到課程路線")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/course-series/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="刪除課程路線")
def delete_course_series(item_id: UUID, db: Session = Depends(get_db)) -> None:
    item = db.get(CourseSeries, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到課程路線")
    db.delete(item)
    db.commit()


@router.post("/course-sessions", response_model=CourseSessionSummary, status_code=status.HTTP_201_CREATED, summary="新增單堂課")
def create_course_session(payload: CourseSessionWrite, db: Session = Depends(get_db)) -> CourseSession:
    if not db.get(CourseSeries, payload.series_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到課程路線")
    item = CourseSession(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/course-sessions/{item_id}", response_model=CourseSessionSummary, summary="更新單堂課")
def update_course_session(item_id: UUID, payload: CourseSessionWrite, db: Session = Depends(get_db)) -> CourseSession:
    item = db.get(CourseSession, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到課堂")
    if not db.get(CourseSeries, payload.series_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到課程路線")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/course-sessions/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="刪除單堂課")
def delete_course_session(item_id: UUID, db: Session = Depends(get_db)) -> None:
    item = db.get(CourseSession, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到課堂")
    db.delete(item)
    db.commit()


@router.post("/resources", response_model=ResourceAdminSummary, status_code=status.HTTP_201_CREATED, summary="新增課程教材或影片")
def create_resource(payload: ResourceWrite, db: Session = Depends(get_db)) -> Resource:
    if not db.get(CourseSession, payload.session_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到所屬課堂")
    item = Resource(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/resources/{item_id}", response_model=ResourceAdminSummary, summary="更新課程教材或影片")
def update_resource(item_id: UUID, payload: ResourceWrite, db: Session = Depends(get_db)) -> Resource:
    item = db.get(Resource, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到課程內容")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/resources/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="刪除課程教材或影片")
def delete_resource(item_id: UUID, db: Session = Depends(get_db)) -> None:
    item = db.get(Resource, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到課程內容")
    db.delete(item)
    db.commit()
