"""建立可由管理員編輯的網站文字設定。"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260907_0006"
down_revision: str | None = "20260907_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "site_settings",
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("key"),
    )
    settings = [
        ("home_badge", "首頁標籤", "2026 秋季社課進行中", "首頁主視覺上方的小標籤。"),
        ("home_title", "首頁大標", "把想法\n做成真的。", "首頁主視覺大標，換行會保留。"),
        ("home_description", "首頁小標", "從電子、程式、設計到數位製造，和一群喜歡動手的人一起試、一起拆，再做出更好的版本。", "首頁大標下方的介紹文字。"),
        ("weekly_courses_title", "每週社課大標", "兩條路線，自由找到你的節奏。", "首頁每週社課區塊標題。"),
        ("course_library_title", "課程內容大標", "每堂課的教材、影片與檔案，都收在一起。", "首頁課程內容區塊標題。"),
        ("about_title", "關於頁大標", "Build. Learn. Share.", "關於頁主標題。"),
        ("announcements_title", "公告頁大標", "社團最近在做什麼。", "公告頁主標題。"),
        ("projects_title", "作品頁大標", "完成的作品，和還在長大的點子。", "作品頁主標題。"),
        ("resources_title", "資源頁大標", "從一堂課出發，教材和影片都在一起。", "資源頁主標題。"),
    ]
    op.bulk_insert(
        sa.table("site_settings", sa.column("key", sa.String), sa.column("label", sa.String), sa.column("value", sa.Text), sa.column("description", sa.String)),
        [{"key": key, "label": label, "value": value, "description": description} for key, label, value, description in settings],
    )


def downgrade() -> None:
    op.drop_table("site_settings")
