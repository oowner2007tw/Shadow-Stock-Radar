import { GoogleGenAI, Type } from "@google/genai";
import { StockAnalysisResult, ThemeAnalysisResult, HotTopic, RadarMetrics } from "../types";
import { predictWithForest } from "./forestService";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const STOCK_MODEL = "gemini-3-flash-preview"; 

/**
 * Helper to calculate the total weighted score based on the 6-Factor Logic.
 * 
 * Updated Weights:
 * 1. Topic (題材熱度): 25%
 * 2. Chips (籌碼面): 15%
 * 3. VIX (S&P 500 VIX): 25%
 * 4. Margin (加權融資餘額): 15%
 * 5. Technical (技術面): 10%
 * 6. Macro (大盤位階): 10%
 * Total: 100%
 */
const calculateWeightedScore = (radar: RadarMetrics): number => {
  return (
    (radar.topic.score * 0.25) +    // Topic (25%)
    (radar.chips.score * 0.15) +    // Chips (15%)
    (radar.vix.score * 0.25) +      // VIX (25%)
    (radar.margin.score * 0.15) +   // Margin (15%)
    (radar.technical.score * 0.10) + // Technical (10%)
    (radar.macro.score * 0.10)      // Macro (10%)
  );
};

export const analyzeStockWithGemini = async (stockCode: string): Promise<StockAnalysisResult> => {
  const prompt = `
    你是一位華爾街等級的量化分析師 (Quant)，請執行【10日股價預測模型 (10-Day Prediction Model)】的特徵工程與評分。
    標的：台灣股票代號 ${stockCode}。

    系統將根據你的評分執行 Random Forest 回歸預測。
    
    【Step 1: 6大關鍵特徵數據搜集 (Data Gathering)】
    請使用 Google Search 搜尋以下即時數據：
    1. **VIX (S&P 500 VIX)**: 恐慌指數 (CBOE)。
    2. **Macro_Level**: 搜尋 "台股加權指數 季線 乖離率" 或 "TWSE 60MA Bias"。
    3. **Topic_Score**: 該公司所屬產業 (如 CoWoS, Server) 的近期新聞熱度與社群情緒。
    4. **Chip_Flow**: 外資與投信近 5 日買賣超與本益比估值。
    5. **Margin_Impact**: 融資餘額變化率 vs 股價漲跌背離。
    6. **Technical**: RSI, MACD, 均線排列狀態。
    7. **Price**: **務必搜尋 "TPE:${stockCode} price" 取得最新股價與過去 10 日歷史股價**。

    【Step 2: 量化評分邏輯 (Scoring Logic - 0 to 100)】
    請嚴格依照以下權重與邏輯評分，並填入對應的 Radar 欄位：

    1. **VIX (25%權重) -> 填入 'vix'**:
       - **重要性提升**：作為主要的逆勢指標。
       - 若 VIX > 21 (恐慌)：評分 = 80 + (VIX - 21)*2 (上限100)。(恐慌買進訊號)
       - 若 VIX < 16 (貪婪)：評分 = 40 - (16 - VIX)*3 (下限0)。(貪婪賣出預警)
       - 中間值給予 50 分。

    2. **Topic Score (25%權重) -> 填入 'topic'**:
       - 產業動能 + 新聞熱度。
       - 題材正熱 (如 AI/BBU) 且動能強勁 -> >85分。
       - 無題材/冷門 -> <40分。

    3. **Chip Flow (15%權重) -> 填入 'chips'**:
       - 法人買賣超 + 估值。
       - 法人連買且PE合理 -> >80分。
       - 法人賣超或PE過高 -> <40分。

    4. **Margin Impact (15%權重) -> 填入 'margin'**:
       - **重要性提升**：觀察散戶動向。
       - 融資大增 (散戶進場/籌碼亂) -> 給予 **低分**。
       - 融資減少 (散戶退場/籌碼穩) -> 給予 **高分**。

    5. **Technical (10%權重) -> 填入 'technical'**:
       - 多頭排列/均線向上/RSI強勢 -> >75分。
       - 跌破均線/技術轉弱 -> <40分。

    6. **Macro Level (10%權重) -> 填入 'macro'**:
       - 股價/大盤乖離率過大 (High Bias) -> 給予 **低分**。
       - 股價回測季線/負乖離 -> 給予 **高分**。

    【Step 3: 決策閾值 (Decision Threshold)】
    - 若加權總分 >= 65：定義為「偏多/買進 (Bullish)」。
    - 若加權總分 < 45：定義為「減碼/避險 (Bearish)」。
    - 45-65 之間：定義為「中性/盤整 (Neutral)」。

    【Step 4: 生成深度分析報告 (Deep Analysis Report)】
    請撰寫一份 **"專業法人級投資研究報告 (Institutional Research Report)"**，字數約 800~1200 字，結構需嚴謹且深入。
    報告必須使用 Markdown 格式，並包含以下章節：

    ### 1. 核心投資觀點 (Executive Summary)
    - 結合 Random Forest 預測結果 (Bullish/Bearish) 與雷達總分進行定調。
    - 一句話定義目前該股的位階 (例如：底部起漲、高檔鈍化、反彈逃命、籌碼換手)。

    ### 2. 關鍵因子深度剖析 (Deep Dive)
    - **VIX 逆勢解讀**: 結合目前的 VIX 指數，解釋為何現在是貪婪或恐慌的時刻？這對該股有何影響？
    - **題材與產業動能**: 分析該公司題材 (Topic) 的"真實性"與"延續力"。是短期炒作還是長線趨勢？
    - **籌碼與融資博弈**: 解析外資/投信的操作心態，以及融資餘額(散戶)是否成為阻力？

    ### 3. 技術面與價位規劃 (Technical Analysis)
    - **型態判讀**: 目前是 W底、M頭、還是箱型整理？
    - **關鍵價位**: 明確給出預估的**支撐位 (Support)** 與 **壓力位 (Resistance)** 價格。

    ### 4. 10日操作策略建議 (Action Plan)
    - **進場策略**: 積極型與保守型投資人的進場點位建議。
    - **風控機制**: 設定明確的停損點 (Stop Loss) 與 獲利滿足點 (Take Profit)。
    - **黑天鵝提示**: 需留意的潛在風險 (如匯率、財報、地緣政治)。

    **要求：語氣專業、犀利、數據導向。拒絕空泛的廢話，請直接引用 Step 2 的評分數據與 Step 1 的搜尋結果作為佐證。**

    回傳 JSON 格式。
  `;

  const response = await ai.models.generateContent({
    model: STOCK_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          symbol: { type: Type.STRING },
          name: { type: Type.STRING },
          price: { type: Type.NUMBER },
          historicalPrices: { 
            type: Type.ARRAY, 
            items: { type: Type.NUMBER },
            description: "Array of closing prices for the last 10-15 trading days."
          },
          change: { type: Type.NUMBER },
          changePercent: { type: Type.NUMBER },
          radarData: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, metricValue: { type: Type.STRING }, reason: { type: Type.STRING }, isRealData: { type: Type.BOOLEAN } } },
              chips: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, metricValue: { type: Type.STRING }, reason: { type: Type.STRING }, isRealData: { type: Type.BOOLEAN } } },
              vix: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, metricValue: { type: Type.STRING }, reason: { type: Type.STRING }, isRealData: { type: Type.BOOLEAN } } },
              technical: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, metricValue: { type: Type.STRING }, reason: { type: Type.STRING }, isRealData: { type: Type.BOOLEAN } } },
              macro: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, metricValue: { type: Type.STRING }, reason: { type: Type.STRING }, isRealData: { type: Type.BOOLEAN } } },
              margin: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, metricValue: { type: Type.STRING }, reason: { type: Type.STRING }, isRealData: { type: Type.BOOLEAN } } },
            },
            required: ["topic", "chips", "vix", "technical", "macro", "margin"]
          },
          stageAPrediction: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
          stageBWinRate: { type: Type.NUMBER },
          analysisReport: { type: Type.STRING },
        },
        required: ["symbol", "name", "price", "radarData", "stageAPrediction", "stageBWinRate", "analysisReport"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  const data = JSON.parse(text);

  // Fallback for history
  let cleanHistory: number[] = [];
  if (data.historicalPrices && Array.isArray(data.historicalPrices) && data.historicalPrices.length > 0) {
    cleanHistory = data.historicalPrices;
  } else {
    const basePrice = data.price || 100;
    for (let i = 14; i >= 0; i--) {
        cleanHistory.push(basePrice * (1 - (Math.random() * 0.04 - 0.02)));
    }
  }

  // 1. Calculate Score using the new 8-Factor Weights
  const weightedScore = calculateWeightedScore(data.radarData);
  
  // 2. Predict Future (10 Days)
  const predictedPrices = predictWithForest(cleanHistory, weightedScore, 10);

  // 3. Format
  const formattedSimulation = [];
  let dateCursor = new Date();
  for (const price of predictedPrices) {
    do {
        dateCursor.setDate(dateCursor.getDate() + 1);
    } while (dateCursor.getDay() === 0 || dateCursor.getDay() === 6);
    
    formattedSimulation.push({
      date: `${dateCursor.getMonth() + 1}/${dateCursor.getDate()}`,
      price: price
    });
  }

  return {
    ...data,
    gbmSimulation: formattedSimulation 
  };
};

export const detectMarketTrends = async (startDate: string, endDate: string): Promise<HotTopic[]> => {
  const prompt = `
    請搜尋台灣股市在以下日期範圍內的潛力投資題材：
    開始日期：${startDate}
    結束日期：${endDate}

    任務：
    請找出 4-6 個處於 **「上升軌道 (Upward Trajectory)」** 或 **「剛開始發酵 (Emerging)」** 的投資題材。

    **關鍵演算法策略：趨勢動能偵測 (Momentum & Trend Detection)**
    1. **區分「熱度」與「動能」**：
       - **不要**只列出新聞總量最大的題材（若僅是老生常談的舊題材，動能分數應給予普通）。
       - **請尋找**新聞數量、社群討論度呈現 **「斜率向上 (Positive Slope)」** 的題材。
       - 重點偵測：從冷門變熱門的轉折點 (Inflection Point)。
    
    2. **篩選條件**：
       - 近期每日新聞量顯著大於區間平均。
       - 涉及「新技術發表」、「供應鏈缺貨傳聞」、「報價上漲」等觸發詞。
    
    範例邏輯：
    - 若 "CoWoS" 每日新聞量持平，即使總量大，動能熱度分數給予 70-80 分。
    - 若 "CPO (矽光子)" 或 "BBU" 新聞量這兩天突然暴增，請給予高分 (90-100 分) 並標註為新興趨勢。

    請給予每個題材一個「動能熱度分數 (Heat Score)」(0-100)。
    簡短說明該題材的「發酵趨勢」(為什麼現在變多？)。

    回傳嚴格的 JSON 格式 List。
  `;

  const response = await ai.models.generateContent({
    model: STOCK_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "題材名稱 (e.g., CoWoS)" },
            heatScore: { type: Type.NUMBER, description: "動能熱度 (0-100)" },
            reason: { type: Type.STRING, description: "趨勢發酵理由 (強調新聞量變化)" }
          },
          required: ["name", "heatScore", "reason"]
        }
      }
    }
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text) as HotTopic[];
};

export const analyzeThemeWithGemini = async (topic: string, startDate: string, endDate: string): Promise<ThemeAnalysisResult> => {
  const prompt = `
    請分析台股市場中的熱門投資題材："${topic}"。
    時間範圍：【${startDate} 至 ${endDate}】。
    
    任務：拆解該題材的供應鏈，並將相關個股嚴格分類為 TIER 1, 2, 3。

    **重要策略：廣泛納入影子股 (Aggressive Inclusion)**
    - 我們需要盡可能完整的名單。
    - **TIER 2 & TIER 3 必須擴大搜尋**：只要該公司有切入此題材供應鏈、有送樣認證、或者母公司/子公司相關，即便佔比不高，也請納入。
    - 目標：挖掘出市場尚未完全發掘的潛力影子股。

    分類標準：
    - **TIER 1 (核心龍頭)**：最純正指標股 (Leaders)。
    - **TIER 2 (實質受惠)**：關鍵零組件、設備、檢測、封測廠 (Supply Chain)。
    - **TIER 3 (潛力/沾光)**：剛切入供應鏈、題材概念股、集團連動股 (Speculative)。

    請為每一檔列出的股票提供簡短精闢的「投資理由」。

    同時，請維持基本的供應鏈結構 (上中下游) 用於視覺化。
    判斷市場 "即時動能熱度" (0-100) 與 "噪音等級"。熱度請考量近期新聞量的增減趨勢。

    回傳格式必須是嚴格的 JSON 格式。
  `;

  const response = await ai.models.generateContent({
    model: STOCK_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          dateRange: { type: Type.STRING },
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
            },
            required: ["tier1", "tier2", "tier3"]
          }
        },
        required: ["topic", "temperature", "leadingStocks"]
      }
    }
  });

   const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  return JSON.parse(text) as ThemeAnalysisResult;
};