"""為課堂加入結束日期。"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260930_0019"
down_revision: str | None = "20260911_0018"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("course_sessions", sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE course_sessions SET ends_at = starts_at WHERE ends_at IS NULL")
    op.alter_column("course_sessions", "ends_at", nullable=False)
    op.create_index("ix_course_sessions_ends_at", "course_sessions", ["ends_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_course_sessions_ends_at", table_name="course_sessions")
    op.drop_column("course_sessions", "ends_at")
