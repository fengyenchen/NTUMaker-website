"""新增各內容頁的小標設定。"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260907_0011"
down_revision: str | None = "20260907_0010"
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
        ("about_description", "關於頁小標", "NTUMaker 致力於推廣創客文化。這裡不要求你一開始就會，而是希望每個人都能找到一起做東西、交換方法和完成作品的夥伴。", "about", 101),
        ("announcements_description", "公告頁小標", "社課異動、工作坊報名、社員招募與空間開放資訊都會整理在這裡。", "announcements", 111),
        ("courses_description", "社課頁小標", "星期二以 Arduino 循線車為連貫專案；星期五安排四場獨立主題工作坊。", "courses", 121),
        ("projects_description", "作品頁小標", "記錄社員專案的目標、做法、失敗與下一版，讓作品不只停在成果照。", "projects", 131),
        ("resources_description", "資源頁小標", "先選星期二的循線車專案或星期五的主題工作坊，再進入單堂課查看講義、上課影片與附件。", "resources", 141),
    ]
    op.bulk_insert(table, [{"key": key, "label": label, "value": value, "description": f"{label}內容。", "category": category, "sort_order": sort_order} for key, label, value, category, sort_order in values])


def downgrade() -> None:
    op.execute("DELETE FROM site_settings WHERE key IN ('about_description', 'announcements_description', 'courses_description', 'projects_description', 'resources_description')")
