"""新增社課頁大標、小標與資訊卡設定。"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260907_0013"
down_revision: str | None = "20260907_0012"
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
    values = [
        ("courses_time_label", "社課時間區塊標題", "時間", "社課", 150),
        ("courses_time_value", "社課時間區塊內容", "週二、週五 19:00–21:00", "社課", 151),
        ("courses_location_label", "社課地點區塊標題", "地點", "社課", 160),
        ("courses_location_value", "社課地點區塊內容", "學新館 523", "社課", 161),
        ("courses_fee_label", "社課社費區塊標題", "社費", "社課", 170),
        ("courses_fee_value", "社課社費區塊內容", "500 元", "社課", 171),
    ]
    op.bulk_insert(table, [{"key": key, "label": label, "value": value, "description": f"{label}。", "category": category, "sort_order": sort_order} for key, label, value, category, sort_order in values])


def downgrade() -> None:
    op.execute("DELETE FROM site_settings WHERE key IN ('courses_time_label', 'courses_time_value', 'courses_location_label', 'courses_location_value', 'courses_fee_label', 'courses_fee_value')")
