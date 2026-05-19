import { gunzipSync } from "zlib";

export interface InstrumentEntry {
  symbol: string;
  name: string;
  instrumentKey: string;
  isin: string;
}

// In-memory cache for the full instrument list
let instrumentCache: InstrumentEntry[] | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function loadInstruments(): Promise<InstrumentEntry[]> {
  // Return cached if fresh
  if (instrumentCache && Date.now() - cacheLoadedAt < CACHE_TTL) {
    return instrumentCache;
  }

  try {
    const res = await fetch(
      "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz"
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch instruments: ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const decompressed = gunzipSync(buffer);
    const data = JSON.parse(decompressed.toString());

    // Filter to equity instruments only
    const instruments: InstrumentEntry[] = data
      .filter(
        (item: any) =>
          item.segment === "NSE_EQ" &&
          (item.instrument_type === "EQUITY" || item.instrument_type === "EQ")
      )
      .map((item: any) => ({
        symbol: item.trading_symbol || item.tradingsymbol || "",
        name: item.name || item.company || "",
        instrumentKey: item.instrument_key || `NSE_EQ|${item.isin}`,
        isin: item.isin || "",
      }))
      .filter((i: InstrumentEntry) => i.symbol && i.instrumentKey);

    instrumentCache = instruments;
    cacheLoadedAt = Date.now();
    console.log(`Loaded ${instruments.length} NSE instruments`);
    return instruments;
  } catch (error) {
    console.error("Failed to load instrument master:", error);
    // Return cached data even if stale, or empty array
    return instrumentCache || [];
  }
}

/**
 * Search all NSE instruments by symbol or company name
 */
export async function searchAllInstruments(
  query: string
): Promise<InstrumentEntry[]> {
  const instruments = await loadInstruments();
  const q = query.toUpperCase().trim();
  if (!q || q.length < 1) return [];

  // Exact symbol matches first, then partial matches
  const exact: InstrumentEntry[] = [];
  const startsWith: InstrumentEntry[] = [];
  const contains: InstrumentEntry[] = [];

  for (const inst of instruments) {
    const sym = inst.symbol.toUpperCase();
    const name = inst.name.toUpperCase();

    if (sym === q) {
      exact.push(inst);
    } else if (sym.startsWith(q)) {
      startsWith.push(inst);
    } else if (sym.includes(q) || name.includes(q)) {
      contains.push(inst);
    }
  }

  return [...exact, ...startsWith, ...contains].slice(0, 25);
}

/**
 * Resolve a trading symbol to its proper Upstox instrument key (with ISIN)
 */
export async function resolveSymbolToKey(
  symbol: string
): Promise<string | null> {
  const instruments = await loadInstruments();
  const upper = symbol.toUpperCase().trim();
  const found = instruments.find((i) => i.symbol.toUpperCase() === upper);
  return found?.instrumentKey || null;
}
