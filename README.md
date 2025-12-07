# 森森丸天氣 API 服務 (Node.js + CWA)

這是一個使用 Node.js + Express 開發的動態天氣預報 API 服務，串接中央氣象署（CWA）開放資料平台。本服務的核心是提供台灣各縣市的 36 小時天氣預報，以支援可愛的「森森丸天氣」前端網站。

## 功能特色

- ✅ 串接 CWA 氣象資料開放平台 (F-C0032-001 資料集)。
- ✅ 動態查詢：可透過 URL 參數查詢台灣各縣市天氣預報。
- ✅ 環境變數管理
- ✅ RESTful API 設計
- ✅ CORS 支援
- ✅ JSON 回傳數據已優化為純數值格式（溫度、降雨率），方便前端計算與渲染。

## 安裝步驟

### 1. 安裝相依套件

```bash
npm install
```

### 2. 設定環境變數

在專案根目錄建立 `.env` 檔案：

```bash
touch .env
```

編輯 `.env` 檔案，填入你的 CWA API Key：

```env
CWA_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
```

### 3. 取得 CWA API Key

1. 前往 [氣象資料開放平臺](https://opendata.cwa.gov.tw/)
2. 註冊/登入帳號
3. 前往「會員專區」→「取得授權碼」
4. 複製 API 授權碼
5. 將授權碼填入 `.env` 檔案的 `CWA_API_KEY`

## 啟動服務

### 開發模式（自動重啟）

```bash
npm run dev
```

### 正式模式

```bash
npm start
```

伺服器會在 `http://localhost:3000` 啟動

## API 端點

### 1. 首頁

```
GET /
```

回應：

```json
{
  "message": "歡迎使用 森森丸天氣 API",
  "endpoints": {
    "dynamicWeather": "/api/weather/:locationName",
    "health": "/api/health"
  }
}
```

### 2. 健康檢查

```
GET /api/health
```

回應：

```json
{
  "status": "OK",
  "timestamp": "2025-09-30T12:00:00.000Z"
}
```

### 3. 取得動態城市天氣預報

使用 URL 參數 locationName 傳遞城市名稱，後端將查詢 CWA 並回傳數據。
```
GET /api/weather/:locationName
```

範例呼叫：

- GET /api/weather/臺北市
- GET /api/weather/高雄市
- GET /api/weather/新北市

回應範例：

```json
{
  "success": true,
  "data": {
    "city": "臺北市",
    "updateTime": "2025-09-30T10:30:00+08:00",
    "forecasts": [
      {
        "startTime": "2025-09-30 18:00:00",
        "endTime": "2025-10-01 06:00:00",
        "weather": "多雲時晴",
        "rain": 10,        // *** 僅回傳數值 ***
        "minTemp": 25,     // *** 僅回傳數值 ***
        "maxTemp": 32,     // *** 僅回傳數值 ***
        "comfort": "悶熱",
        "windSpeed": "偏南風 3-4 級"
      }
      // ... 更多 36 小時預報數據 ...
    ]
  }
}
```

## 專案結構

```
CwaWeather-backend/
├── server.js              # Express 伺服器主檔案（包含路由與控制器邏輯）
├── .env                   # 環境變數（不納入版控）
├── .gitignore            # Git 忽略檔案
├── package.json          # 專案設定與相依套件
├── package-lock.json     # 套件版本鎖定檔案
└── README.md            # 說明文件
```

## 使用的套件

- **express**: Web 框架
- **axios**: HTTP 客戶端
- **dotenv**: 環境變數管理
- **cors**: 跨域資源共享
- **nodemon**: 開發時自動重啟（開發環境）

## 注意事項

1. 請確保已申請 CWA API Key 並正確設定在 `.env` 檔案中
2. API Key 有每日呼叫次數限制，請參考 CWA 平台說明
3. 不要將 `.env` 檔案上傳到 Git 版本控制（已包含在 `.gitignore` 中）
4. 所有路由與業務邏輯都在 `server.js` 檔案中，適合小型專案使用

## 錯誤處理

API 會回傳適當的 HTTP 狀態碼和錯誤訊息：

- `200`: 成功
- `404`: 找不到資料
- `500`: 伺服器錯誤

錯誤回應格式：

```json
{
  "error": "錯誤類型",
  "message": "錯誤訊息"
}
```

## 授權

MIT
