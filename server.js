require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// CWA API 設定
const CWA_API_BASE_URL = "https://opendata.cwa.gov.tw/api";
const CWA_API_KEY = process.env.CWA_API_KEY;

// Middleware
// 啟用 CORS 讓前端能順利存取 (解決跨域問題)
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 核心函式：根據地點名稱取得天氣預報
 * @param {object} req - Express Request 物件
 * @param {object} res - Express Response 物件
 */
const getWeatherByLocation = async (req, res) => {
  // 從 URL 參數中取得使用者選擇的城市名稱
  const locationName = req.params.locationName;
  
  if (!locationName) {
      return res.status(400).json({
          error: "請求錯誤",
          message: "請在路徑中指定城市名稱，例如 /api/weather/臺北市",
      });
  }
  
  try {
    // 檢查是否有設定 API Key
    if (!CWA_API_KEY) {
      return res.status(500).json({
        error: "伺服器設定錯誤",
        message: "請在 .env 檔案中設定 CWA_API_KEY",
      });
    }

    // 呼叫 CWA API - 一般天氣預報（36小時）
    const response = await axios.get(
      `${CWA_API_BASE_URL}/v1/rest/datastore/F-C0032-001`,
      {
        params: {
          Authorization: CWA_API_KEY,
          // *** 關鍵修改：動態傳入城市名稱 ***
          locationName: locationName, 
        },
      }
    );

    // 取得該城市的天氣資料 (CWA API 設計，location 陣列通常只有一筆符合查詢城市的資料)
    const locationData = response.data.records.location[0];

    if (!locationData) {
      // 雖然理論上指定城市會回傳，但以防萬一
      return res.status(404).json({
        error: "查無資料",
        message: `無法取得 ${locationName} 天氣資料，請檢查城市名稱是否正確`,
      });
    }

    // 整理天氣資料
    const weatherData = {
      city: locationData.locationName,
      // 使用 data.records.issueTime 更有意義
      updateTime: response.data.records.issueTime, 
      forecasts: [],
    };

    // 解析天氣要素
    const weatherElements = locationData.weatherElement;
    const timeCount = weatherElements[0].time.length;

    for (let i = 0; i < timeCount; i++) {
      const forecast = {
        startTime: weatherElements[0].time[i].startTime,
        endTime: weatherElements[0].time[i].endTime,
        weather: "",
        rain: 0, // 初始值設為數字 0
        minTemp: 0,
        maxTemp: 0,
        comfort: "",
        windSpeed: "",
      };

      weatherElements.forEach((element) => {
        const value = element.time[i].parameter;
        switch (element.elementName) {
          case "Wx":
            forecast.weather = value.parameterName;
            break;
          case "PoP":
            // *** 關鍵修改：只回傳數值 (前端會加上 %) ***
            // 確保回傳數字，方便前端計算
            forecast.rain = parseInt(value.parameterName); 
            break;
          case "MinT":
            // *** 關鍵修改：只回傳數值 (前端會加上 °) ***
            forecast.minTemp = parseInt(value.parameterName);
            break;
          case "MaxT":
            // *** 關鍵修改：只回傳數值 (前端會加上 °) ***
            forecast.maxTemp = parseInt(value.parameterName);
            break;
          case "CI":
            forecast.comfort = value.parameterName;
            break;
          case "WS":
            forecast.windSpeed = value.parameterName;
            break;
        }
      });

      weatherData.forecasts.push(forecast);
    }

    res.json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    console.error(`取得 ${locationName} 天氣資料失敗:`, error.message);

    if (error.response) {
      // CWA API 回應錯誤
      return res.status(error.response.status).json({
        error: "CWA API 錯誤",
        message: error.response.data.message || "無法取得天氣資料",
        details: error.response.data,
      });
    }

    // 其他錯誤
    res.status(500).json({
      error: "伺服器錯誤",
      message: "無法取得天氣資料，請稍後再試",
    });
  }
};

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "歡迎使用 森森丸天氣 API",
    endpoints: {
      // 變為動態路徑
      dynamicWeather: "/api/weather/:locationName", 
      health: "/api/health",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// *** 關鍵修改：新的動態路由，讓前端可以指定城市名稱 ***
app.get("/api/weather/:locationName", getWeatherByLocation); 


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "伺服器錯誤",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "找不到此路徑",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 伺服器運行已運作於 http://localhost:${PORT}`);
  console.log(`📍 環境: ${process.env.NODE_ENV || "development"}`);
});