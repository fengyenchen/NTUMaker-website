from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.content import CourseSeries, CourseSession, CourseTrack, Resource, Visibility
from app.models.user import Role, User, UserRole
from app.services.passwords import hash_password

TAIPEI = ZoneInfo("Asia/Taipei")

TRACKS = [
    {
        "track": CourseTrack.TUESDAY,
        "title": "Arduino 循線車專案",
        "description": "新手友善的連貫專案，從原理、電路與程式一路完成機構、競賽及成果發表。",
        "sessions": [
            ("第 2 週", "迎新：破冰、電切燈板、社員證", "透過破冰活動認識社員，並製作電切燈板與社員證。", "2026-09-15", ["迎新簡報"]),
            ("第 3 週", "Arduino 循線車－學理", "建立循線車會使用到的基礎觀念。", "2026-09-22", ["課程講義", "上課影片"]),
            ("第 4–5 週", "Arduino 循線車－電路", "認識元件、接線與感測器輸入。", "2026-09-29", ["課程講義", "上課影片", "接線圖"]),
            ("第 6–7 週", "Arduino 循線車－程式", "撰寫控制邏輯，讓循線車依感測結果行動。", "2026-10-13", ["課程講義", "上課影片", "範例程式"]),
            ("第 9–10 週", "彈性", "整合前半學期內容並處理各組進度。", "2026-11-03", ["除錯筆記", "上課影片"]),
            ("第 11–12 週", "Arduino 循線車－機構", "完成車體結構、固定方式與零件配置。", "2026-11-17", ["課程講義", "上課影片", "製作檔案"]),
            ("第 14 週", "Arduino 循線車－社內競賽", "測試、調校並完成社內循線車競賽。", "2026-12-08", ["競賽規則", "測試紀錄"]),
            ("第 15 週", "循線車決賽、發表會、社員大會", "進行循線車決賽、成果發表與社員大會。", "2026-12-15", ["發表模板", "成果影片"]),
        ],
    },
    {
        "track": CourseTrack.FRIDAY,
        "title": "主題工作坊",
        "description": "每場工作坊可獨立參加，針對一項技術完成可展示的實作。",
        "sessions": [
            ("第 4 週", "水晶球燈座（未定）", "製作結合燈光與造型的桌上作品，內容仍待最終確認。", "2026-10-02", ["工作坊教材", "示範影片", "製作檔案"]),
            ("第 7 週", "ESP32 IoT", "讓 ESP32 裝置連上網路並傳送或接收資料。", "2026-10-23", ["工作坊教材", "示範影片", "範例程式"]),
            ("第 10 週", "放映機", "從光學與機構概念完成簡易放映裝置。", "2026-11-13", ["工作坊教材", "示範影片", "製作檔案"]),
            ("第 13–14 週", "無人機", "認識飛行原理、控制與安全操作。", "2026-12-04", ["工作坊教材", "示範影片", "安全須知"]),
        ],
    },
]


def ensure_admin(db: Session) -> None:
    settings = get_settings()
    email = settings.admin_email
    if not email:
        return
    normalized = str(email).lower()
    user = db.scalar(select(User).where(User.email == normalized))
    if not user:
        user = User(email=normalized, display_name="NTUMaker 管理員")
        db.add(user)
        db.flush()
    if not db.scalar(select(UserRole).where(UserRole.user_id == user.id, UserRole.role == Role.ADMIN)):
        db.add(UserRole(user_id=user.id, role=Role.ADMIN))
    if settings.admin_password:
        user.password_hash = hash_password(settings.admin_password)


def ensure_courses(db: Session) -> None:
    for track_data in TRACKS:
        series = db.scalar(select(CourseSeries).where(CourseSeries.semester == "115-1", CourseSeries.track == track_data["track"]))
        if not series:
            series = CourseSeries(title=track_data["title"], semester="115-1", track=track_data["track"], description=track_data["description"])
            db.add(series)
            db.flush()
        for index, (week_label, title, summary, date_text, assets) in enumerate(track_data["sessions"]):
            session = db.scalar(select(CourseSession).where(CourseSession.series_id == series.id, CourseSession.order_index == index))
            if not session:
                session = CourseSession(series_id=series.id, title=title, week_label=week_label, summary=summary, starts_at=datetime.fromisoformat(f"{date_text}T19:00:00").replace(tzinfo=TAIPEI), order_index=index, visibility=Visibility.PUBLIC)
                db.add(session)
                db.flush()
            else:
                session.title = title
                session.week_label = week_label
                session.summary = summary
                session.starts_at = datetime.fromisoformat(f"{date_text}T19:00:00").replace(tzinfo=TAIPEI)
                session.order_index = index
            for asset in assets:
                resource = db.scalar(select(Resource).where(Resource.session_id == session.id, Resource.title == asset))
                if not resource:
                    db.add(Resource(session_id=session.id, title=asset, description=f"{title}的{asset}。", resource_type="video" if "影片" in asset else "file", visibility=Visibility.PUBLIC if title.startswith("迎新") else Visibility.MEMBER))
                else:
                    resource.description = f"{title}的{asset}。"


def main() -> None:
    with SessionLocal() as db:
        ensure_admin(db)
        ensure_courses(db)
        db.commit()
    print("已建立 115-1 課程假資料與初始管理員。")


if __name__ == "__main__":
    main()
