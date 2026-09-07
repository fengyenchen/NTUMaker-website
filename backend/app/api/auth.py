from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import Role, User
from app.schemas.auth import AdminLoginRequest, CurrentUser, CurrentUserUpdate, LoginRequest, LoginSucceeded
from app.services.memberships import has_active_membership
from app.services.passwords import verify_password
from app.services.tokens import create_session_token

router = APIRouter(prefix="/auth", tags=["登入"])
settings = get_settings()


def set_session_cookie(response: Response, user_id: str) -> None:
    response.set_cookie(
        key="session",
        value=create_session_token(user_id),
        httponly=True,
        secure=settings.environment != "development",
        samesite="lax",
        max_age=60 * 60 * 24 * 14,
    )


@router.post("/member-login", response_model=LoginSucceeded, summary="社員 Email 登入")
def member_login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> LoginSucceeded:
    normalized_email = str(payload.email).lower()
    user = db.scalar(select(User).options(selectinload(User.memberships)).where(User.email == normalized_email))
    if not user or not has_active_membership(user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email 不存在、帳號已停用或社員資格不在有效期限內")
    set_session_cookie(response, str(user.id))
    return LoginSucceeded(message="登入成功", redirect_to="/setting")


@router.post("/admin-login", response_model=LoginSucceeded, summary="管理員 Email 與密碼登入")
def admin_login(payload: AdminLoginRequest, response: Response, db: Session = Depends(get_db)) -> LoginSucceeded:
    normalized_email = str(payload.email).lower()
    user = db.scalar(select(User).options(selectinload(User.roles)).where(User.email == normalized_email, User.is_active.is_(True)))
    is_admin = bool(user and any(item.role == Role.ADMIN for item in user.roles))
    if not is_admin or not verify_password(payload.password, user.password_hash if user else None):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email 或密碼錯誤")
    set_session_cookie(response, str(user.id))
    return LoginSucceeded(message="登入成功", redirect_to="/admin")


@router.post("/logout", summary="登出")
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie("session")
    return {"message": "已登出"}


@router.get("/me", response_model=CurrentUser, summary="取得目前使用者")
def me(user: User = Depends(get_current_user)) -> CurrentUser:
    latest_membership = max((item.expires_at for item in user.memberships), default=None)
    return CurrentUser(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        roles=[item.role.value for item in user.roles],
        membership_expires_at=latest_membership.isoformat() if latest_membership else None,
    )


@router.patch("/me", response_model=CurrentUser, summary="更新目前社員資料")
def update_me(
    payload: CurrentUserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CurrentUser:
    user.display_name = payload.display_name
    db.commit()
    db.refresh(user)
    return me(user)
