from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.core.config import get_settings

settings = get_settings()
serializer = URLSafeTimedSerializer(settings.session_secret)


def create_session_token(user_id: str) -> str:
    return serializer.dumps({"user_id": user_id}, salt="session")


def read_session_token(token: str, max_age: int = 60 * 60 * 24 * 14) -> str | None:
    try:
        payload = serializer.loads(token, salt="session", max_age=max_age)
        return str(payload["user_id"])
    except (BadSignature, SignatureExpired, KeyError):
        return None
