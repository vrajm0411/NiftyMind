export interface AnalysisResult {
  summary: string;
  healthScore: number;
  recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  confidence: number;
  priceTarget: {
    bull: number;
    base: number;
    bear: number;
    current: number;
    timeframe: string;
  };
  fundamental: {
    score: number;
    revenue: { trend: string; cagr: number };
    profitability: { margins: string; roe: number };
    debt: { level: string; ratio: number };
    valuation: { peRatio: number; fair: string };
  };
  technical: {
    score: number;
    trend: string;
    rsi: number;
    macd: string;
    support: number;
    resistance: number;
    signals: string[];
  };
  risk: {
    score: number;
    level: string;
    beta: number;
    drawdown: number;
    factors: string[];
  };
  crisisResilience: {
    score: number;
    covid2020: { drawdown: number; recovery: string };
    inflation2022: { impact: string };
    geopolitical: { sensitivity: string };
  };
  strengths: string[];
  weaknesses: string[];
  outlook: string;
  narrative: string;
}

export interface PriceContext {
  symbol: string;
  instrumentKey: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  volume: number;
  averageVolume: number;
}

export interface CrisisEvent {
  name: string;
  period: string;
  niftyDrawdown: number;
  description: string;
}

export interface AnalysisChunk {
  section: "status" | "analysis" | "complete" | "error";
  content: string;
}
