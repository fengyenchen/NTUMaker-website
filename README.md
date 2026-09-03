# NTUMaker 社團網站

NTUMaker 的公開資訊、社課教材、社員影片與幹部管理平台。

> Build. Learn. Share.  
> 動手實作、持續學習、分享創造。

## 專案目標

- 一般訪客：查看公告、社課與工作坊簡介、公開資源與作品。
- 社員：以 Email 登入，在資格有效期間觀看限定教材與 YouTube 課程影片。
- Admin：管理帳號、社員期限、公告、課程、資源與發布狀態。
- 未來擴充：建立社群草稿、審核與排程流程，再串接 Instagram、Facebook 與 Threads。

## 技術架構

- Web：Next.js App Router、React、TypeScript、Tailwind CSS
- 3D：React Three Fiber
- API：FastAPI、SQLAlchemy、Alembic
- Database：Neon PostgreSQL
- Authentication：Email Magic Link／一次性驗證碼，Session 使用 HttpOnly Cookie
- Video：資料庫只保存 YouTube URL 與影片 metadata

```text
Browser
  └─ Next.js Web
       ├─ 公開網站
       ├─ 社員學習區
       ├─ Admin 後台
       └─ FastAPI
            ├─ Email 登入與 RBAC
            ├─ 內容／課程／社員 API
            └─ Neon PostgreSQL
```

## 資訊架構

### 公開網站

```text
首頁
├─ 最新公告
├─ 社課
│  ├─ 星期二：基礎連貫專案
│  └─ 星期五：進階模組工作坊
├─ 工作坊／活動
├─ 公開資源
├─ 歷屆作品
├─ 關於 NTUMaker
└─ 登入
```

### 社員學習區

```text
/learn
├─ 學習首頁
├─ 星期二課程進度
├─ 星期五工作坊
├─ 教材庫
├─ YouTube 課程影片
└─ 帳號與社員效期
```

### Admin 後台

```text
/admin
├─ Overview
├─ 公告管理
├─ 社課與工作坊
├─ 教材與影片
├─ 活動與作品
├─ 會員與社員期限
├─ 社群發布（預留）
├─ 操作紀錄
└─ 網站設定
```

## 權限模型

| 功能 | 一般訪客 | 有效社員 | Admin |
|---|---:|---:|---:|
| 查看公開內容 | ✓ | ✓ | ✓ |
| 查看社員教材／影片 | — | ✓ | ✓ |
| 管理個人帳號 | — | ✓ | ✓ |
| 發布與管理內容 | — | — | ✓ |
| 管理帳號與社員效期 | — | — | ✓ |

社員資格以 `starts_at`、`expires_at` 控制。到期後保留帳號與紀錄，但失去限定內容權限。Admin 角色與社員期限分開管理。所有授權都由 FastAPI 驗證，前端隱藏 UI 不視為權限保護。

## 核心資料模型

- `users`：Email、狀態與基本資料
- `roles`、`user_roles`：可疊加的角色
- `memberships`：社員起訖日與狀態
- `announcements`：公告與發布狀態
- `course_series`：星期二基礎線／星期五工作坊線
- `course_sessions`：每堂課的內容、講師與日期
- `resources`：教材、YouTube URL、附件連結與可見層級
- `events`、`projects`、`tags`
- `audit_logs`：Admin 操作紀錄
- `social_posts`、`social_publications`：未來跨平台發布

## 視覺方向

融合 SITCON Hackathon 的深色工程網格、大型標題與高密度資訊卡，以及 OpenHCI 的螢光撞色、數位介面和實驗性排版。首頁以瓶蓋 3D 模型作為 Maker 品牌焦點；模型會延遲載入，並為手機、低效能裝置及 `prefers-reduced-motion` 提供靜態／簡化版本。

顏色統一由 CSS 語意變數管理：`primary`、`secondary`、`accent`、`background`、`surface`、`foreground`、`muted`、`border`、`success`、`warning`、`destructive` 與 `focus`。

完整設計規則位於 [`design-system/ntumaker/MASTER.md`](design-system/ntumaker/MASTER.md)。

## 開發階段

1. 專案骨架、設計系統與基礎品質工具
2. 公開首頁與 3D Hero
3. 公開內容、社課與資源頁
4. FastAPI、Neon schema 與登入權限
5. 社員學習區
6. Notion 風格 Admin 後台
7. 整合測試、響應式與無障礙檢查
8. 社群排程與平台串接（後續版本）
