"""為單堂課新增週次標籤。"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260904_0002"
down_revision: str | None = "20260904_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("course_sessions", sa.Column("week_label", sa.String(length=30), server_default="", nullable=False))
    op.alter_column("course_sessions", "week_label", server_default=None)


def downgrade() -> None:
    op.drop_column("course_sessions", "week_label")
