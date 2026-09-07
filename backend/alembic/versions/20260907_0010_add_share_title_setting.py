"""新增首頁分享區塊標題設定。"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260907_0010"
down_revision: str | None = "20260907_0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    table = sa.table(
        "site_settings",
        sa.column("key", sa.String),
        sa.column("label", sa.String),
        sa.column("value", sa.Text),
        sa.column("description", sa.String),
        sa.column("category", sa.String),
        sa.column("sort_order", sa.Integer),
    )
    op.bulk_insert(
        table,
        [{
            "key": "share_title",
            "label": "分享區塊大標",
            "value": "做出作品，也把方法分享出去。",
            "description": "首頁分享區塊的大標題。",
            "category": "home",
            "sort_order": 80,
        }],
    )


def downgrade() -> None:
    op.execute("DELETE FROM site_settings WHERE key = 'share_title'")
