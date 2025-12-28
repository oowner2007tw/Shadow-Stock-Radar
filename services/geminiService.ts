import { GoogleGenAI, SchemaType } from "@google/generative-ai";
import { StockAnalysisResult, ThemeAnalysisResult, HotTopic, RadarMetrics } from "../types";
import { predictWithForest } from "./forestService";

// 1. 初始化 Client
const genAI = new GoogleGenAI(process.env.API_KEY || "");

// 建議使用 Pro 等級模型以處理 800 字以上的深度分析報告
const STOCK_MODEL = "gemini-1.5-pro";

/**
 * 核心權重計算法 (6-Factor Logic)
 */
const calculateWeightedScore = (radar: RadarMetrics): number => {
  return (
    (radar.topic.score * 0.25) +
    (radar.chips.score * 0.15) +
    (radar.vix.score * 0.25) +
    (radar.margin.score * 0.15) +
    (radar.technical.score * 0.10) +
    (radar.macro.score * 0.10)
  );
};

/**
 * 【個股深度分析】產出 800 字機構報告與評分
 */
export const analyzeStockWithGemini = async (stockCode: string): Promise<StockAnalysisResult> => {
  const model = genAI.getGenerativeModel({ 
    model: STOCK_MODEL,
    tools: [{ googleSearch: {} }] as any 
  });

  const prompt = `
    你是一位華爾街頂尖量化策略分析師 (Senior Quant Strategist)，擅長分析台股與全球半導體供應鏈。
    標的：台灣股票代號 ${stockCode}。

    任務：執行 10 日股價預測特徵工程與深度報告撰寫。
    
    【Step 1: 數據搜集】利用 Google Search 搜尋：VIX 指標、台股乖離率、${stockCode} 最新股價、歷史走勢、法人籌碼與融資狀況。
    【Step 2: 6大因子量化評分】(0-100)。
    【Step 3: 決策分類】>= 65 (Bullish), < 45 (Bearish)。
    【Step 4: 機構級分析報告】撰寫至少 800 字繁體中文報告。結構包含：Executive Summary、Factor Deep Dive (因子深度解構)、Technical & Sentiment (技術與心理面)、Actionable Strategy (策略建議與黑天鵝風險)。

    請嚴格依照回傳 JSON 格式。
  `;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          symbol: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          price: { type: SchemaType.NUMBER },
          historicalPrices: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } },
          radarData: {
            type: SchemaType.OBJECT,
            properties: {
              topic: { type: SchemaType.OBJECT, properties: { score: { type: SchemaType.NUMBER }, metricValue: { type: SchemaType.STRING }, reason: { type: SchemaType.STRING } } },
              chips: { type: SchemaType.OBJECT, properties: { score: { type: SchemaType.NUMBER }, metricValue: { type: SchemaType.STRING }, reason: { type: SchemaType.STRING } } },
              vix: { type: SchemaType.OBJECT, properties: { score: { type: SchemaType.NUMBER }, metricValue: { type: SchemaType.STRING }, reason: { type: SchemaType.STRING } } },
              technical: { type: SchemaType.OBJECT, properties: { score: { type: SchemaType.NUMBER }, metricValue: { type: SchemaType.STRING }, reason: { type: SchemaType.STRING } } },
              macro: { type: SchemaType.OBJECT, properties: { score: { type: SchemaType.NUMBER }, metricValue: { type: SchemaType.STRING }, reason: { type: SchemaType.STRING } } },
              margin: { type: SchemaType.OBJECT, properties: { score: { type: SchemaType.NUMBER }, metricValue: { type: SchemaType.STRING }, reason: { type: SchemaType.STRING } } },
            },
            required: ["topic", "chips", "vix", "technical", "macro", "margin"]
          },
          stageAPrediction: { type: SchemaType.STRING },
          stageBWinRate: { type: SchemaType.NUMBER },
          analysisReport: { type: SchemaType.STRING },
        },
        required: ["symbol", "name", "price", "radarData", "stageAPrediction", "analysisReport"]
      }
    }
  });

  const data = JSON.parse(result.response.text());

  // 預測邏輯處理
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
 * 【市場趨勢偵測】搜尋具備向上動能的新興題材
 */
export const detectMarketTrends = async (startDate: string, endDate: string): Promise<HotTopic[]> => {
  const model = genAI.getGenerativeModel({ model: STOCK_MODEL, tools: [{ googleSearch: {} }] as any });

  const prompt = `搜尋 ${startDate} 至 ${endDate} 期間，台股具備「正向動能斜率」的投資題材。排除老舊訊息，鎖定新技術或報價上漲題材。`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            heatScore: { type: SchemaType.NUMBER },
            reason: { type: SchemaType.STRING }
          },
          required: ["name", "heatScore", "reason"]
        }
      }
    }
  });

  return JSON.parse(result.response.text());
};

/**
 * 【題材影子股掃描】深度拆解供應鏈名單
 */
export const analyzeThemeWithGemini = async (topic: string, startDate: string, endDate: string): Promise<ThemeAnalysisResult> => {
  const model = genAI.getGenerativeModel({ model: STOCK_MODEL, tools: [{ googleSearch: {} }] as any });

  const prompt = `
    深度拆解台股題材： "${topic}"。
    請挖掘 TIER 1指標、TIER 2供應鏈與 TIER 3影子股。
    重點：包含剛切入、低位階或具備子公司連動關係的影子標的。
  `;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          temperature: { type: SchemaType.NUMBER },
          noiseLevel: { type: SchemaType.STRING },
          supplyChain: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                category: { type: SchemaType.STRING },
                companies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                description: { type: SchemaType.STRING }
              }
            }
          },
          leadingStocks: {
            type: SchemaType.OBJECT,
            properties: {
              tier1: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { symbol: { type: SchemaType.STRING }, name: { type: SchemaType.STRING }, reason: { type: SchemaType.STRING } } } },
              tier2: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { symbol: { type: SchemaType.STRING }, name: { type: SchemaType.STRING }, reason: { type: SchemaType.STRING } } } },
              tier3: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { symbol: { type: SchemaType.STRING }, name: { type: SchemaType.STRING }, reason: { type: SchemaType.STRING } } } }
            }
          }
        },
        required: ["topic", "temperature", "leadingStocks"]
      }
    }
  });

  return JSON.parse(result.response.text());
};
