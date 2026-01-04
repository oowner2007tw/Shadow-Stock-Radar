
export interface RadarFacetDetail {
  score: number;
  reason: string;
  metricValue: string; // New: Specific quantified data (e.g., "VIX: 24.5", "連買 3 日")
  isRealData: boolean; // True if fetched/verified, False if estimated
}

export interface RadarMetrics {
  topic: RadarFacetDetail;      // 題材熱度 (20%) + Sentiment (5%)
  chips: RadarFacetDetail;      // 籌碼面 (15%) + Valuation (5%)
  vix: RadarFacetDetail;        // VXTWN Contrarian (20%)
  technical: RadarFacetDetail;  // 技術面 (5%)
  macro: RadarFacetDetail;      // 大盤乖離 (20%)
  margin: RadarFacetDetail;     // 融資餘額 (10%)
}

export interface StockAnalysisResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  radarData: RadarMetrics;
  stageAPrediction: 'Bullish' | 'Bearish' | 'Neutral';
  stageBWinRate: number;
  analysisReport: string; // Re-added: Comprehensive AI report
  gbmSimulation: { date: string; price: number }[]; 
}

export interface TierStock {
  symbol: string;
  name: string;
  reason: string;
}

export interface ThemeTiers {
  tier1: TierStock[]; // TIER 1: 核心龍頭 (Leaders)
  tier2: TierStock[]; // TIER 2: 實質受惠供應鏈 (Supply Chain)
  tier3: TierStock[]; // TIER 3: 題材沾光/補漲 (Speculative)
}

export interface SupplyChainNode {
  category: '上游' | '中游' | '下游';
  companies: string[];
  description: string;
}

export interface ThemeAnalysisResult {
  topic: string;
  dateRange: string; 
  temperature: number; // 0-100 (Overheated)
  noiseLevel: 'High' | 'Medium' | 'Low';
  supplyChain: SupplyChainNode[]; // Kept for graph structure
  leadingStocks: ThemeTiers; // New: Tiered stock list
  // analysis: string; removed generic report
}

export interface HotTopic {
  name: string;
  heatScore: number; // 0-100
  reason: string;
}

// --- NEW: Revenue Arbitrage Types ---

export enum ArbitrageSignal {
  OPPORTUNITY = 'OPPORTUNITY', // 機會 (未反應)
  TRAP = 'TRAP',               // 陷阱 (說謊/不如預期)
  SYNCED = 'SYNCED',           // 同步 (已反應)
  UNKNOWN = 'UNKNOWN'
}

export interface ArbitrageResult {
  usSymbol: string;
  twSymbol: string;
  relationType: 'US_LEADS_TW' | 'TW_LEADS_US' | 'MUTUAL'; // 誰領先誰
  leadTime: string; // e.g., "3 Months"
  
  usSide: {
    status: string; // e.g., "Guidance Strong"
    evidence: string; // e.g., "CEO mentioned crazy demand"
    trend: 'UP' | 'DOWN' | 'FLAT';
  };
  
  twSide: {
    status: string; // e.g., "Revenue Flat"
    evidence: string; // e.g., "Last month -2% MoM"
    trend: 'UP' | 'DOWN' | 'FLAT';
  };

  verdict: {
    signal: ArbitrageSignal;
    score: number; // 0-100 Confidence
    analysis: string; // The "Treasure Map" logic
    strategy: string; // Actionable advice
  };
}

export enum AnalysisTab {
  INDIVIDUAL = 'INDIVIDUAL',
  THEME = 'THEME',
  REVENUE_ARBITRAGE = 'REVENUE_ARBITRAGE', // New Tab
  SYSTEM_INFO = 'SYSTEM_INFO'
}