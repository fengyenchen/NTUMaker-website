from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import CurrentUser, LoginRequest, LoginRequested
from app.services.tokens import create_login_token, create_session_token, read_login_token

router = APIRouter(prefix="/auth", tags=["登入"])
settings = get_settings()


@router.post("/request-link", response_model=LoginRequested, summary="寄送 Email 登入連結")
def request_login_link(payload: LoginRequest) -> LoginRequested:
    token = create_login_token(str(payload.email))
    return LoginRequested(
        message="若此 Email 可以登入，系統會寄出一次性登入連結。",
        development_token=token if settings.environment == "development" else None,
    )


@router.get("/verify", summary="驗證一次性登入連結")
def verify_login_link(
    token: str = Query(...),
    return_to: str = Query(default="/learn"),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    email = read_login_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="登入連結無效或已過期")
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        user = User(email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    safe_return_to = return_to if return_to.startswith("/") and not return_to.startswith("//") else "/learn"
    response = RedirectResponse(url=f"{settings.frontend_url}{safe_return_to}", status_code=status.HTTP_303_SEE_OTHER)
    response.set_cookie(
        key="session",
        value=create_session_token(str(user.id)),
        httponly=True,
        secure=settings.environment != "development",
        samesite="lax",
        max_age=60 * 60 * 24 * 14,
    )
    return response


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
