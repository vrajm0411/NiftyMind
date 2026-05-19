export interface ScreenerData {
  symbol: string;
  marketCap: number | null;
  peRatio: number | null;
  roe: number | null;
  roce: number | null;
  bookValue: number | null;
  dividendYield: number | null;
  revenue: number | null;
  netProfit: number | null;
  opm: number | null;
  eps: number | null;
  debtToEquity: number | null;
  revenueCagr3yr: number | null;
  profitCagr3yr: number | null;
  fetchedAt: number;
  source?: "upstox" | "screener";
}
