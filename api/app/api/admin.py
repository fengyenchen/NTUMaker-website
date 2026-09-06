from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.content import Announcement, CourseSeries, CourseSession, PublishStatus, Resource
from app.models.user import Membership, Role, User, UserRole
from app.schemas.admin import (
    AdminUserSummary,
    AnnouncementAdminSummary,
    AnnouncementWrite,
    CourseSeriesWrite,
    CourseSessionWrite,
    MemberUpdate,
    MemberWrite,
    ResourceAdminSummary,
    ResourceWrite,
)
from app.schemas.content import CourseSeriesSummary, CourseSessionSummary

router = APIRouter(prefix="/admin", tags=["管理後台"], dependencies=[Depends(require_admin)])


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
    user = User(email=payload.email.lower(), display_name=payload.display_name)
    user.roles.append(UserRole(role=Role.MEMBER))
    if payload.is_admin:
        user.roles.append(UserRole(role=Role.ADMIN))
    user.memberships.append(Membership(starts_at=payload.starts_at, expires_at=payload.expires_at, note=payload.note))
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
            membership.expires_at = payload.expires_at
        else:
            user.memberships.append(Membership(starts_at=date.today(), expires_at=payload.expires_at))
    if payload.is_admin is not None:
        admin_role = next((item for item in user.roles if item.role == Role.ADMIN), None)
        if payload.is_admin and not admin_role:
            user.roles.append(UserRole(role=Role.ADMIN))
        elif not payload.is_admin and admin_role:
            user.roles.remove(admin_role)
    db.commit()
    return serialize_user(load_user(db, user.id))


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


@router.post("/announcements/{item_id}/archive", response_model=AnnouncementAdminSummary, summary="封存公告")
def archive_announcement(item_id: UUID, db: Session = Depends(get_db)) -> Announcement:
    item = db.get(Announcement, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到公告")
    item.status = PublishStatus.ARCHIVED
    db.commit()
    db.refresh(item)
    return item


@router.post("/course-series", response_model=CourseSeriesSummary, status_code=status.HTTP_201_CREATED, summary="新增課程路線")
def create_course_series(payload: CourseSeriesWrite, db: Session = Depends(get_db)) -> CourseSeries:
    item = CourseSeries(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/course-sessions", response_model=CourseSessionSummary, status_code=status.HTTP_201_CREATED, summary="新增單堂課")
def create_course_session(payload: CourseSessionWrite, db: Session = Depends(get_db)) -> CourseSession:
    if not db.get(CourseSeries, payload.series_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到課程路線")
    item = CourseSession(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


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
