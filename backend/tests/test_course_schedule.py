from datetime import datetime, timezone

from app.services.course_schedule import scheduled_start


def test_placeholder_noon_uses_actual_evening_class_time() -> None:
    start = datetime(2026, 10, 16, 4, tzinfo=timezone.utc)
    actual = scheduled_start(start, "19:00–21:00")
    assert actual.isoformat() == "2026-10-16T19:00:00+08:00"
    assert actual > datetime(2026, 10, 16, 8, tzinfo=timezone.utc)


def test_uses_taipei_calendar_date() -> None:
    start = datetime(2026, 10, 15, 18, tzinfo=timezone.utc)
    assert scheduled_start(start, "09:30 - 12:00").isoformat() == "2026-10-16T09:30:00+08:00"


def test_unspecified_time_preserves_timestamp() -> None:
    start = datetime(2026, 10, 16, 4, tzinfo=timezone.utc)
    assert scheduled_start(start, "另行通知") == start
