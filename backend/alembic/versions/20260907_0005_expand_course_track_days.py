"""將課程路線的上課日擴充為星期一至星期日。"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260907_0005"
down_revision: str | None = "20260907_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _replace(values: tuple[str, ...]) -> None:
    op.execute("ALTER TYPE course_track RENAME TO course_track_old")
    joined = ", ".join(f"'{value}'" for value in values)
    op.execute(f"CREATE TYPE course_track AS ENUM ({joined})")
    op.execute(
        "ALTER TABLE course_series ALTER COLUMN track TYPE course_track "
        "USING track::text::course_track"
    )
    op.execute("DROP TYPE course_track_old")


def upgrade() -> None:
    _replace(("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"))


def downgrade() -> None:
    _replace(("TUESDAY", "FRIDAY"))
