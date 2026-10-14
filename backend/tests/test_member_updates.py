from unittest.mock import Mock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.api.admin import update_member
from app.models.user import User
from app.schemas.admin import MemberUpdate


def test_update_member_name_and_normalized_email() -> None:
    user = User(id=uuid4(), email="old@example.com", display_name="Old", is_active=True)
    admin = User(id=uuid4(), email="admin@example.com")
    db = Mock()
    db.scalar.return_value = None
    with patch("app.api.admin.load_user", return_value=user):
        result = update_member(user.id, MemberUpdate(email="New@example.com", display_name="New"), db, admin)
    assert result.email == "new@example.com"
    assert result.display_name == "New"
    db.commit.assert_called_once()


def test_duplicate_email_preserves_existing_profile() -> None:
    user = User(id=uuid4(), email="old@example.com", display_name="Old")
    db = Mock()
    db.scalar.return_value = User(email="taken@example.com")
    with patch("app.api.admin.load_user", return_value=user), pytest.raises(HTTPException) as error:
        update_member(user.id, MemberUpdate(email="taken@example.com", display_name="New"), db, User(id=uuid4()))
    assert error.value.status_code == 409
    assert user.email == "old@example.com"
    assert user.display_name == "Old"
    db.commit.assert_not_called()


def test_invalid_email_is_rejected() -> None:
    with pytest.raises(ValidationError):
        MemberUpdate(email="invalid-email")
