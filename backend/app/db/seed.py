from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.user import Role, User, UserRole
from app.services.passwords import hash_password


def ensure_admin(db: Session) -> None:
    settings = get_settings()
    email = settings.admin_email
    if not email:
        return
    normalized = str(email).lower()
    user = db.scalar(select(User).where(User.email == normalized))
    if not user:
        user = User(email=normalized, display_name="NTUMaker 管理員")
        db.add(user)
        db.flush()
    if not db.scalar(select(UserRole).where(UserRole.user_id == user.id, UserRole.role == Role.ADMIN)):
        db.add(UserRole(user_id=user.id, role=Role.ADMIN))
    if settings.admin_password:
        user.password_hash = hash_password(settings.admin_password)


def main() -> None:
    with SessionLocal() as db:
        ensure_admin(db)
        db.commit()
    print("已建立或更新初始管理員；未建立課程假資料。")


if __name__ == "__main__":
    main()
