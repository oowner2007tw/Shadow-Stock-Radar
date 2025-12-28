import { GoogleGenAI, Type } from "@google/genai";
import { StockAnalysisResult, RadarMetrics } from "../types";
import { predictWithForest } from "./forestService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
const STOCK_MODEL = "gemini-1.5-flash"; // 或 gemini-3-flash-preview

/**
 * 權重計算邏輯：
 * 1. Topic (題材): 25% | 2. VIX (逆勢): 25%
 * 3. Chips (法人): 15% | 4. Margin (大盤融資): 15%
 * 5. Technical (技術): 10% | 6. Macro (位階): 10%
 */
const calculateWeightedScore = (radar: RadarMetrics): number => {
  return (
    (radar.topic.score * 0.25) +
    (radar.vix.score * 0.25) +
    (radar.chips.score * 0.15) +
    (radar.margin.score * 0.15) +
    (radar.technical.score * 0.10) +
    (radar.macro.score * 0.10)
  );
};

export const analyzeStockWithGemini = async (stockCode: string): Promise<StockAnalysisResult> => {
  const prompt = `
    你是一位量化分析師，請執行【10日股價預測模型】的特徵工程。
    標的：台灣股票代號 ${stockCode}。

    【Step 1: 數據搜集】
    請使用 Google Search 搜尋：
    1. VIX (S&P 500 VIX) 指數。
    2. 加權指數季線乖離率 (Macro Level)。
    3. 搜尋「台股大盤融資餘額」：確認目前整體市場散戶籌碼是否過熱或已洗盤。
    4. ${stockCode} 的外資/投信近 5 日買賣超與本益比。
    5. ${stockCode} 最新股價與過去 15 日歷史價格。

    【Step 2: 量化評分 (0-100)】
    1. vix (25%): VIX > 21 給高分 (80-100)；VIX < 16 給低分 (0-40)。
    2. margin (15%): 【定義：大盤融資餘額】。
       - 大盤高檔且大盤融資持續增加 -> 給低分 (籌碼混亂)。
       - 大盤大跌後大盤融資大幅減肥 -> 給高分 (洗盤完成，有利反彈)。
    3. topic (25%): 該標的題材續航力。
    4. chips (15%): 個股法人連動度。
    5. technical (10%): RSI, MACD, MA斜率。
    6. macro (10%): 個股/大盤位階，高位階低分，低位階高分。

    【Step 3: 10日操作策略】
    - 總分 >= 65：偏多。
    - 總分 < 45：避險。
    
    回傳格式：JSON。描述需包含對「大盤融資水位」的具體解讀。
  `;

  const response = await ai.models.generateContent({
    model: STOCK_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { 
      tools: [{ googleSearch: {} }], 
      responseMimeType: "application/json" 
    }
  });

  const data = JSON.parse(response.response.text());
  const weightedScore = calculateWeightedScore(data.radarData);
  
  // 執行 10 日隨機森林回歸
  const predictedPrices = predictWithForest(data.historicalPrices || [], weightedScore, 10);

  return {
    ...data,
    price: data.price,
    weightedScore,
    gbmSimulation: predictedPrices.map((p, i) => ({ date: `Day ${i+1}`, price: p }))
  };
};
