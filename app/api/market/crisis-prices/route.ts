import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { UpstoxClient } from "@/lib/upstox/client";
import { resolveInstrumentKey } from "@/lib/upstox/instruments";
import { resolveSymbolToKey } from "@/lib/upstox/instrument-master";
import { fetchCrisisPrices } from "@/lib/upstox/crisis-prices";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.upstoxTokenValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbol = request.nextUrl.searchParams.get("symbol");
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
      return NextResponse.json(
        { error: `Unknown symbol: ${symbol}` },
        { status: 400 }
      );
    }

    const prices = await fetchCrisisPrices(client, instrumentKey, symbol);
    return NextResponse.json({ data: prices });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
