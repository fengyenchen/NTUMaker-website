from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models.content import CourseTrack, PublishStatus, SocialPostStatus, Visibility


class MemberWrite(BaseModel):
    email: EmailStr
    display_name: str | None = Field(default=None, max_length=100)
    expires_at: date
    is_admin: bool = False
    admin_password: str | None = Field(default=None, min_length=12, max_length=200)
    note: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_period(self) -> "MemberWrite":
        if self.is_admin and not self.admin_password:
            raise ValueError("建立管理員時必須設定至少 12 字元的密碼")
        return self


class MemberUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=100)
    expires_at: date | None = None
    is_admin: bool | None = None
    admin_password: str | None = Field(default=None, min_length=12, max_length=200)
    is_active: bool | None = None


class AdminUserSummary(BaseModel):
    id: UUID
    email: EmailStr
    display_name: str | None
    is_active: bool
    roles: list[str]
    membership_starts_at: date | None
    membership_expires_at: date | None


class AnnouncementWrite(BaseModel):
    slug: str = Field(min_length=1, max_length=160, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(min_length=1, max_length=500)
    body: str = Field(min_length=1)
    status: PublishStatus = PublishStatus.DRAFT
    published_at: datetime | None = None


class AnnouncementAdminSummary(AnnouncementWrite):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class CourseSeriesWrite(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    semester: str = Field(min_length=1, max_length=30)
    track: CourseTrack
    time: str = Field(min_length=1, max_length=50)
    description: str = Field(min_length=1)


class CourseSessionWrite(BaseModel):
    series_id: UUID
    title: str = Field(min_length=1, max_length=200)
    week_label: str = Field(min_length=1, max_length=30)
    summary: str = Field(min_length=1, max_length=500)
    starts_at: datetime
    order_index: int = Field(default=0, ge=0)
    visibility: Visibility = Visibility.PUBLIC


class ResourceWrite(BaseModel):
    session_id: UUID
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    resource_type: str = Field(default="article", min_length=1, max_length=40)
    url: str | None = Field(default=None, max_length=2000)
    youtube_url: str | None = Field(default=None, max_length=2000)
    visibility: Visibility = Visibility.MEMBER


class ResourceAdminSummary(ResourceWrite):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class CourseSessionAdminSummary(CourseSessionWrite):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    resources: list[ResourceAdminSummary]


class CourseSeriesAdminSummary(CourseSeriesWrite):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    sessions: list[CourseSessionAdminSummary]


class SiteSettingSummary(BaseModel):
    key: str
    label: str
    value: str
    description: str
    category: str
    sort_order: int


class SiteSettingWrite(BaseModel):
    value: str = Field(max_length=5000)


class SocialPostWrite(BaseModel):
    caption: str = Field(min_length=1, max_length=10000)
    platforms: list[str] = Field(min_length=1)
    images: list["SocialPostImageWrite"] = Field(default_factory=list, max_length=10)
    scheduled_at: datetime | None = None
    status: SocialPostStatus = SocialPostStatus.DRAFT


class SocialPostUpdate(BaseModel):
    caption: str = Field(min_length=1, max_length=10000)
    platforms: list[str] = Field(min_length=1)
    scheduled_at: datetime | None = None
    status: SocialPostStatus = SocialPostStatus.DRAFT


class SocialPostImageWrite(BaseModel):
    r2_object_key: str = Field(min_length=1, max_length=500)
    image_name: str = Field(min_length=1, max_length=255)
    image_mime_type: str = Field(min_length=1, max_length=100)


class SocialPostImageOrderUpdate(BaseModel):
    image_ids: list[UUID] = Field(min_length=1, max_length=10)


class SocialPostImageSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    r2_object_key: str
    image_name: str
    image_mime_type: str
    order_index: int
    image_url: str | None = None


class SocialPostSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    caption: str
    platforms: list[str]
    images: list[SocialPostImageSummary]
    scheduled_at: datetime | None
    status: SocialPostStatus
    published_at: datetime | None
    error_message: str | None
    created_at: datetime
