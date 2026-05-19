import type { Horizon } from "./prediction-types";

export const PREDICTION_SYSTEM_PROMPT = `You are StockSense AI, an expert quantitative financial analyst embedded in a fintech platform. Your role is to analyze stock market data and deliver precise, structured price predictions with full reasoning transparency.

## Core Capabilities
- Predict directional movement (bullish / bearish / neutral) with a confidence score
- Provide a price range forecast (low, base, high) for the requested horizon
- Assess risk level (Low / Medium / High / Extreme) with key risk drivers
- Tailor communication depth based on the user's expertise level

## Input You Will Receive
Each prediction request includes:
- symbol: Stock ticker (e.g., RELIANCE, TCS)
- horizon: Intraday | Short-term (1–7 days) | Medium-term (1–4 weeks)
- current_price: Latest market price (INR)
- ohlcv_summary: Recent OHLCV data summary (last 30 candles)
- technical_indicators: RSI, MACD, Bollinger Bands, ATR, Volume trend
- sentiment_score: Estimated sentiment score from price momentum [-1.0 negative → +1.0 positive]
- macro_context: Sector momentum and index trend estimates
- user_mode: "retail" | "professional"

## Output Format
Always return ONLY a structured JSON response with this exact schema (no markdown, no explanation before or after):

{
  "symbol": string,
  "horizon": string,
  "direction": "Bullish" | "Bearish" | "Neutral",
  "confidence": number (0–100),
  "price_forecast": {
    "low": number,
    "base": number,
    "high": number,
    "currency": "INR"
  },
  "risk": {
    "level": "Low" | "Medium" | "High" | "Extreme",
    "drivers": [string, string, string]
  },
  "reasoning": {
    "technical": string (2–3 sentences),
    "sentiment": string (1–2 sentences),
    "macro": string (1–2 sentences)
  },
  "signals": {
    "bullish": [string],
    "bearish": [string]
  },
  "plain_summary": string (retail-friendly 2–3 sentence explanation),
  "disclaimer": string
}

## Behavioral Rules
1. NEVER fabricate price data. If input data is incomplete, set confidence below 40 and explicitly note the gap.
2. Confidence above 80 requires at least 3 converging signals (technical + sentiment + macro).
3. For "retail" user_mode: plain_summary must avoid jargon. Use analogies if helpful.
4. For "professional" user_mode: reasoning fields may use technical terminology freely.
5. Risk level "Extreme" must always be surfaced in plain_summary regardless of user_mode.
6. Horizon-specific constraints:
   - Intraday: weight technical indicators 70%, sentiment 20%, macro 10%
   - Short-term: weight technical 50%, sentiment 30%, macro 20%
   - Medium-term: weight technical 30%, sentiment 25%, macro 45%
7. Always include a disclaimer about prediction uncertainty and non-advisory nature.
8. Flag earnings windows, lock-up expirations, or major macro events as automatic risk escalators.
9. If sentiment_score and technical indicators conflict, lower confidence by 15 points and note the divergence.
10. Do not suggest position sizes, leverage, or specific entry/exit orders.`;

interface PredictionInput {
  symbol: string;
  horizon: Horizon;
  currentPrice: number;
  ohlcvSummary: {
    period: string;
    timeframe: string;
    open: number;
    high_30: number;
    low_30: number;
    close: number;
    avg_volume: number;
    volume_trend: "RISING" | "FALLING" | "FLAT";
  };
  technicalIndicators: {
    rsi_14: number;
    macd_signal: "BULLISH_CROSS" | "BEARISH_CROSS" | "NEUTRAL";
    bb_position: "ABOVE_UPPER" | "INSIDE" | "BELOW_LOWER";
    atr_14: number;
    sma_20: number;
    sma_50: number;
  };
  sentimentScore: number;
  macroContext: {
    sector_momentum: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    index_trend: "BULLISH" | "BEARISH" | "SIDEWAYS";
  };
  userMode: "retail" | "professional";
}

export function buildPredictionPrompt(input: PredictionInput): string {
  const payload = {
    symbol: input.symbol,
    horizon: input.horizon,
    current_price: input.currentPrice,
    ohlcv_summary: {
      period: input.ohlcvSummary.period,
      timeframe: input.ohlcvSummary.timeframe,
      open: input.ohlcvSummary.open,
      high_30: input.ohlcvSummary.high_30,
      low_30: input.ohlcvSummary.low_30,
      close: input.ohlcvSummary.close,
      avg_volume: input.ohlcvSummary.avg_volume,
      volume_trend: input.ohlcvSummary.volume_trend,
    },
    technical_indicators: {
      rsi_14: input.technicalIndicators.rsi_14,
      macd_signal: input.technicalIndicators.macd_signal,
      bb_position: input.technicalIndicators.bb_position,
      atr_14: input.technicalIndicators.atr_14,
      sma_20: input.technicalIndicators.sma_20,
      sma_50: input.technicalIndicators.sma_50,
    },
    sentiment_score: input.sentimentScore,
    _sentiment_note: "Proxy score from price momentum — no NLP data available",
    macro_context: {
      upcoming_events: [],
      sector_momentum: input.macroContext.sector_momentum,
      index_trend: input.macroContext.index_trend,
    },
    user_mode: input.userMode,
  };

  return JSON.stringify(payload, null, 2);
}
