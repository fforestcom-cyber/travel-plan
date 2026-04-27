# Korea Travel App — CLAUDE.md

## 專案概述

韓國 5 天旅遊行程管理 App，用於規劃、記錄與追蹤旅遊相關資訊。

- **框架**：React 19 + TypeScript 4.9 + React Router 7
- **樣式**：Tailwind CSS 3.4（PostCSS + Autoprefixer）
- **後端/資料庫**：Firebase 12
- **測試**：Jest + React Testing Library
- **專案路徑**：`C:\Users\USER\Desktop\claude code\korea-travel`

---

## 常用指令

```bash
npm start                  # 啟動開發環境（等同 npm run dev）
npm run dev                # 啟動開發環境
npm run build              # 建置正式版本
npm test                   # 執行測試（Jest + React Testing Library）
npm run import-schedule    # 匯入行程資料至 Firebase
npm run eject              # ⚠️ 不可逆操作，請勿執行
```

---

## 專案結構

```
src/
├── App.tsx                  # 根元件、路由設定
├── index.tsx / index.css    # 進入點
├── components/
│   ├── Navbar.tsx           # 頂部導覽列
│   ├── TaxiGuide.tsx        # 計程車叫車備查指南（靜態，含點擊複製韓文地址）
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
│   ├── scheduleDay1~5.ts    # 各天靜態行程資料
│   └── mockData.ts          # 開發用假資料
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
| 清單 | `ChecklistPage.tsx` | 行前準備勾選清單 |
| 費用 | `ExpensePage.tsx` | 費用記錄與統計 |
| 筆記 | `NotesPage.tsx` | 計程車指南（`TaxiGuide`）＋自由格式旅遊筆記 |

---

## 行程資料

- 靜態行程資料分別存放於 `data/scheduleDay1.ts` ～ `scheduleDay5.ts`
- 需要更新行程內容時，修改對應 `scheduleDay{N}.ts` 後執行匯入腳本：
  ```bash
  node scripts/import-schedule.mjs
  ```

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

## .claude/ 目錄

專案內有 `.claude/` 目錄，存放 Claude Code 的對話設定與記憶，請勿手動刪除。
