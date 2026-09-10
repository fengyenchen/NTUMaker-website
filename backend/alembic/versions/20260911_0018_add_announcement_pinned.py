"""為公告加入置頂旗標。"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260911_0018"
down_revision: str | None = "20260910_0017"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "announcements",
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_announcements_is_pinned", "announcements", ["is_pinned"], unique=False)
    op.alter_column("announcements", "is_pinned", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_announcements_is_pinned", table_name="announcements")
    op.drop_column("announcements", "is_pinned")
