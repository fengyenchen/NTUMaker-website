from app.services.passwords import hash_password, verify_password


def test_password_hash_can_be_verified() -> None:
    encoded = hash_password("a-secure-admin-password")

    assert encoded != "a-secure-admin-password"
    assert verify_password("a-secure-admin-password", encoded)
    assert not verify_password("wrong-password", encoded)


def test_invalid_password_hash_is_rejected() -> None:
    assert not verify_password("any-password", None)
    assert not verify_password("any-password", "invalid")
