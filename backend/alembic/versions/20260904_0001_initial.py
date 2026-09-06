"""建立使用者、社員、公告、課程與教材資料表。"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260904_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

role_name = postgresql.ENUM("ADMIN", "MEMBER", name="role_name", create_type=False)
publish_status = postgresql.ENUM("DRAFT", "PUBLISHED", "ARCHIVED", name="publish_status", create_type=False)
course_track = postgresql.ENUM("TUESDAY", "FRIDAY", name="course_track", create_type=False)
content_visibility = postgresql.ENUM("PUBLIC", "MEMBER", "ADMIN", name="content_visibility", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    role_name.create(bind, checkfirst=True)
    publish_status.create(bind, checkfirst=True)
    course_track.create(bind, checkfirst=True)
    content_visibility.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "user_roles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", role_name, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "role", name="uq_user_role"),
    )
    op.create_index("ix_user_roles_user_id", "user_roles", ["user_id"])

    op.create_table(
        "memberships",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("starts_at", sa.Date(), nullable=False),
        sa.Column("expires_at", sa.Date(), nullable=False),
        sa.Column("note", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_memberships_user_id", "memberships", ["user_id"])
    op.create_index("ix_memberships_expires_at", "memberships", ["expires_at"])

    op.create_table(
        "announcements",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.String(length=500), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", publish_status, nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_announcements_slug", "announcements", ["slug"], unique=True)
    op.create_index("ix_announcements_published_at", "announcements", ["published_at"])

    op.create_table(
        "course_series",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("semester", sa.String(length=30), nullable=False),
        sa.Column("track", course_track, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_course_series_semester", "course_series", ["semester"])
    op.create_index("ix_course_series_track", "course_series", ["track"])

    op.create_table(
        "course_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("series_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.String(length=500), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("visibility", content_visibility, nullable=False),
        sa.ForeignKeyConstraint(["series_id"], ["course_series.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_course_sessions_series_id", "course_sessions", ["series_id"])
    op.create_index("ix_course_sessions_starts_at", "course_sessions", ["starts_at"])

    op.create_table(
        "resources",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("resource_type", sa.String(length=40), nullable=False),
        sa.Column("url", sa.String(length=2000), nullable=True),
        sa.Column("youtube_url", sa.String(length=2000), nullable=True),
        sa.Column("visibility", content_visibility, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["course_sessions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_resources_session_id", "resources", ["session_id"])


def downgrade() -> None:
    op.drop_table("resources")
    op.drop_table("course_sessions")
    op.drop_table("course_series")
    op.drop_table("announcements")
    op.drop_table("memberships")
    op.drop_table("user_roles")
    op.drop_table("users")
    bind = op.get_bind()
    content_visibility.drop(bind, checkfirst=True)
    course_track.drop(bind, checkfirst=True)
    publish_status.drop(bind, checkfirst=True)
    role_name.drop(bind, checkfirst=True)
