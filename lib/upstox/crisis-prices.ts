import { UpstoxClient } from "./client";
import { cache } from "@/lib/cache/redis";
import { CRISIS_HISTORICAL_EVENTS } from "@/lib/ai/crisis-data";

export interface CrisisPrice {
  eventDate: string;
  dayBeforePrice: number | null;
  crashDayPrice: number | null;
  price3M: number | null;
  price6M: number | null;
  price1Y: number | null;
  change3M: number | null;
  change6M: number | null;
  change1Y: number | null;
}

function addMonths(dateStr: string, months: number): Date {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d;
}

function subDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d;
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Find the closest candle to a target date.
 * @param direction "before" = only candles on or before target,
 *                  "after"  = only candles on or after target,
 *                  "any"    = either direction (default)
 */
function findClosest(
  candles: { timestamp: string; close: number }[],
  target: Date,
  direction: "before" | "after" | "any" = "any"
): number | null {
  if (!candles.length) return null;
  const t = target.getTime();
  let best: { diff: number; close: number } | null = null;
  for (const c of candles) {
    const ct = new Date(c.timestamp).getTime();
    // Filter by direction
    if (direction === "before" && ct > t) continue;
    if (direction === "after" && ct < t) continue;
    const diff = Math.abs(ct - t);
    if (!best || diff < best.diff) {
      best = { diff, close: c.close };
    }
  }
  // Accept if within 10 days
  if (best && best.diff <= 10 * 24 * 60 * 60 * 1000) return best.close;
  return null;
}

function pctChange(base: number | null, later: number | null): number | null {
  if (base === null || later === null || base === 0) return null;
  return +((((later - base) / base) * 100).toFixed(1));
}

/**
 * Fetch a stock's prices around each crisis event date.
 * Makes one API call per crisis event (fetches day-5 to day+370 range).
 */
export async function fetchCrisisPrices(
  client: UpstoxClient,
  instrumentKey: string,
  symbol: string
): Promise<CrisisPrice[]> {
  const cacheKey = `crisis-prices:${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached as CrisisPrice[];

  const now = new Date();
  const results: CrisisPrice[] = [];

  // Parse each crisis event date and fetch data
  const DATE_MAP: Record<string, string> = {
    "Nov 8, 2016": "2016-11-08",
    "Jul 6, 2018": "2018-07-06",
    "Mar 1, 2020": "2020-03-01",
    "Feb 24, 2022": "2022-02-24",
    "Jan 24, 2023": "2023-01-24",
    "Feb 1, 2025": "2025-02-01",
    "Feb 28, 2026": "2026-02-28",
  };

  for (const event of CRISIS_HISTORICAL_EVENTS) {
    const isoDate = DATE_MAP[event.date];
    const empty: CrisisPrice = {
      eventDate: event.date,
      dayBeforePrice: null,
      crashDayPrice: null,
      price3M: null,
      price6M: null,
      price1Y: null,
      change3M: null,
      change6M: null,
      change1Y: null,
    };

    if (!isoDate) { results.push(empty); continue; }

    const eventD = new Date(isoDate);
    if (eventD > now) { results.push(empty); continue; }

    try {
      const from = fmt(subDays(isoDate, 10));
      const oneYearLater = addMonths(isoDate, 13);
      const to = fmt(oneYearLater > now ? now : oneYearLater);

      const response = await client.getHistoricalCandles(
        instrumentKey,
        "day",
        from,
        to
      );

      const candles: { timestamp: string; close: number }[] = (
        response?.data?.candles || []
      ).map((c: any[]) => ({
        timestamp: c[0],
        close: c[4],
      }));

      const dayBefore = findClosest(candles, subDays(isoDate, 1), "before");
      const crashDay = findClosest(candles, eventD, "after");
      const at3M = findClosest(candles, addMonths(isoDate, 3));
      const at6M = findClosest(candles, addMonths(isoDate, 6));
      const at1Y = findClosest(candles, addMonths(isoDate, 12));

      results.push({
        eventDate: event.date,
        dayBeforePrice: dayBefore,
        crashDayPrice: crashDay,
        price3M: at3M,
        price6M: at6M,
        price1Y: at1Y,
        change3M: pctChange(dayBefore, at3M),
        change6M: pctChange(dayBefore, at6M),
        change1Y: pctChange(dayBefore, at1Y),
      });
    } catch {
      results.push(empty);
    }
  }

  cache.set(cacheKey, results, 600); // 10min TTL
  return results;
}
