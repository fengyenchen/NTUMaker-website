import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PublishStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class Visibility(str, enum.Enum):
    PUBLIC = "public"
    MEMBER = "member"


class CourseTrack(str, enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(Text)
    status: Mapped[PublishStatus] = mapped_column(Enum(PublishStatus, name="publish_status"), default=PublishStatus.DRAFT)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CourseSeries(Base):
    __tablename__ = "course_series"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200))
    semester: Mapped[str] = mapped_column(String(30), index=True)
    track: Mapped[CourseTrack] = mapped_column(Enum(CourseTrack, name="course_track"), index=True)
    description: Mapped[str] = mapped_column(Text)
    sessions: Mapped[list["CourseSession"]] = relationship(back_populates="series", cascade="all, delete-orphan")


class CourseSession(Base):
    __tablename__ = "course_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    series_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("course_series.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    week_label: Mapped[str] = mapped_column(String(30), default="")
    summary: Mapped[str] = mapped_column(String(500))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    visibility: Mapped[Visibility] = mapped_column(Enum(Visibility, name="content_visibility"), default=Visibility.PUBLIC)
    series: Mapped[CourseSeries] = relationship(back_populates="sessions")
    resources: Mapped[list["Resource"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("course_sessions.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    resource_type: Mapped[str] = mapped_column(String(40), default="article")
    url: Mapped[str | None] = mapped_column(String(2000))
    youtube_url: Mapped[str | None] = mapped_column(String(2000))
    visibility: Mapped[Visibility] = mapped_column(Enum(Visibility, name="content_visibility", create_type=False), default=Visibility.PUBLIC)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    session: Mapped[CourseSession | None] = relationship(back_populates="resources")
