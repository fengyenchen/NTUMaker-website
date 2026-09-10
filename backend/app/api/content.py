from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Path, status
from fastapi.responses import Response
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload, with_loader_criteria

from app.api.dependencies import require_member
from app.db.session import get_db
from app.models.content import Announcement, CourseSeries, CourseSession, PublishStatus, Resource, SiteSetting, Visibility
from app.models.user import User
from app.schemas.content import AnnouncementSummary, CourseSeriesCatalogSummary, CourseSeriesSummary, ResourceSummary
from app.services.r2 import read_image

router = APIRouter(prefix="/content", tags=["內容"])


@router.get("/assets/{object_key:path}", include_in_schema=False)
def get_public_asset(object_key: str = Path(min_length=1)) -> Response:
    data, content_type = read_image(object_key)
    return Response(content=data, media_type=content_type or "application/octet-stream", headers={"Cache-Control": "public, max-age=31536000, immutable"})


@router.get("/settings", summary="取得前台網站文字設定")
def list_public_settings(db: Session = Depends(get_db)) -> list[dict[str, str]]:
    return [{"key": item.key, "value": item.value} for item in db.scalars(select(SiteSetting).order_by(SiteSetting.sort_order, SiteSetting.key))]


@router.get("/announcements", response_model=list[AnnouncementSummary], summary="取得公開公告")
def list_announcements(db: Session = Depends(get_db)) -> list[Announcement]:
    return list(
        db.scalars(
            select(Announcement)
            .where(
                Announcement.status == PublishStatus.PUBLISHED,
                or_(Announcement.published_at.is_(None), Announcement.published_at <= datetime.now(timezone.utc)),
            )
            .order_by(Announcement.is_pinned.desc(), Announcement.published_at.desc().nullslast(), Announcement.created_at.desc())
        )
    )


@router.get("/announcements/{slug}", response_model=AnnouncementSummary, summary="取得單篇公開公告")
def get_announcement(slug: str, db: Session = Depends(get_db)) -> Announcement:
    item = db.scalar(select(Announcement).where(Announcement.slug == slug, Announcement.status == PublishStatus.PUBLISHED, or_(Announcement.published_at.is_(None), Announcement.published_at <= datetime.now(timezone.utc))))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到公告")
    return item


@router.get("/courses", response_model=list[CourseSeriesSummary], summary="取得公開社課")
def list_courses(db: Session = Depends(get_db)) -> list[CourseSeries]:
    return list(
        db.scalars(
            select(CourseSeries)
            .options(
                selectinload(CourseSeries.sessions),
                with_loader_criteria(CourseSession, CourseSession.visibility == Visibility.PUBLIC),
            )
            .order_by(CourseSeries.semester.desc())
        ).unique()
    )


@router.get("/course-library", response_model=list[CourseSeriesCatalogSummary], summary="取得課程與資源目錄")
def list_course_library(db: Session = Depends(get_db)) -> list[dict]:
    series_list = db.scalars(
        select(CourseSeries)
        .options(
            selectinload(CourseSeries.sessions).selectinload(CourseSession.resources),
            with_loader_criteria(CourseSession, CourseSession.visibility == Visibility.PUBLIC),
        )
        .order_by(CourseSeries.semester.desc())
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
                    "title": session.title,
                    "week_label": session.week_label,
                    "summary": session.summary,
                    "starts_at": session.starts_at,
                    "order_index": session.order_index,
                    "visibility": session.visibility,
                    "resources": list(session.resources),
                }
                for session in sorted(series.sessions, key=lambda item: item.order_index)
            ],
        }
        for series in series_list
    ]


@router.get("/resources", response_model=list[ResourceSummary], summary="取得公開資源")
def list_public_resources(db: Session = Depends(get_db)) -> list[Resource]:
    return list(db.scalars(select(Resource).where(Resource.visibility == Visibility.PUBLIC).order_by(Resource.created_at.desc())))


@router.get("/member-resources", response_model=list[ResourceSummary], summary="取得社員資源")
def list_member_resources(
    _: User = Depends(require_member),
    db: Session = Depends(get_db),
) -> list[Resource]:
    return list(db.scalars(select(Resource).order_by(Resource.created_at.desc())))
