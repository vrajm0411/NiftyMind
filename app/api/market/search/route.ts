import { NextRequest, NextResponse } from "next/server";
import { searchAllInstruments } from "@/lib/upstox/instrument-master";
import { searchInstruments } from "@/lib/upstox/instruments";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";

  if (query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Try dynamic search from Upstox instrument master (all NSE stocks)
    const dynamicResults = await searchAllInstruments(query);

    if (dynamicResults.length > 0) {
      return NextResponse.json({
        results: dynamicResults.map((r) => ({
          symbol: r.symbol,
          instrumentKey: r.instrumentKey,
          name: r.name,
        })),
      });
    }
  } catch (error) {
    console.error("Dynamic instrument search failed:", error);
  }

  // Fallback to local hardcoded list
  const results = searchInstruments(query);
  return NextResponse.json({ results });
}
