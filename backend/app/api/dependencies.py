from uuid import UUID

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.user import Role, User, UserRole
from app.services.memberships import has_active_membership
from app.services.tokens import read_session_token


def get_current_user(
    session: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    user_id = read_session_token(session) if session else None
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="請先登入")
    try:
        parsed_id = UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登入狀態無效") from exc

    user = db.scalar(
        select(User)
        .options(selectinload(User.roles), selectinload(User.memberships))
        .where(User.id == parsed_id, User.is_active.is_(True))
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="找不到有效帳號")
    return user


def require_member(user: User = Depends(get_current_user)) -> User:
    is_admin = any(item.role == Role.ADMIN for item in user.roles)
    is_member = has_active_membership(user)
    if not is_admin and not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="社員資格已到期或尚未生效")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not any(item.role == Role.ADMIN for item in user.roles):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要管理員權限")
    return user
