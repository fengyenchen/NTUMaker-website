from datetime import datetime
from zoneinfo import ZoneInfo

from app.models.user import User

TAIPEI = ZoneInfo("Asia/Taipei")


def has_active_membership(user: User) -> bool:
    today = datetime.now(TAIPEI).date()
    return user.is_active and any(item.starts_at <= today <= item.expires_at for item in user.memberships)
