import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { UpstoxClient } from "@/lib/upstox/client";
import { getFullQuote } from "@/lib/upstox/market-data";
import { QUICK_PICKS, resolveInstrumentKey } from "@/lib/upstox/instruments";

export async function GET() {
  const session = await getSession();
  if (!session || !session.upstoxTokenValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = new UpstoxClient(session.token);
    const results = await Promise.allSettled(
      QUICK_PICKS.map(async (symbol) => {
        const key = resolveInstrumentKey(symbol);
        if (!key) return null;
        const data = await getFullQuote(client, key);
        const quote = data?.data?.[key];
        return {
          symbol,
          price: quote?.last_price ?? 0,
          change: quote?.net_change ?? 0,
          changePercent:
            quote?.last_price && quote?.ohlc?.close
              ? ((quote.last_price - quote.ohlc.close) / quote.ohlc.close) * 100
              : 0,
          volume: quote?.volume ?? 0,
        };
      })
    );

    const stocks = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<any>).value)
      .sort((a, b) => b.changePercent - a.changePercent);

    const gainers = stocks.filter((s) => s.changePercent > 0).slice(0, 5);
    const losers = stocks
      .filter((s) => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    return NextResponse.json({ gainers, losers });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
