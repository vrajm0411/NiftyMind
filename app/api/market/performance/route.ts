import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { UpstoxClient } from "@/lib/upstox/client";
import { getFullQuote, getHistoricalOHLC } from "@/lib/upstox/market-data";
import { resolveInstrumentKey } from "@/lib/upstox/instruments";
import { resolveSymbolToKey } from "@/lib/upstox/instrument-master";
import { cache } from "@/lib/cache/redis";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.upstoxTokenValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const cacheKey = `perf:${symbol.toUpperCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const client = new UpstoxClient(session.token);
    let instrumentKey = resolveInstrumentKey(symbol);
    if (!instrumentKey) {
      instrumentKey = await resolveSymbolToKey(symbol);
    }
    if (!instrumentKey) {
      return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 400 });
    }

    // Fetch quote + 1 year of daily candles in parallel
    const [quoteResult, candlesResult] = await Promise.allSettled([
      getFullQuote(client, instrumentKey),
      getHistoricalOHLC(client, instrumentKey, "day", 370),
    ]);

    const quoteData = quoteResult.status === "fulfilled" ? quoteResult.value : null;
    const candles = candlesResult.status === "fulfilled" ? candlesResult.value : [];

    // Extract CMP from quote
    const quote = quoteData?.data?.[instrumentKey];
    const cmp = quote?.last_price ?? (candles.length > 0 ? candles[0].close : null);

    if (cmp === null) {
      return NextResponse.json({ error: "Could not fetch price" }, { status: 500 });
    }

    // Candles are sorted newest first from Upstox
    const sortedCandles = [...candles].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Last 5 working days (latest 5 candles)
    const last5Days = sortedCandles.slice(0, 6).map((c) => ({
      date: c.timestamp.split("T")[0],
      close: c.close,
    }));

    // Price 5 working days ago (aggregate change over 5 sessions)
    const price5D = last5Days.length >= 6 ? last5Days[5].close : (last5Days.length > 1 ? last5Days[last5Days.length - 1].close : null);

    // Find prices at 1M, 3M, 6M, 1Y ago
    const now = new Date();
    const findPriceAt = (monthsAgo: number): number | null => {
      const target = new Date(now);
      target.setMonth(target.getMonth() - monthsAgo);
      const targetTime = target.getTime();

      // Find the candle closest to the target date (within 10 days)
      let best: { diff: number; close: number } | null = null;
      for (const c of sortedCandles) {
        const ct = new Date(c.timestamp).getTime();
        const diff = Math.abs(ct - targetTime);
        if (diff <= 10 * 24 * 60 * 60 * 1000) {
          if (!best || diff < best.diff) {
            best = { diff, close: c.close };
          }
        }
      }
      return best?.close ?? null;
    };

    const price1M = findPriceAt(1);
    const price3M = findPriceAt(3);
    const price6M = findPriceAt(6);
    const price1Y = findPriceAt(12);

    const pctChange = (base: number | null): number | null => {
      if (base === null || base === 0) return null;
      return +(((cmp - base) / base) * 100).toFixed(2);
    };

    const result = {
      symbol: symbol.toUpperCase(),
      cmp,
      periods: {
        "5D": { price: price5D, change: price5D ? +(cmp - price5D).toFixed(2) : null, changePct: pctChange(price5D) },
        "1M": { price: price1M, change: price1M ? +(cmp - price1M).toFixed(2) : null, changePct: pctChange(price1M) },
        "3M": { price: price3M, change: price3M ? +(cmp - price3M).toFixed(2) : null, changePct: pctChange(price3M) },
        "6M": { price: price6M, change: price6M ? +(cmp - price6M).toFixed(2) : null, changePct: pctChange(price6M) },
        "1Y": { price: price1Y, change: price1Y ? +(cmp - price1Y).toFixed(2) : null, changePct: pctChange(price1Y) },
      },
    };

    cache.set(cacheKey, result, 60); // 60s cache
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
