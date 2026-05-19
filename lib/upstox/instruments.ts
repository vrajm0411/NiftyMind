// Common NSE stocks as quick-access defaults (not a limit — any symbol works)
export const NSE_INSTRUMENT_MAP: Record<string, string> = {
  // Nifty 50 Top Stocks
  RELIANCE: "NSE_EQ|INE002A01018",
  TCS: "NSE_EQ|INE467B01029",
  INFY: "NSE_EQ|INE009A01021",
  HDFCBANK: "NSE_EQ|INE040A01034",
  ICICIBANK: "NSE_EQ|INE090A01021",
  WIPRO: "NSE_EQ|INE075A01022",
  ADANIENT: "NSE_EQ|INE423A01024",
  TATAMOTORS: "NSE_EQ|INE155A01022",
  BAJFINANCE: "NSE_EQ|INE296A01024",
  SBIN: "NSE_EQ|INE062A01020",
  HINDUNILVR: "NSE_EQ|INE030A01027",
  ITC: "NSE_EQ|INE154A01025",
  KOTAKBANK: "NSE_EQ|INE237A01028",
  LT: "NSE_EQ|INE018A01030",
  AXISBANK: "NSE_EQ|INE238A01034",
  BHARTIARTL: "NSE_EQ|INE397D01024",
  ASIANPAINT: "NSE_EQ|INE021A01026",
  HCLTECH: "NSE_EQ|INE860A01027",
  MARUTI: "NSE_EQ|INE585B01010",
  SUNPHARMA: "NSE_EQ|INE044A01036",
  TITAN: "NSE_EQ|INE280A01028",
  BAJAJFINSV: "NSE_EQ|INE918I01026",
  ULTRACEMCO: "NSE_EQ|INE481G01011",
  NESTLEIND: "NSE_EQ|INE239A01016",
  NTPC: "NSE_EQ|INE733E01010",
  POWERGRID: "NSE_EQ|INE752E01010",
  ONGC: "NSE_EQ|INE213A01029",
  M_M: "NSE_EQ|INE101A01026",
  TATASTEEL: "NSE_EQ|INE081A01020",
  JSWSTEEL: "NSE_EQ|INE019A01038",
  COALINDIA: "NSE_EQ|INE522F01014",
  ADANIPORTS: "NSE_EQ|INE742F01042",
  TECHM: "NSE_EQ|INE669C01036",
  DRREDDY: "NSE_EQ|INE089A01023",
  INDUSINDBK: "NSE_EQ|INE095A01012",
  CIPLA: "NSE_EQ|INE059A01026",
  GRASIM: "NSE_EQ|INE047A01021",
  DIVISLAB: "NSE_EQ|INE361B01024",
  BPCL: "NSE_EQ|INE029A01011",
  HEROMOTOCO: "NSE_EQ|INE158A01026",
  APOLLOHOSP: "NSE_EQ|INE437A01024",
  EICHERMOT: "NSE_EQ|INE066A01021",
  BRITANNIA: "NSE_EQ|INE216A01030",
  TATACONSUM: "NSE_EQ|INE192A01025",
  SBILIFE: "NSE_EQ|INE123W01016",
  HDFCLIFE: "NSE_EQ|INE795G01014",
  HINDALCO: "NSE_EQ|INE038A01020",
  UPL: "NSE_EQ|INE628A01036",
  BAJAJ_AUTO: "NSE_EQ|INE917I01010",
  // Additional Popular Stocks
  ZOMATO: "NSE_EQ|INE758T01015",
  PAYTM: "NSE_EQ|INE982J01020",
  NYKAA: "NSE_EQ|INE388Y01029",
  DMART: "NSE_EQ|INE883A01011",
  IRCTC: "NSE_EQ|INE335Y01020",
  TATAPOWER: "NSE_EQ|INE245A01021",
  VEDL: "NSE_EQ|INE205A01025",
  BANKBARODA: "NSE_EQ|INE028A01039",
  PNB: "NSE_EQ|INE160A01022",
  IOC: "NSE_EQ|INE242A01010",
  GAIL: "NSE_EQ|INE129A01019",
  ADANIGREEN: "NSE_EQ|INE364U01010",
  ADANIPOWER: "NSE_EQ|INE814H01029",
  TORNTPHARM: "NSE_EQ|INE685A01028",
  PIDILITIND: "NSE_EQ|INE318A01026",
  HAVELLS: "NSE_EQ|INE176B01034",
  GODREJCP: "NSE_EQ|INE102D01028",
  DABUR: "NSE_EQ|INE016A01026",
  MARICO: "NSE_EQ|INE196A01026",
  SIEMENS: "NSE_EQ|INE003A01024",
  BERGEPAINT: "NSE_EQ|INE463A01038",
  AMBUJACEM: "NSE_EQ|INE079A01024",
  ACC: "NSE_EQ|INE012A01025",
  DLF: "NSE_EQ|INE271C01023",
  GODREJPROP: "NSE_EQ|INE484J01027",
  TRENT: "NSE_EQ|INE849A01020",
  INDIGO: "NSE_EQ|INE646L01027",
  // Indices
  NIFTY50: "NSE_INDEX|Nifty 50",
  BANKNIFTY: "NSE_INDEX|Nifty Bank",
  NIFTYIT: "NSE_INDEX|Nifty IT",
  NIFTYPHARMA: "NSE_INDEX|Nifty Pharma",
  SENSEX: "BSE_INDEX|SENSEX",
};

export interface InstrumentSearchResult {
  symbol: string;
  instrumentKey: string;
  name: string;
}

/**
 * Search instruments - first matches from local map, then allows any typed symbol.
 * Returns local matches for known stocks, and includes the raw query as a custom entry
 * so users can analyze ANY NSE stock even if not in the predefined list.
 */
export function searchInstruments(query: string): InstrumentSearchResult[] {
  const q = query.toUpperCase().trim();
  if (!q) return [];

  const localMatches = Object.entries(NSE_INSTRUMENT_MAP)
    .filter(([symbol]) => symbol.includes(q))
    .slice(0, 15)
    .map(([symbol, instrumentKey]) => ({
      symbol,
      instrumentKey,
      name: symbol.replace(/_/g, " "),
    }));

  // If the query doesn't exactly match any known stock, add it as a custom entry
  // so the user can search for ANY NSE stock symbol
  const exactMatch = Object.keys(NSE_INSTRUMENT_MAP).some(
    (s) => s === q
  );

  if (!exactMatch && q.length >= 2) {
    localMatches.push({
      symbol: q,
      instrumentKey: `NSE_EQ|${q}`,
      name: `${q} (search on NSE)`,
    });
  }

  return localMatches;
}

/**
 * Resolve a symbol to its Upstox instrument key (sync, local map only).
 * For unknown stocks, returns null so the caller can try the dynamic resolver.
 */
export function resolveInstrumentKey(symbol: string): string | null {
  const upper = symbol.toUpperCase().trim().replace(/\s+/g, "");
  return NSE_INSTRUMENT_MAP[upper] || null;
}

export const QUICK_PICKS = [
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ICICIBANK",
  "SBIN",
  "TATAMOTORS",
  "ADANIENT",
  "BAJFINANCE",
  "ITC",
];
