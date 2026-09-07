from datetime import date, timedelta
from uuid import uuid4

import pytest
from fastapi import HTTPException, Response

from app.api.auth import admin_login, member_login
from app.models.user import Membership, Role, User, UserRole
from app.schemas.auth import AdminLoginRequest, LoginRequest
from app.services.memberships import has_active_membership
from app.services.passwords import hash_password


class FakeSession:
    def __init__(self, user: User | None) -> None:
        self.user = user

    def scalar(self, _statement: object) -> User | None:
        return self.user


def make_user(starts_at: date, expires_at: date, *, is_active: bool = True) -> User:
    user = User(email="member@example.com", is_active=is_active)
    user.memberships.append(Membership(starts_at=starts_at, expires_at=expires_at))
    return user


def test_current_membership_can_use_member_login() -> None:
    today = date.today()
    user = make_user(today - timedelta(days=1), today + timedelta(days=1))

    assert has_active_membership(user)


def test_expired_or_disabled_member_cannot_use_member_login() -> None:
    today = date.today()
    expired = make_user(today - timedelta(days=2), today - timedelta(days=1))
    disabled = make_user(today - timedelta(days=1), today + timedelta(days=1), is_active=False)

    assert not has_active_membership(expired)
    assert not has_active_membership(disabled)


def test_valid_member_email_creates_session() -> None:
    today = date.today()
    user = make_user(today - timedelta(days=1), today + timedelta(days=1))
    user.id = uuid4()
    response = Response()

    result = member_login(LoginRequest(email=user.email), response, FakeSession(user))  # type: ignore[arg-type]

    assert result.redirect_to == "/setting"
    assert "session=" in response.headers["set-cookie"]
    assert "HttpOnly" in response.headers["set-cookie"]


def test_unknown_member_email_is_rejected() -> None:
    with pytest.raises(HTTPException) as exc_info:
        member_login(LoginRequest(email="unknown@example.com"), Response(), FakeSession(None))  # type: ignore[arg-type]

    assert exc_info.value.status_code == 401


def test_admin_requires_role_and_correct_password() -> None:
    user = User(email="admin@example.com", is_active=True, password_hash=hash_password("a-secure-admin-password"))
    user.id = uuid4()
    user.roles.append(UserRole(role=Role.ADMIN))
    response = Response()

    result = admin_login(AdminLoginRequest(email=user.email, password="a-secure-admin-password"), response, FakeSession(user))  # type: ignore[arg-type]

    assert result.redirect_to == "/admin"
    assert "session=" in response.headers["set-cookie"]

    with pytest.raises(HTTPException) as exc_info:
        admin_login(AdminLoginRequest(email=user.email, password="wrong-password"), Response(), FakeSession(user))  # type: ignore[arg-type]
    assert exc_info.value.status_code == 401
