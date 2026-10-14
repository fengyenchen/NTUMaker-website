from datetime import timedelta
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.api.admin import import_members
from app.schemas.admin import MemberImport
from app.services.memberships import taipei_today


def test_import_skips_invalid_existing_and_duplicate_rows() -> None:
    db = MagicMock()
    db.scalar.side_effect = [None, "existing-id"]
    payload = MemberImport(expires_at=taipei_today(), rows=[
        {"row_number": 2, "display_name": " Alice ", "email": "Alice@example.com"},
        {"row_number": 3, "display_name": "Duplicate", "email": "alice@example.com"},
        {"row_number": 4, "display_name": "Existing", "email": "existing@example.com"},
        {"row_number": 5, "display_name": "Bad", "email": "invalid"},
        {"row_number": 6, "display_name": " ", "email": "blank@example.com"},
    ])
    result = import_members(payload, db)
    assert result["imported"] == 1
    assert [item["row_number"] for item in result["skipped"]] == [3, 4, 5, 6]
    user = db.add.call_args.args[0]
    assert user.email == "alice@example.com"
    assert user.display_name == "Alice"
    assert user.memberships[0].starts_at == taipei_today()
    assert user.memberships[0].expires_at == payload.expires_at
    db.commit.assert_called_once()


def test_import_rejects_past_end_date_before_writing() -> None:
    db = MagicMock()
    payload = MemberImport(expires_at=taipei_today() - timedelta(days=1), rows=[
        {"row_number": 2, "display_name": "Alice", "email": "alice@example.com"},
    ])
    with pytest.raises(HTTPException) as error:
        import_members(payload, db)
    assert error.value.status_code == 422
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_concurrent_duplicate_does_not_stop_remaining_import() -> None:
    db = MagicMock()
    db.scalar.return_value = None
    db.flush.side_effect = [IntegrityError("insert", {}, Exception("duplicate")), None]
    payload = MemberImport(expires_at=taipei_today(), rows=[
        {"row_number": 2, "display_name": "First", "email": "first@example.com"},
        {"row_number": 3, "display_name": "Second", "email": "second@example.com"},
    ])
    result = import_members(payload, db)
    assert result["imported"] == 1
    assert result["skipped"][0]["row_number"] == 2
    assert db.begin_nested.call_count == 2
    db.commit.assert_called_once()
