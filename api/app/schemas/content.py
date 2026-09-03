from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.content import CourseTrack, Visibility


class AnnouncementSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    title: str
    summary: str
    published_at: datetime | None


class CourseSessionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    summary: str
    starts_at: datetime
    visibility: Visibility


class CourseSeriesSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    semester: str
    track: CourseTrack
    description: str
    sessions: list[CourseSessionSummary]


class ResourceSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID | None
    title: str
    description: str
    resource_type: str
    url: str | None
    youtube_url: str | None
    visibility: Visibility
