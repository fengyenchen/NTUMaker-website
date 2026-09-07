"""將社群圖片欄位改為 R2 物件 key。"""

from collections.abc import Sequence
from alembic import op
import sqlalchemy as sa

revision: str = "20260907_0015"
down_revision: str | None = "20260907_0014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("social_posts", sa.Column("r2_object_key", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("social_posts", "r2_object_key")
