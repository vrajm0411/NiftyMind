import { UpstoxClient } from "@/lib/upstox/client";
import { resolveInstrumentKey } from "@/lib/upstox/instruments";
import { resolveSymbolToKey } from "@/lib/upstox/instrument-master";
import { getFullQuote, getHistoricalOHLC } from "@/lib/upstox/market-data";
import { computeRSI, computeSMA, computeMACD, computeBollingerBands, computeATR, determineTrend } from "./technical";
import { PREDICTION_SYSTEM_PROMPT, buildPredictionPrompt } from "./prediction-prompts";
import { streamAnalysis } from "./streaming";
import type { PredictionChunk, Horizon } from "./prediction-types";

export async function* runPrediction(
  symbol: string,
  token: string,
  horizon: Horizon,
  userMode: "retail" | "professional" = "retail"
): AsyncGenerator<PredictionChunk> {
  const client = new UpstoxClient(token);

  // Resolve instrument key (same stale-key fallback as analyzer.ts)
  let instrumentKey = resolveInstrumentKey(symbol);
  if (!instrumentKey) {
    yield { section: "status", content: "Resolving instrument..." };
    instrumentKey = await resolveSymbolToKey(symbol);
  }

  if (!instrumentKey) {
    yield {
      section: "error",
      content: `Could not find instrument key for "${symbol}". Please check the symbol name.`,
    };
    return;
  }

  // Fetch quote + historical candles
  yield { section: "status", content: "Fetching market data..." };

  const interval = horizon === "Intraday" ? "30minute" as const : "day" as const;
  const days = horizon === "Intraday" ? 5 : horizon === "Short-term (1–7 days)" ? 60 : 120;

  let [quoteResult, historyResult] = await Promise.allSettled([
    getFullQuote(client, instrumentKey),
    getHistoricalOHLC(client, instrumentKey, interval, days),
  ]);

  // Stale key fallback
  const quoteVal = quoteResult.status === "fulfilled" ? quoteResult.value : null;
  const quoteIsEmpty = quoteVal && Object.keys(quoteVal?.data || {}).length === 0;
  if (quoteIsEmpty) {
    const dynamicKey = await resolveSymbolToKey(symbol);
    if (dynamicKey && dynamicKey !== instrumentKey) {
      instrumentKey = dynamicKey;
      [quoteResult, historyResult] = await Promise.allSettled([
        getFullQuote(client, instrumentKey),
        getHistoricalOHLC(client, instrumentKey, interval, days),
      ]);
    }
  }

  const quoteData = quoteResult.status === "fulfilled" ? quoteResult.value : null;
  const candles = historyResult.status === "fulfilled" ? historyResult.value : [];

  // If intraday candles are empty, fall back to daily candles
  let finalCandles = candles;
  if (horizon === "Intraday" && (!candles || candles.length < 10)) {
    yield { section: "status", content: "Intraday data unavailable, using daily candles..." };
    try {
      finalCandles = await getHistoricalOHLC(client, instrumentKey, "day", 60);
    } catch {
      finalCandles = candles;
    }
  }

  if (!finalCandles || finalCandles.length < 5) {
    yield {
      section: "error",
      content: "Insufficient historical data for prediction. Try a different stock or timeframe.",
    };
    return;
  }

  // Extract current price from quote
  const quoteObj = quoteData?.data;
  const firstKey = quoteObj ? Object.keys(quoteObj)[0] : null;
  const quoteInfo = firstKey ? quoteObj[firstKey] : null;
  const currentPrice = quoteInfo?.last_price || finalCandles[finalCandles.length - 1].close;

  // Compute all technical indicators
  yield { section: "status", content: "Computing technical indicators..." };

  const closePrices = finalCandles.map((c: any) => c.close);
  const rsi = computeRSI(closePrices);
  const macd = computeMACD(closePrices);
  const bb = computeBollingerBands(closePrices);
  const atr = computeATR(finalCandles);
  const sma20arr = computeSMA(closePrices, 20);
  const sma50arr = computeSMA(closePrices, Math.min(50, closePrices.length));
  const sma20 = sma20arr[sma20arr.length - 1] || currentPrice;
  const sma50 = sma50arr[sma50arr.length - 1] || currentPrice;

  // OHLCV summary (last 30 candles or all available)
  const recentCandles = finalCandles.slice(-30);
  const opens = recentCandles.map((c: any) => c.open);
  const highs = recentCandles.map((c: any) => c.high);
  const lows = recentCandles.map((c: any) => c.low);
  const volumes = recentCandles.map((c: any) => c.volume);
  const avgVolume = Math.round(volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length);

  // Volume trend: compare recent 5-candle avg vs overall avg
  const recentVol = volumes.slice(-5).reduce((a: number, b: number) => a + b, 0) / 5;
  const volumeTrend: "RISING" | "FALLING" | "FLAT" =
    recentVol > avgVolume * 1.1 ? "RISING" : recentVol < avgVolume * 0.9 ? "FALLING" : "FLAT";

  // Sentiment proxy: price momentum + volume direction + RSI
  const sentimentScore = computeSentimentProxy(closePrices, volumes, rsi);

  // Macro context proxy: trend-based sector momentum + index trend
  const trend = determineTrend(closePrices);
  const sectorMomentum: "POSITIVE" | "NEGATIVE" | "NEUTRAL" =
    trend === "bullish" ? "POSITIVE" : trend === "bearish" ? "NEGATIVE" : "NEUTRAL";
  const indexTrend: "BULLISH" | "BEARISH" | "SIDEWAYS" =
    trend === "bullish" ? "BULLISH" : trend === "bearish" ? "BEARISH" : "SIDEWAYS";

  // Build prompt
  yield { section: "status", content: "Generating prediction..." };

  const userPrompt = buildPredictionPrompt({
    symbol,
    horizon,
    currentPrice,
    ohlcvSummary: {
      period: `${recentCandles.length} candles`,
      timeframe: horizon === "Intraday" ? "30min" : "daily",
      open: opens[0],
      high_30: Math.max(...highs),
      low_30: Math.min(...lows),
      close: closePrices[closePrices.length - 1],
      avg_volume: avgVolume,
      volume_trend: volumeTrend,
    },
    technicalIndicators: {
      rsi_14: Math.round(rsi * 100) / 100,
      macd_signal: macd.signal,
      bb_position: bb.position,
      atr_14: Math.round(atr * 100) / 100,
      sma_20: Math.round(sma20 * 100) / 100,
      sma_50: Math.round(sma50 * 100) / 100,
    },
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    macroContext: {
      sector_momentum: sectorMomentum,
      index_trend: indexTrend,
    },
    userMode,
  });

  // Stream AI response
  for await (const text of streamAnalysis(PREDICTION_SYSTEM_PROMPT, userPrompt)) {
    yield { section: "prediction", content: text };
  }

  yield { section: "complete", content: "Prediction complete" };
}

/**
 * Compute a proxy sentiment score from price data.
 * Uses: price momentum (50%), volume direction (30%), RSI relative to 50 (20%).
 * Returns a value from -1.0 to +1.0.
 */
function computeSentimentProxy(
  closePrices: number[],
  volumes: number[],
  rsi: number
): number {
  // Price momentum: 5-day return, scale ±3% to ±0.5
  const len = closePrices.length;
  const lookback = Math.min(5, len - 1);
  const priceReturn = (closePrices[len - 1] - closePrices[len - 1 - lookback]) / closePrices[len - 1 - lookback];
  const priceMomentum = Math.max(-0.5, Math.min(0.5, (priceReturn / 0.03) * 0.5));

  // Volume direction: up-day volume vs down-day volume
  let upVol = 0;
  let downVol = 0;
  const recentN = Math.min(10, len - 1);
  for (let i = len - recentN; i < len; i++) {
    if (closePrices[i] > closePrices[i - 1]) {
      upVol += volumes[i] || 0;
    } else {
      downVol += volumes[i] || 0;
    }
  }
  const totalVol = upVol + downVol;
  const volScore = totalVol > 0 ? ((upVol - downVol) / totalVol) * 0.3 : 0;

  // RSI relative to 50: scale to ±0.2
  const rsiScore = ((rsi - 50) / 50) * 0.2;

  return Math.max(-1, Math.min(1, priceMomentum + volScore + rsiScore));
}
