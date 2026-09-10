"""保存社群 Token 狀態，支援後端自動檢查與更新。"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260910_0017"
down_revision: str | None = "20260908_0016"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "social_tokens",
        sa.Column("platform", sa.String(length=30), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("source_token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("platform"),
    )


def downgrade() -> None:
    op.drop_table("social_tokens")
