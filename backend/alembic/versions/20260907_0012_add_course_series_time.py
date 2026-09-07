"""新增課程路線的上課時間。"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260907_0012"
down_revision: str | None = "20260907_0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("course_series", sa.Column("time", sa.String(length=50), nullable=False, server_default="19:00–21:00"))
    op.alter_column("course_series", "time", server_default=None)


def downgrade() -> None:
    op.drop_column("course_series", "time")
