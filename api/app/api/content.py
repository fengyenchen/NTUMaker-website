from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_member
from app.db.session import get_db
from app.models.content import Announcement, CourseSeries, PublishStatus, Resource, Visibility
from app.models.user import User
from app.schemas.content import AnnouncementSummary, CourseSeriesSummary, ResourceSummary

router = APIRouter(prefix="/content", tags=["內容"])


@router.get("/announcements", response_model=list[AnnouncementSummary], summary="取得公開公告")
def list_announcements(db: Session = Depends(get_db)) -> list[Announcement]:
    return list(
        db.scalars(
            select(Announcement)
            .where(Announcement.status == PublishStatus.PUBLISHED)
            .order_by(Announcement.published_at.desc())
        )
    )


@router.get("/courses", response_model=list[CourseSeriesSummary], summary="取得公開社課")
def list_courses(db: Session = Depends(get_db)) -> list[CourseSeries]:
    return list(
        db.scalars(
            select(CourseSeries)
            .options(selectinload(CourseSeries.sessions))
            .order_by(CourseSeries.semester.desc())
        ).unique()
    )


@router.get("/resources", response_model=list[ResourceSummary], summary="取得公開資源")
def list_public_resources(db: Session = Depends(get_db)) -> list[Resource]:
    return list(db.scalars(select(Resource).where(Resource.visibility == Visibility.PUBLIC).order_by(Resource.created_at.desc())))


@router.get("/member-resources", response_model=list[ResourceSummary], summary="取得社員資源")
def list_member_resources(
    _: User = Depends(require_member),
    db: Session = Depends(get_db),
) -> list[Resource]:
    return list(db.scalars(select(Resource).where(Resource.visibility != Visibility.ADMIN).order_by(Resource.created_at.desc())))
