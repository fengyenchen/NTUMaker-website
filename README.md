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

整體採用 NTUMaker 自己的 2.5D 視覺系統：柔和深色空間、斜角與堆疊卡片、實體感硬陰影，以及帶有鮮明材質的零件物件。首頁第一個視窗以既有瓶蓋 3D 模型作為最大品牌焦點；模型會延遲載入，並遵守 `prefers-reduced-motion`。

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

## 資料夾架構

```text
NTUMaker-website/
├─ web/                     # Next.js 公開網站、社員區與管理後台
│  ├─ app/                  # App Router 頁面與 layout
│  ├─ components/           # 共用元件與 3D 元件
│  ├─ lib/                  # API client、驗證與共用函式
│  └─ public/               # 靜態圖片與圖示
├─ api/                     # FastAPI 後端
│  ├─ app/
│  │  ├─ api/               # API routes
│  │  ├─ core/              # 設定、安全性與權限
│  │  ├─ models/            # SQLAlchemy 資料模型
│  │  ├─ schemas/           # 請求與回應格式
│  │  └─ services/          # 登入、內容與 Email 服務
│  ├─ alembic/              # Neon PostgreSQL migrations
│  └─ tests/                # API 測試
├─ design-system/           # 中文設計規範
├─ package.json             # 前端 workspace 指令
└─ docker-compose.yml       # 本機服務（需要時使用）
```

## 本機啟動

### 1. 安裝前端套件

需要 Node.js 20 以上版本與 pnpm：

```cmd
pnpm install
```

### 2. 設定環境變數

複製範例檔並填入 Neon 與前後端網址：

```bat
copy web\.env.example web\.env
copy api\.env.example api\.env
```

後端的 `DATABASE_URL` 可直接貼上 Neon 提供的 pooled connection URL，並保留 `sslmode=require`。程式會自動改用已安裝的 psycopg v3 驅動，不需要另外安裝 `psycopg2`。

### 3. 啟動 FastAPI

```bat
cd api
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload --port 8000
```

API 文件啟動後位於 `http://localhost:8000/docs`。

`python -m app.db.seed` 會將社博課程表建立為 115-1 假資料，重複執行不會重複新增。請在 `api/.env` 設定 `ADMIN_EMAIL`，該帳號會取得初始管理員權限。

### 4. 啟動 Next.js

另開終端機，在專案根目錄執行：

```cmd
pnpm dev
```

網站位於 `http://localhost:3000`。Next.js 會透過伺服器端 `API_URL` 反向代理 FastAPI，登入 Cookie 不需要暴露給前端程式。

社課頁與課程內容頁會優先讀取 FastAPI；若本機 API 尚未啟動或資料庫尚無課程，則自動使用 `web/data/course-schedule.ts` 的假資料，方便前端持續開發。

### 5. 上線前檢查

```cmd
pnpm typecheck
pnpm build
```
