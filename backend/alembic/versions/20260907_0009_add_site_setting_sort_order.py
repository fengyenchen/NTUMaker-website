"""為網站設定增加可管理的排序欄位。"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260907_0009"
down_revision: str | None = "20260907_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("site_settings", sa.Column("category", sa.String(length=50), nullable=False, server_default="general"))
    op.add_column("site_settings", sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"))
    op.create_index("ix_site_settings_category", "site_settings", ["category"])
    op.create_index("ix_site_settings_sort_order", "site_settings", ["sort_order"])
    categories = {
        "home_badge": "home",
        "home_title": "home",
        "home_description": "home",
        "weekly_courses_title": "home",
        "course_library_title": "home",
        "home_section_order": "home",
        "next_event_title": "home",
        "about_title": "about",
        "announcements_title": "announcements",
        "projects_title": "projects",
        "resources_title": "resources",
    }
    for key, category in categories.items():
        op.execute(
            sa.text("UPDATE site_settings SET category = :category WHERE key = :key")
            .bindparams(category=category, key=key)
        )
    order = {
        "home_badge": 10,
        "home_title": 20,
        "home_description": 30,
        "weekly_courses_title": 40,
        "course_library_title": 50,
        "home_section_order": 60,
        "next_event_title": 70,
        "about_title": 100,
        "announcements_title": 110,
        "projects_title": 120,
        "resources_title": 130,
    }
    for key, sort_order in order.items():
        op.execute(
            sa.text("UPDATE site_settings SET sort_order = :sort_order WHERE key = :key")
            .bindparams(sort_order=sort_order, key=key)
        )


def downgrade() -> None:
    op.drop_index("ix_site_settings_sort_order", table_name="site_settings")
    op.drop_index("ix_site_settings_category", table_name="site_settings")
    op.drop_column("site_settings", "sort_order")
    op.drop_column("site_settings", "category")
