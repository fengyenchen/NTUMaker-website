"""新增社群貼文多圖片與排序。"""

from collections.abc import Sequence
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260908_0016"
down_revision: str | None = "20260907_0015"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "social_post_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("post_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("r2_object_key", sa.String(length=500), nullable=False),
        sa.Column("image_name", sa.String(length=255), nullable=False),
        sa.Column("image_mime_type", sa.String(length=100), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["social_posts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_social_post_images_post_id", "social_post_images", ["post_id"])


def downgrade() -> None:
    op.drop_index("ix_social_post_images_post_id", table_name="social_post_images")
    op.drop_table("social_post_images")
