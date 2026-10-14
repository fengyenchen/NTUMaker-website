import re
from datetime import datetime
from zoneinfo import ZoneInfo

TAIPEI = ZoneInfo("Asia/Taipei")


def scheduled_start(starts_at: datetime, class_time: str) -> datetime:
    """Combine the session date with the series' actual class time."""
    local = starts_at.astimezone(TAIPEI)
    match = re.search(r"(?<!\d)([01]?\d|2[0-3]):([0-5]\d)", class_time)
    if not match:
        return local
    return local.replace(hour=int(match[1]), minute=int(match[2]), second=0, microsecond=0)
