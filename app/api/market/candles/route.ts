import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { UpstoxClient } from "@/lib/upstox/client";
import { getHistoricalOHLC } from "@/lib/upstox/market-data";
import { resolveInstrumentKey } from "@/lib/upstox/instruments";
import { resolveSymbolToKey } from "@/lib/upstox/instrument-master";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.upstoxTokenValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbol = request.nextUrl.searchParams.get("symbol");
  const interval = request.nextUrl.searchParams.get("interval") || "day";
  const days = parseInt(request.nextUrl.searchParams.get("days") || "90");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  try {
    const client = new UpstoxClient(session.token);
    let instrumentKey = resolveInstrumentKey(symbol);
    if (!instrumentKey) {
      instrumentKey = await resolveSymbolToKey(symbol);
    }
    if (!instrumentKey) {
      return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 400 });
    }
    const candles = await getHistoricalOHLC(
      client,
      instrumentKey,
      interval as any,
      days
    );
    return NextResponse.json({ data: candles });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
