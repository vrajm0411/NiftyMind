import { UpstoxClient } from "./client";
import { cache } from "@/lib/cache/redis";
import type { HistoricalCandle } from "./types";

export async function getFullQuote(client: UpstoxClient, instrumentKey: string) {
  const cacheKey = `quote:${instrumentKey}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await client.getQuote(instrumentKey);
  cache.set(cacheKey, data, 60); // 60s TTL
  return data;
}

export async function getLTP(client: UpstoxClient, instrumentKey: string) {
  const cacheKey = `ltp:${instrumentKey}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await client.getLTP(instrumentKey);
  cache.set(cacheKey, data, 10); // 10s TTL
  return data;
}

export async function getHistoricalOHLC(
  client: UpstoxClient,
  instrumentKey: string,
  interval: "1minute" | "30minute" | "day" | "week" | "month" = "day",
  days = 90
): Promise<HistoricalCandle[]> {
  const cacheKey = `ohlc:${instrumentKey}:${interval}:${days}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached as HistoricalCandle[];

  const toDate = new Date().toISOString().split("T")[0];
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const response = await client.getHistoricalCandles(
    instrumentKey,
    interval,
    fromDate,
    toDate
  );

  const candles: HistoricalCandle[] = (response?.data?.candles || []).map(
    (c: any[]) => ({
      timestamp: c[0],
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
      volume: c[5],
      oi: c[6],
    })
  );

  cache.set(cacheKey, candles, 300); // 5min TTL
  return candles;
}

export async function getMarketStatus(client: UpstoxClient) {
  const cacheKey = "market:status";
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const data = await client.getMarketStatus();
    cache.set(cacheKey, data, 60);
    return data;
  } catch {
    return null;
  }
}
