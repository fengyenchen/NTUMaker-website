from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.content import CourseSeries, CourseSession, CourseTrack, Resource, Visibility
from app.models.user import Role, User, UserRole

TAIPEI = ZoneInfo("Asia/Taipei")

TRACKS = [
    {
        "track": CourseTrack.TUESDAY,
        "title": "Arduino 循線車專案",
        "description": "新手友善的連貫專案，從原理、電路與程式一路完成機構、競賽及成果發表。",
        "sessions": [
            ("迎新", "認識社團、課程路線與本學期專案。", "2026-09-15", ["迎新簡報"]),
            ("學理", "建立循線車會使用到的基礎觀念。", "2026-09-22", ["課程講義", "上課影片"]),
            ("電路", "認識元件、接線與感測器輸入。", "2026-09-29", ["課程講義", "上課影片", "接線圖"]),
            ("程式", "撰寫控制邏輯，讓循線車依感測結果行動。", "2026-10-13", ["課程講義", "上課影片", "範例程式"]),
            ("彈性", "整合前半學期內容並處理各組進度。", "2026-11-03", ["除錯筆記", "上課影片"]),
            ("機構", "完成車體結構、固定方式與零件配置。", "2026-11-17", ["課程講義", "上課影片", "製作檔案"]),
            ("競賽", "測試、調校並完成循線車競賽。", "2026-12-01", ["競賽規則", "測試紀錄"]),
            ("發表會", "整理作品歷程並進行成果展示。", "2026-12-15", ["發表模板", "成果影片"]),
        ],
    },
    {
        "track": CourseTrack.FRIDAY,
        "title": "主題工作坊",
        "description": "每場工作坊可獨立參加，針對一項技術完成可展示的實作。",
        "sessions": [
            ("工作坊 1：水晶球燈座", "製作結合燈光與造型的桌上作品。", "2026-10-02", ["工作坊教材", "示範影片", "製作檔案"]),
            ("工作坊 2：IoT Project", "讓裝置連上網路並傳送或接收資料。", "2026-10-16", ["工作坊教材", "示範影片", "範例程式"]),
            ("工作坊 3：放映機", "從光學與機構概念完成簡易放映裝置。", "2026-11-06", ["工作坊教材", "示範影片", "製作檔案"]),
            ("工作坊 4：無人機", "認識飛行原理、控制與安全操作。", "2026-12-04", ["工作坊教材", "示範影片", "安全須知"]),
        ],
    },
]


def ensure_admin(db: Session) -> None:
    email = get_settings().admin_email
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


def ensure_courses(db: Session) -> None:
    for track_data in TRACKS:
        series = db.scalar(select(CourseSeries).where(CourseSeries.semester == "115-1", CourseSeries.track == track_data["track"]))
        if not series:
            series = CourseSeries(title=track_data["title"], semester="115-1", track=track_data["track"], description=track_data["description"])
            db.add(series)
            db.flush()
        for index, (title, summary, date_text, assets) in enumerate(track_data["sessions"]):
            session = db.scalar(select(CourseSession).where(CourseSession.series_id == series.id, CourseSession.title == title))
            if not session:
                session = CourseSession(series_id=series.id, title=title, summary=summary, starts_at=datetime.fromisoformat(f"{date_text}T19:00:00").replace(tzinfo=TAIPEI), order_index=index, visibility=Visibility.PUBLIC)
                db.add(session)
                db.flush()
            for asset in assets:
                exists = db.scalar(select(Resource.id).where(Resource.session_id == session.id, Resource.title == asset))
                if not exists:
                    db.add(Resource(session_id=session.id, title=asset, description=f"{title}的{asset}。", resource_type="video" if "影片" in asset else "file", visibility=Visibility.PUBLIC if title == "迎新" else Visibility.MEMBER))


def main() -> None:
    with SessionLocal() as db:
        ensure_admin(db)
        ensure_courses(db)
        db.commit()
    print("已建立 115-1 課程假資料與初始管理員。")


if __name__ == "__main__":
    main()
