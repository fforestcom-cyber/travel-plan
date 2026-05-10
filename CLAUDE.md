# Korea Travel App — CLAUDE.md

## 專案概述

韓國 5 天旅遊行程管理 App，用於規劃、記錄與追蹤旅遊相關資訊。

- **框架**：React 19 + TypeScript 4.9 + React Router 7
- **樣式**：Tailwind CSS 3.4（PostCSS + Autoprefixer）
- **後端/資料庫**：Firebase 12
- **測試**：Jest + React Testing Library
- **專案路徑**：`D:\claudecode\korea-travel`
- **線上網址**：https://korea-travel-751da.web.app

---

## 常用指令

```bash
npm start                              # 啟動開發環境（等同 npm run dev）
npm run dev                            # 啟動開發環境
DISABLE_ESLINT_PLUGIN=true npm run build  # 建置正式版本（需加此環境變數，避免 ESLint 路徑大小寫衝突）
npm test                               # 執行測試（Jest + React Testing Library）
firebase deploy --only hosting         # 部署至 Firebase Hosting
npm run eject                          # ⚠️ 不可逆操作，請勿執行
```

> **Build 注意**：Windows 路徑大小寫不一致（`D:\claudecode` vs `D:\ClaudeCode`）會造成 ESLint plugin 衝突，建置時必須加 `DISABLE_ESLINT_PLUGIN=true`。

---

## 專案結構

```
src/
├── App.tsx                  # 根元件、路由設定
├── index.tsx / index.css    # 進入點
├── components/
│   ├── Navbar.tsx           # 頂部導覽列
│   ├── TaxiGuide.tsx        # 計程車叫車備查指南（靜態，含點擊複製韓文地址）
│   ├── CatchTableGuide.tsx  # 韓國訂位 App「캐치테이블」使用指南（靜態）
│   ├── ToiletGuide.tsx      # 韓國廁所指南（靜態，含韓文關鍵字複製）
│   ├── home/
│   │   └── WeatherCard.tsx  # 首頁天氣卡片元件
│   └── layout/
│       ├── AppWrapper.tsx   # 全域版面包裝
│       ├── DayPlanView.tsx  # 單日行程檢視
│       └── TabBar.tsx       # 底部分頁導覽列
├── pages/
│   ├── HomePage.tsx         # 首頁（天氣資訊）
│   ├── SchedulePage.tsx     # 行程頁（5 天行程總覽）
│   ├── ChecklistPage.tsx    # 清單頁（行前準備）
│   ├── ExpensePage.tsx      # 費用頁（旅遊預算追蹤）
│   └── NotesPage.tsx        # 筆記頁（旅遊筆記）
├── data/
│   └── mockData.ts          # 旅程基本資料（機票、日期、匯率、天氣）
├── lib/
│   ├── firebase.ts          # Firebase 初始化設定
│   └── storage.ts           # 資料存取封裝（Firebase CRUD）
└── types/
    ├── dayPlan.ts           # 單日行程相關型別
    └── index.ts             # 共用型別定義
scripts/
└── import-schedule.mjs     # 行程資料匯入腳本
```

---

## 路由（React Router 7）

路由設定在 `App.tsx`，使用 `react-router-dom` v7。新增頁面時需同步在 `App.tsx` 新增路由，並在 `TabBar.tsx` 新增對應導覽項目。

---

## 核心型別（types/）

修改資料結構前請先確認 `types/dayPlan.ts` 與 `types/index.ts`，所有元件應依照這些型別定義操作。

---

## Firebase 說明

- 設定集中在 `src/lib/firebase.ts`，不要直接在元件內初始化 Firebase
- 所有資料存取請透過 `src/lib/storage.ts` 封裝的函式
- 環境變數存放於 `.env`（不可提交至版本控制）

**權限設計（firestore.rules）：**

| Collection | 可寫入者 |
|-----------|---------|
| `expenses`, `twd_expenses` | 任何登入用戶（協作） |
| `checklists` | 任何登入用戶（協作） |
| `notes` | 任何登入用戶（協作） |
| `shoppingItems` | 僅 `abc022778@gmail.com` |
| `checklistItems`（行程頁）及其他 | 僅 `abc022778@gmail.com` |

```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

---

## 頁面與功能對應

| 頁面 | 檔案 | 功能 |
|------|------|------|
| 首頁 | `HomePage.tsx` | 天氣卡片、旅程概覽 |
| 行程 | `SchedulePage.tsx` | 5 天行程，使用 `DayPlanView` 顯示每日 |
| 清單 | `ChecklistPage.tsx` | 韓國購物清單（圖片卡片格、血條統計、勾選機制） |
| 費用 | `ExpensePage.tsx` | 費用記錄與統計 |
| 筆記 | `NotesPage.tsx` | `TaxiGuide`、`CatchTableGuide`、`ToiletGuide` ＋自由格式旅遊筆記（含標題、可點擊 URL） |

---

## 開發注意事項

- **元件命名**：PascalCase（`WeatherCard`、`DayPlanView`）
- **型別**：所有 props 與資料結構必須有 TypeScript 型別定義
- **樣式**：使用 Tailwind CSS utility class，避免自訂 CSS（除非必要）
- **資料層**：元件不直接呼叫 Firebase，一律透過 `storage.ts`
- **不修改的檔案**：`.env`、`firebase.ts`（除非變更 Firebase 專案）

---

## TaxiGuide 元件說明

`src/components/TaxiGuide.tsx` 是純靜態元件（無 Firebase），放在旅記頁（`NotesPage`）最頂部。

**結構（由上到下）：**
1. 收折 toggle header
2. 叫車 App 比較（Uber vs k.ride）
3. 最佳叫車策略
4. 各日目的地（Day 1–5，每日可展開）
   - 每筆行程顯示：行程編號 badge ＋ 中文路線（小字輔助）
   - 韓文地址大字呈現，**點擊整塊複製**，可直接貼進 Naver Map
5. 叫車實用技巧（2 欄格線）

**資料修改位置：**
- `DAYS` 陣列：各日行程與韓文地址
- `TIPS` 陣列：叫車技巧內容（支援 HTML `<b>` / `<br>`）

---

## CatchTableGuide 元件說明

`src/components/CatchTableGuide.tsx` 是純靜態元件，放在旅記頁（`NotesPage`）TaxiGuide 之後。

**功能：**
1. 收折 toggle header
2. App 安裝與帳號設定步驟（5 步驟）
3. 訂位清單：各餐廳的訂位狀態（`reserved` / `walk-in` / `tbd`）、店名韓文、備註

**資料修改位置：**
- `SETUP` 陣列：安裝步驟說明
- `PLACES` 陣列：各餐廳訂位資訊

---

## ToiletGuide 元件說明

`src/components/ToiletGuide.tsx` 是純靜態元件，放在旅記頁（`NotesPage`）CatchTableGuide 之後。

**功能：**
1. 收折 toggle header
2. 韓文關鍵字列表（點擊複製，可貼入地圖搜尋）
3. 廁所地點說明（便利商店、地鐵站、百貨公司、觀光景點）
4. 實用技巧

**資料修改位置：**
- `KEYWORDS` 陣列：韓文搜尋關鍵字
- `TIPS` 陣列：廁所地點說明

---

## App.tsx 登入流程

`LoginScreen` 元件接受 `loading` prop，登入按鈕在登入進行中會 `disabled`，防止重複點擊。`App` 元件使用 `loggingIn` state 追蹤登入狀態。

---

## ChecklistPage 說明

`src/pages/ChecklistPage.tsx` 是購物清單頁，資料存於 Firestore `shoppingItems` collection。

**資料結構（ShoppingItem）：**
```ts
{ id, name, store, imageUrl, bought, createdAt }
```

**店家清單（STORES）與顏色（STORE_COLOR）：**
Olive Young（磚灰紅）、藥局（鼠尾草綠）、大創 Daiso（石板藍）、超市（赭土橙）、便利商店（莫蘭迪藍）、釜山伴手禮（薰衣草紫）、其他。

**IMPORT_SEED：**
元件內硬編碼 57 筆商品資料（28 筆 Olive Young 含 Cloudinary 圖片 URL、29 筆其他店家無圖）。點擊「清空並重新匯入」按鈕可重置所有資料。

**圖片：**
- Olive Young 商品圖片已上傳至 Cloudinary，路徑：`korea-travel/shopping/`
- 無圖片的卡片可點擊圖片區域上傳圖片（使用 `uploadImage` from `lib/storage.ts`），上傳後自動更新 Firestore

**版面：**
- 上方：各店家血條統計（彩色圓點 + 店名 + 已買/總數 + 進度條），可點選篩選
- 中間：全部 / 未買 / 已買 篩選切換
- 下方：2 欄卡片格（白底、`radius-md` 圓角、1:1 圖片、checkbox + 商品名 + 店家標示）

---

## NotesPage 旅遊筆記說明

`src/pages/NotesPage.tsx` 自由格式筆記，資料存於 Firestore `notes` collection。

**Note 型別：**
```ts
{ id, title, text, createdAt }
```

- 標題欄位（`title`）獨立顯示於卡片頂部
- 內文中的 URL（`https://...`）自動渲染為可點擊連結（`renderWithLinks` helper）
- 長網址透過 `overflow-wrap: break-word` 防止版面爆版

---

## Cloudinary 說明

- Cloud Name：`dzflsgpjq`
- Upload Preset：`korea-travel`（unsigned，前端可直接上傳）
- 購物清單圖片路徑：`korea-travel/shopping/`
- `uploadImage(file, folder)` 函式在 `src/lib/storage.ts`

---

## scripts/

- `import-shopping.js`：一次性匯入腳本（參考用）。可上傳 base64 圖片至 Cloudinary，但無法從 Node.js 寫入 Firestore（需 Google Auth Token），實際匯入改由 React App 內的 `clearAndImport` 函式執行。

---

## .claude/ 目錄

專案內有 `.claude/` 目錄，存放 Claude Code 的對話設定與記憶，請勿手動刪除。
