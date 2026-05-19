export interface PredictionResult {
  symbol: string;
  horizon: string;
  direction: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  price_forecast: {
    low: number;
    base: number;
    high: number;
    currency: "INR" | "USD";
  };
  risk: {
    level: "Low" | "Medium" | "High" | "Extreme";
    drivers: string[];
  };
  reasoning: {
    technical: string;
    sentiment: string;
    macro: string;
  };
  signals: {
    bullish: string[];
    bearish: string[];
  };
  plain_summary: string;
  disclaimer: string;
}

export type Horizon = "Intraday" | "Short-term (1–7 days)" | "Medium-term (1–4 weeks)";

export interface PredictionChunk {
  section: "status" | "prediction" | "complete" | "error";
  content: string;
}
