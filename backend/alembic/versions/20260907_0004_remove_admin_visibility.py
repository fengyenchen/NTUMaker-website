"""移除未使用的管理員限定內容權限。"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260907_0004"
down_revision: str | None = "20260907_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def replace_visibility_type(values: tuple[str, ...]) -> None:
    op.execute("ALTER TYPE content_visibility RENAME TO content_visibility_old")
    joined_values = ", ".join(f"'{value}'" for value in values)
    op.execute(f"CREATE TYPE content_visibility AS ENUM ({joined_values})")
    for table in ("course_sessions", "resources"):
        op.execute(
            f"ALTER TABLE {table} ALTER COLUMN visibility TYPE content_visibility "
            "USING visibility::text::content_visibility"
        )
    op.execute("DROP TYPE content_visibility_old")


def upgrade() -> None:
    replace_visibility_type(("PUBLIC", "MEMBER"))


def downgrade() -> None:
    replace_visibility_type(("PUBLIC", "MEMBER", "ADMIN"))
