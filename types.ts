
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

export enum AnalysisTab {
  INDIVIDUAL = 'INDIVIDUAL',
  THEME = 'THEME',
  SYSTEM_INFO = 'SYSTEM_INFO'
}