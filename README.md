# NTUMaker 社團網站

NTUMaker 的公開資訊、社課資源、社員影片與幹部管理平台。

> Build. Learn. Share.  
> 動手實作、持續學習、分享創造。

## 專案目標

- 一般訪客：查看公告、社課與工作坊簡介、公開資源與作品。
- 社員：以 Email 登入，在資格有效期間觀看限定資源，並管理顯示名稱與查看社員資格。
- Admin：管理帳號、社員期限、公告、課程、資源與發布狀態。
- 社群發布：建立草稿、排程，並由後端排程 worker 串接 Instagram、Facebook Page 與 Threads 發文。

正式社群連結：

- Instagram：<https://www.instagram.com/ntu_maker/>
- Facebook：<https://www.facebook.com/ntumaker2018>

## 技術架構

- Web：Next.js App Router、React、TypeScript、Tailwind CSS
- 3D：React Three Fiber
- API：FastAPI、SQLAlchemy、Alembic
- Database：Neon PostgreSQL
- Authentication：社員使用資料庫 Email 白名單；管理員使用 Email＋密碼；Session 使用 HttpOnly Cookie
- Resource：資料庫保存連結、圖片、文件與純文字內容

```text
Browser
  └─ Next.js Web
       ├─ 公開網站
       ├─ 社員設定
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
├─ 資源
├─ 關於
└─ 登入
```

### 社員設定

```text
/setting
├─ 顯示名稱
├─ 登入 Email
└─ 社員資格有效期限
```

課程與資源統一由 `/resources` 進入；每堂課使用資料庫 `course_sessions.id` 作為網址識別，例如 `/resources/<session-uuid>`。

### Admin 後台

```text
/admin
├─ Overview
├─ 公告管理
├─ 社課、工作坊與各堂資源／影片
├─ 教學文章與活動紀錄
├─ 活動與作品
├─ 會員與社員期限
├─ 社群發布
├─ 操作紀錄
└─ 網站設定
```

## 權限模型

| 功能 | 一般訪客 | 有效社員 | Admin |
|---|---:|---:|---:|
| 查看公開內容 | ✓ | ✓ | ✓ |
| 查看社員資源／影片 | — | ✓ | ✓ |
| 管理個人帳號 | — | ✓ | ✓ |
| 發布與管理內容 | — | — | ✓ |
| 管理帳號與社員效期 | — | — | ✓ |

社員資格以 `starts_at`、`expires_at` 控制。新增社員時，開始日期由後端以台北當日自動建立，管理員只需設定結束日期；到期後保留帳號與紀錄，但失去限定內容權限。Admin 角色與社員期限分開管理。所有授權都由 FastAPI 驗證，前端隱藏 UI 不視為權限保護。

## 核心資料模型

- `users`：Email、狀態、基本資料與管理員密碼雜湊
- `roles`、`user_roles`：可疊加的角色
- `memberships`：社員起訖日與狀態
- `announcements`：公告與發布狀態
- `course_series`：星期二基礎線／星期五工作坊線
- `course_sessions`：每堂課的內容、講師與日期
- `resources`：資源連結、圖片、文件、純文字與可見層級
- `events`、`projects`、`tags`
- `audit_logs`：Admin 操作紀錄
- `social_posts`、`social_publications`：未來跨平台發布

## 視覺方向

整體採用「Notion 紙張介面 × 2.5D 自造工作台」：紙白背景、墨色資訊層級、品牌紅重點、斜角與堆疊卡片、克制的實體硬陰影，以及帶有鮮明材質的零件物件。藍色與橘色只作小面積點綴。首頁第一個視窗以既有瓶蓋 3D 模型作為最大品牌焦點；模型會預先載入，並遵守 `prefers-reduced-motion`。

顏色統一由 CSS 語意變數管理：`primary`、`secondary`、`accent`、`background`、`surface`、`foreground`、`muted`、`border`、`success`、`warning`、`destructive` 與 `focus`。

完整設計規則位於 [`design-system/ntumaker/MASTER.md`](design-system/ntumaker/MASTER.md)。

## 開發階段

1. 專案骨架、設計系統與基礎品質工具
2. 公開首頁與 3D Hero
3. 公開內容、社課與資源頁
4. FastAPI、Neon schema 與登入權限
5. 社員設定與限定資源
6. Notion 風格 Admin 後台
7. 整合測試、響應式與無障礙檢查
8. 社群排程與平台串接

## 資料夾架構

```text
NTUMaker-website/
├─ frontend/                # Next.js 公開網站、社員區與管理後台
│  ├─ app/                  # App Router 頁面與 layout
│  ├─ components/           # 共用元件與 3D 元件
│  ├─ lib/                  # API client、驗證與共用函式
│  └─ public/               # 靜態圖片與圖示
├─ backend/                 # FastAPI 後端
│  ├─ app/
│  │  ├─ api/               # API routes
│  │  ├─ core/              # 設定、安全性與權限
│  │  ├─ models/            # SQLAlchemy 資料模型
│  │  ├─ schemas/           # 請求與回應格式
│  │  └─ services/          # 登入、內容與 Email 服務
│  ├─ alembic/              # Neon PostgreSQL migrations
│  └─ tests/                # API 測試
├─ design-system/           # 中文設計規範
└─ package.json             # 前端 workspace 指令
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
copy frontend\.env.example frontend\.env
copy backend\.env.example backend\.env
```

後端的 `DATABASE_URL` 可直接貼上 Neon 提供的 pooled connection URL，並保留 `sslmode=require`。程式會自動改用已安裝的 psycopg v3 驅動，不需要另外安裝 `psycopg2`。

### 3. 啟動 FastAPI

第一次設定後端環境才需要建立虛擬環境與安裝套件：

```bat
cd backend
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
```

之後平常啟動只需要：

```bat
cd backend
.venv\Scripts\activate.bat
alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```

API 文件啟動後位於 `http://localhost:8000/docs`。

只有第一次建立或需要更新初始管理員時，才手動執行 `python -m app.db.seed`。此指令只會建立或更新初始管理員，不會建立課程、課堂或資源假資料，也不會刪除既有資料。請先在 `backend/.env` 設定 `ADMIN_EMAIL` 與至少 12 字元的 `ADMIN_PASSWORD`；該帳號會取得初始管理員權限，並可從登入頁的「管理員」分頁登入。

登入頁分為兩種身分：

- 社員：輸入後台已建立、帳號啟用且資格有效的 Email，核對成功後會回到登入前頁面；若無回跳位置則進入 `/setting`。
- 管理員：輸入具有 Admin 角色的 Email 與密碼，進入 `/admin`。密碼只以 PBKDF2-SHA256 雜湊保存在資料庫。

修改資料模型後請再次執行 `alembic upgrade head`。現有管理員第一次加入密碼欄位後，重新執行 `python -m app.db.seed` 即可依 `.env` 設定密碼。

### 4. 啟動 Next.js

另開終端機，在專案根目錄執行：

```cmd
pnpm dev
```

網站位於 `http://localhost:3000`。Next.js 會透過伺服器端 `API_URL` 反向代理 FastAPI，登入 Cookie 不需要暴露給前端程式。

首頁、社課頁與課程內容頁會優先讀取 FastAPI；若本機 API 尚未啟動或資料庫尚無課程，則自動使用 `frontend/data/course-schedule.ts` 的假資料，方便前端持續開發。首頁課程卡的名稱、說明與課堂預覽皆取自同一份課程資料。

### 5. 上線前檢查

```cmd
pnpm typecheck
pnpm build
```

### 社群排程發文設定

要啟用實際發文，請在 `backend/.env` 設定 R2 公開圖片網域，以及各平台的帳號 ID 與 access token：`INSTAGRAM_USER_ID`、`INSTAGRAM_ACCESS_TOKEN`、`FACEBOOK_PAGE_ID`、`FACEBOOK_PAGE_ACCESS_TOKEN`、`THREADS_USER_ID`、`THREADS_ACCESS_TOKEN`。後端會每 30 秒檢查到期的排程，成功後標記為「已發布」，API 失敗則標記為「發布失敗」並保存錯誤原因。Meta 權限與 App Review 仍須由管理員在 Meta 開發者後台完成。

正式啟用前可呼叫 `POST /api/v1/admin/social-posts/{id}/publish-test` 做安全測試；這個端點只驗證設定與預計發布的平台，不會呼叫 Meta API，也不會改變貼文狀態。

#### 社群圖片編輯流程

- 每則貼文最多 10 張圖片，每張圖片目前最多 10 MB。
- 在編輯頁新增的圖片只會先暫存在瀏覽器，按下「儲存」或「轉成排程」後才會上傳至 Cloudflare R2。
- 點擊刪除圖片時，畫面會先暫時移除；按下儲存後才會同步刪除資料庫紀錄與 R2 物件。
- 如果用新圖片取代舊圖片，儲存時會先刪除標記的舊圖片，再上傳新增圖片，避免暫存期間超過 10 張的限制。
- 草稿至少要有貼文文字或一張圖片；排程貼文需要貼文文字與排程時間，若發布到 Instagram 另需至少一張圖片。

公告與社課資源中的圖片／文件不會立即刪除，讓管理員有時間復原；後端每天會清理 `social/` 與 `resources/` 下已超過 24 小時、且未被公告、社課資源或社群貼文引用的檔案。清理週期與保留時間可用 `R2_CLEANUP_INTERVAL_SECONDS`、`R2_CLEANUP_GRACE_SECONDS` 調整，並可用 `R2_CLEANUP_ENABLED=false` 停用。

社課資源支援連結、文件（含圖片與影片）與文字。圖片、影片與常見文件（PDF、Word、Excel、PowerPoint、ZIP、文字檔）可直接從管理後台上傳至 R2；系統會依檔案格式自動選擇圖片、影片或 PDF 預覽，無法預覽的格式則提供下載。文字內容直接儲存並提供選取複製。資源檔案會以 `resources/` 前綴保存，未使用檔案會依保留期限自動清理。
