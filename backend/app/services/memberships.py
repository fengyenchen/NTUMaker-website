from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.models.user import User

TAIPEI = ZoneInfo("Asia/Taipei")


def taipei_today() -> date:
    return datetime.now(TAIPEI).date()


def has_active_membership(user: User) -> bool:
    today = taipei_today()
    return user.is_active and any(item.starts_at <= today <= item.expires_at for item in user.memberships)
