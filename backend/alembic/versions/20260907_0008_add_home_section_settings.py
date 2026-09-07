"""新增首頁區塊排序與下一個活動標題設定。"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260907_0008"
down_revision: str | None = "20260907_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    table = sa.table("site_settings", sa.column("key", sa.String), sa.column("label", sa.String), sa.column("value", sa.Text), sa.column("description", sa.String))
    op.bulk_insert(table, [
        {"key": "home_section_order", "label": "首頁區塊順序", "value": "weekly_courses,next_event,course_library,share", "description": "首頁區塊順序，可在首頁設定頁籤上下移動。"},
        {"key": "next_event_title", "label": "下一次活動大標", "value": "下一次，一起做什麼？", "description": "首頁活動公告區塊的大標題。"},
    ])


def downgrade() -> None:
    op.execute("DELETE FROM site_settings WHERE key IN ('home_section_order', 'next_event_title')")
