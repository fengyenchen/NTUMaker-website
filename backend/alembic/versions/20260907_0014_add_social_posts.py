"""新增社群貼文草稿與排程資料。"""

from collections.abc import Sequence
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260907_0014"
down_revision: str | None = "20260907_0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    social_status = postgresql.ENUM("DRAFT", "SCHEDULED", "PUBLISHED", "FAILED", name="social_post_status")
    social_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "social_posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("caption", sa.Text(), nullable=False),
        sa.Column("platforms", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("image_data", sa.LargeBinary(), nullable=True),
        sa.Column("image_name", sa.String(length=255), nullable=True),
        sa.Column("image_mime_type", sa.String(length=100), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", postgresql.ENUM("DRAFT", "SCHEDULED", "PUBLISHED", "FAILED", name="social_post_status", create_type=False), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_social_posts_scheduled_at", "social_posts", ["scheduled_at"])
    op.create_index("ix_social_posts_status", "social_posts", ["status"])


def downgrade() -> None:
    op.drop_index("ix_social_posts_status", table_name="social_posts")
    op.drop_index("ix_social_posts_scheduled_at", table_name="social_posts")
    op.drop_table("social_posts")
    sa.Enum(name="social_post_status").drop(op.get_bind(), checkfirst=True)
