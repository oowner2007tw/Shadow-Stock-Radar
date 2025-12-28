import { GoogleGenAI, Type } from "@google/genai";
import { StockAnalysisResult, ThemeAnalysisResult, HotTopic, RadarMetrics } from "../types";
import { predictWithForest } from "./forestService";

// 初始化 Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// 使用最新的 Gemini 1.5 Pro 或 Flash 預覽版以支援長文本生成
const STOCK_MODEL = "gemini-1.5-pro"; 

/**
 * 核心權重邏輯 (6-Factor Logic)
 */
const calculateWeightedScore = (radar: RadarMetrics): number => {
  return (
    (radar.topic.score * 0.25) +    // 題材熱度 (25%)
    (radar.chips.score * 0.15) +    // 籌碼面 (15%)
    (radar.vix.score * 0.25) +      // VIX 指標 (25%)
    (radar.margin.score * 0.15) +   // 融資餘額 (15%)
    (radar.technical.score * 0.10) + // 技術面 (10%)
    (radar.macro.score * 0.10)      // 大盤位階 (10%)
  );
};

/**
 * 1. 深度個股分析 (含機構級 800 字報告)
 */
export const analyzeStockWithGemini = async (stockCode: string): Promise<StockAnalysisResult> => {
  const prompt = `
    你是一位華爾街頂尖量化策略分析師 (Senior Quant Strategist)，擅長結合總體經濟、籌碼流向與技術心理分析。
    標的：台灣股票代號 ${stockCode}。

    請執行以下四個步驟，並最終產出一份 **【機構級深度投資分析報告】**。

    【Step 1: 即時數據搜集 (Data Gathering)】
    請利用 Google Search 搜尋：
    1. VIX 指標、台股加權指數與季線乖離率。
    2. ${stockCode} 的最新股價、法人(外資/投信)近5日買賣超動向。
    3. 融資餘額變化與股價之背離狀況。
    4. 該個股所屬產業（如：CPO, CoWoS, BBU, SpaceX 供應鏈）之最新新聞與政策動向。

    【Step 2: 量化評分 (0-100)】
    根據搜尋結果，為 6 大因子評分，並嚴格遵守以下邏輯：
    - VIX: >21 為恐慌(高分買進)；<16 為貪婪(低分預警)。
    - Topic: 題材動能斜率向上、具備「轉折點」特徵則給予高分。
    - Margin: 融資大增(散戶進場)給低分；融資洗盤完畢給高分。

    【Step 3: 決策預測】
    - 加權總分 >= 65: Bullish | < 45: Bearish | 45-65: Neutral。

    【Step 4: 機構級深度分析報告 (Institutional Report)】
    請撰寫一份 **至少 800 字以上** 的繁體中文報告，結構如下：
    1. **Executive Summary (執行摘要)**：指出目前核心多空矛盾與最終投資評等。
    2. **Factor Deep Dive (因子深度解構)**：剖析 VIX 與總經對該股的衝擊路徑；解讀法人與散戶籌碼的對抗狀態。
    3. **Technical & Sentiment (技術與情緒面)**：分析關鍵壓力支撐（如跳空缺口、前高）與市場心理階段。
    4. **Actionable Strategy (操作策略)**：具體的建倉建議、目標價區間、以及 3 個「黑天鵝風險」。

    請務必以 JSON 格式回傳，確保 analysisReport 欄位內容詳實且長度充足。
  `;

  const response = await ai.models.generateContent({
    model: STOCK_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          symbol: { type: Type.STRING },
          name: { type: Type.STRING },
          price: { type: Type.NUMBER },
          historicalPrices: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          radarData: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, metricValue: { type: Type.STRING }, reason: { type: Type.STRING } } },
              chips: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, metricValue: { type: Type.STRING }, reason: { type: Type.STRING } } },
              vix: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, metricValue: { type: Type.STRING }, reason: { type: Type.STRING } } },
              technical: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, metricValue: { type: Type.STRING }, reason: { type: Type.STRING } } },
              macro: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, metricValue: { type: Type.STRING }, reason: { type: Type.STRING } } },
              margin: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, metricValue: { type: Type.STRING }, reason: { type: Type.STRING } } },
            },
            required: ["topic", "chips", "vix", "technical", "macro", "margin"]
          },
          stageAPrediction: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
          stageBWinRate: { type: Type.NUMBER },
          analysisReport: { type: Type.STRING },
        },
        required: ["symbol", "name", "price", "radarData", "stageAPrediction", "analysisReport"]
      }
    },
    tools: [{ googleSearch: {} }]
  });

  const data = JSON.parse(response.response.text());

  // 處理歷史價格回測與 Random Forest 預測邏輯
  let cleanHistory: number[] = data.historicalPrices || [];
  if (cleanHistory.length === 0) {
    const base = data.price || 100;
    cleanHistory = Array.from({ length: 15 }, () => base * (1 + (Math.random() * 0.04 - 0.02)));
  }

  const weightedScore = calculateWeightedScore(data.radarData);
  const predictedPrices = predictWithForest(cleanHistory, weightedScore, 10);

  const formattedSimulation = predictedPrices.map((price, index) => {
    const date = new Date();
    date.setDate(date.getDate() + (index + 1));
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      price: parseFloat(price.toFixed(2))
    };
  });

  return { ...data, gbmSimulation: formattedSimulation };
};

/**
 * 2. 市場趨勢偵測 (Momentum Detection)
 */
export const detectMarketTrends = async (startDate: string, endDate: string): Promise<HotTopic[]> => {
  const prompt = `分析台股在 ${startDate} 至 ${endDate} 間的趨勢動能，找出 4-6 個「斜率向上」的新興題材，而非老舊題材。`;
  
  const response = await ai.models.generateContent({
    model: STOCK_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            heatScore: { type: Type.NUMBER },
            reason: { type: Type.STRING }
          },
          required: ["name", "heatScore", "reason"]
        }
      }
    },
    tools: [{ googleSearch: {} }]
  });

  return JSON.parse(response.response.text());
};

/**
 * 3. 題材拆解與影子股挖掘 (Shadow Stock Radar)
 */
export const analyzeThemeWithGemini = async (topic: string, startDate: string, endDate: string): Promise<ThemeAnalysisResult> => {
  const prompt = `
    針對 "${topic}" 題材進行台股供應鏈深度拆解。
    重點：擴大搜尋「影子股 (Shadow Stocks)」。
    TIER 3 分類必須包含那些「剛切入」、「送樣中」或「母憑子貴」的潛力標的。
  `;

  const response = await ai.models.generateContent({
    model: STOCK_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          temperature: { type: Type.NUMBER },
          noiseLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          supplyChain: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, enum: ["上游", "中游", "下游"] },
                companies: { type: Type.ARRAY, items: { type: Type.STRING } },
                description: { type: Type.STRING }
              }
            }
          },
          leadingStocks: {
            type: Type.OBJECT,
            properties: {
              tier1: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { symbol: { type: Type.STRING }, name: { type: Type.STRING }, reason: { type: Type.STRING } } } },
              tier2: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { symbol: { type: Type.STRING }, name: { type: Type.STRING }, reason: { type: Type.STRING } } } },
              tier3: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { symbol: { type: Type.STRING }, name: { type: Type.STRING }, reason: { type: Type.STRING } } } }
            }
          }
        }
      }
    },
    tools: [{ googleSearch: {} }]
  });

  return JSON.parse(response.response.text());
};
