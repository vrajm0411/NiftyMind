export function computeSMA(prices: number[], period: number): number[] {
  return prices.map((_, i) => {
    if (i < period - 1) return NaN;
    const slice = prices.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

export function computeRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function compute52WeekRange(prices: number[]): {
  high: number;
  low: number;
  position: number;
} {
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const current = prices[prices.length - 1];
  const position = ((current - low) / (high - low)) * 100;
  return { high, low, position };
}

export function determineTrend(
  prices: number[]
): "bullish" | "neutral" | "bearish" {
  if (prices.length < 20) return "neutral";

  const sma20 = computeSMA(prices, 20);
  const sma50 = computeSMA(prices, Math.min(50, prices.length));
  const current = prices[prices.length - 1];
  const sma20Current = sma20[sma20.length - 1];
  const sma50Current = sma50[sma50.length - 1];

  if (isNaN(sma20Current)) return "neutral";

  if (current > sma20Current && (isNaN(sma50Current) || sma20Current > sma50Current)) {
    return "bullish";
  }
  if (current < sma20Current && (isNaN(sma50Current) || sma20Current < sma50Current)) {
    return "bearish";
  }
  return "neutral";
}

export function computeEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function computeMACD(prices: number[]): {
  macdLine: number;
  signalLine: number;
  histogram: number;
  signal: "BULLISH_CROSS" | "BEARISH_CROSS" | "NEUTRAL";
} {
  if (prices.length < 35) {
    return { macdLine: 0, signalLine: 0, histogram: 0, signal: "NEUTRAL" };
  }

  const ema12 = computeEMA(prices, 12);
  const ema26 = computeEMA(prices, 26);

  const macdValues: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    macdValues.push(ema12[i] - ema26[i]);
  }

  const signalValues = computeEMA(macdValues.slice(25), 9);
  const macdLine = macdValues[macdValues.length - 1];
  const signalLine = signalValues[signalValues.length - 1];
  const histogram = macdLine - signalLine;

  const prevMacd = macdValues[macdValues.length - 2];
  const prevSignal = signalValues.length >= 2 ? signalValues[signalValues.length - 2] : signalLine;

  let signal: "BULLISH_CROSS" | "BEARISH_CROSS" | "NEUTRAL" = "NEUTRAL";
  if (prevMacd <= prevSignal && macdLine > signalLine) {
    signal = "BULLISH_CROSS";
  } else if (prevMacd >= prevSignal && macdLine < signalLine) {
    signal = "BEARISH_CROSS";
  }

  return { macdLine, signalLine, histogram, signal };
}

export function computeBollingerBands(prices: number[], period = 20): {
  upper: number;
  middle: number;
  lower: number;
  position: "ABOVE_UPPER" | "INSIDE" | "BELOW_LOWER";
} {
  if (prices.length < period) {
    const last = prices[prices.length - 1] || 0;
    return { upper: last, middle: last, lower: last, position: "INSIDE" };
  }

  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = middle + 2 * stdDev;
  const lower = middle - 2 * stdDev;
  const current = prices[prices.length - 1];

  let position: "ABOVE_UPPER" | "INSIDE" | "BELOW_LOWER" = "INSIDE";
  if (current > upper) position = "ABOVE_UPPER";
  else if (current < lower) position = "BELOW_LOWER";

  return { upper, middle, lower, position };
}

export function computeATR(
  candles: { high: number; low: number; close: number }[],
  period = 14
): number {
  if (candles.length < 2) return 0;

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  if (trueRanges.length < period) {
    return trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
  }

  // Use Wilder's smoothing
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }

  return atr;
}

export function computeVolatility(prices: number[], period = 20): number {
  if (prices.length < period + 1) return 0;

  const returns: number[] = [];
  for (let i = prices.length - period; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    (returns.length - 1);

  return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility %
}
