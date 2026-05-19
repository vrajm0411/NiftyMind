import { UpstoxClient } from "./client";
import { cache, TTL } from "@/lib/cache/redis";
import type { ScreenerData } from "@/lib/screener/types";

/**
 * Extract ISIN from an Upstox instrument key.
 * e.g. "NSE_EQ|INE002A01018" → "INE002A01018"
 */
export function extractISIN(instrumentKey: string): string | null {
  const parts = instrumentKey.split("|");
  if (parts.length !== 2) return null;
  const isin = parts[1];
  // ISIN format: 2 letters + 9 alphanumeric + 1 check digit
  if (/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin)) return isin;
  return null;
}

interface KeyRatio {
  name: string;
  company_value: string;
  sector_value: string;
}

/**
 * Fetch company fundamentals from Upstox API and return in ScreenerData format
 * for compatibility with the existing AI analyzer pipeline.
 */
export async function getUpstoxFundamentals(
  client: UpstoxClient,
  instrumentKey: string,
  symbol: string
): Promise<ScreenerData | null> {
  const isin = extractISIN(instrumentKey);
  if (!isin) {
    console.warn(`[Fundamentals] Cannot extract ISIN from ${instrumentKey}`);
    return null;
  }

  const cacheKey = `fundamentals:${isin}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[Fundamentals] Cache hit for ${symbol} (${isin})`);
    return cached as ScreenerData;
  }

  try {
    // Fetch key ratios + income statement + balance sheet + profile in parallel
    const [ratiosResult, incomeResult, balanceResult, profileResult] = await Promise.allSettled([
      client.getKeyRatios(isin),
      client.getIncomeStatement(isin, "consolidated", "yearly"),
      client.getBalanceSheet(isin, "consolidated", "yearly"),
      client.getCompanyProfile(isin),
    ]);

    // Parse key ratios
    let peRatio: number | null = null;
    let pbRatio: number | null = null;
    let roe: number | null = null;
    let roce: number | null = null;
    let dividendYield: number | null = null;
    let eps: number | null = null;

    if (ratiosResult.status === "fulfilled" && ratiosResult.value?.data) {
      const rawData = ratiosResult.value.data;
      // Log raw structure for debugging
      if (Array.isArray(rawData)) {
        console.log(`[Fundamentals] Key ratios sample for ${symbol}:`, JSON.stringify(rawData.slice(0, 3)));
        const ratios: KeyRatio[] = rawData;
        for (const r of ratios) {
          const val = parseFloat(r.company_value);
          if (isNaN(val)) continue;
          const name = (r.name || "").trim();
          // Match various possible name formats from API
          if (name === "P/E" || name === "PE" || name === "P/E Ratio") peRatio = val;
          else if (name === "P/B" || name === "PB" || name === "P/B Ratio" || name === "Price to Book") pbRatio = val;
          else if (name === "ROE" || name === "Return on Equity") roe = val;
          else if (name === "ROCE" || name === "Return on Capital Employed") roce = val;
          else if (name === "Dividend Yield" || name === "Div Yield") dividendYield = val;
          else if (name === "EPS" || name === "Earnings Per Share") eps = val;
        }
      } else if (typeof rawData === "object") {
        // Handle object format: { pe_ratio: 25, roe: 18, ... }
        console.log(`[Fundamentals] Key ratios object for ${symbol}:`, JSON.stringify(Object.keys(rawData)));
        peRatio = parseFloat(rawData.pe_ratio ?? rawData.pe ?? rawData["P/E"]) || null;
        pbRatio = parseFloat(rawData.pb_ratio ?? rawData.pb ?? rawData["P/B"]) || null;
        roe = parseFloat(rawData.roe ?? rawData.return_on_equity ?? rawData["ROE"]) || null;
        roce = parseFloat(rawData.roce ?? rawData.return_on_capital_employed ?? rawData["ROCE"]) || null;
        dividendYield = parseFloat(rawData.dividend_yield ?? rawData["Dividend Yield"]) || null;
        eps = parseFloat(rawData.eps ?? rawData.earnings_per_share ?? rawData["EPS"]) || null;
      }
    } else if (ratiosResult.status === "rejected") {
      console.warn(`[Fundamentals] Key ratios failed for ${symbol}:`, ratiosResult.reason?.message || ratiosResult.reason);
    }

    // Parse income statement for revenue, net profit, OPM
    let revenue: number | null = null;
    let netProfit: number | null = null;
    let opm: number | null = null;

    if (incomeResult.status === "fulfilled" && incomeResult.value?.data) {
      const incomeData = incomeResult.value.data;
      const statements = incomeData.income_statement || incomeData;
      if (!incomeData.income_statement) {
        console.log(`[Fundamentals] Income data keys for ${symbol}:`, JSON.stringify(Object.keys(incomeData)));
      }
      for (const cat of statements) {
        const latestValue = cat.history?.[0]?.value;
        if (latestValue === undefined || latestValue === null) continue;
        switch (cat.category) {
          case "revenue": revenue = latestValue; break;
          case "net_profit": netProfit = latestValue; break;
          case "operating_profit":
            if (revenue && revenue > 0) {
              opm = +((latestValue / revenue) * 100).toFixed(1);
            }
            break;
        }
      }

      // Derive EPS from net profit if not in key ratios
      if (eps === null && netProfit !== null) {
        // Try to get shares outstanding from profile
        if (profileResult.status === "fulfilled" && profileResult.value?.data?.shares_outstanding) {
          const shares = profileResult.value.data.shares_outstanding;
          if (shares > 0) {
            eps = +((netProfit * 10_000_000 / shares).toFixed(2)); // netProfit in Cr, shares in units
          }
        }
      }
    }

    // Parse balance sheet for debt-to-equity
    let debtToEquity: number | null = null;

    if (balanceResult.status === "fulfilled" && balanceResult.value?.data?.balance_sheet) {
      const sheets = balanceResult.value.data.balance_sheet;
      let totalDebt: number | null = null;
      let totalEquity: number | null = null;

      for (const cat of sheets) {
        const latestValue = cat.history?.[0]?.value;
        if (latestValue === undefined || latestValue === null) continue;
        const name = (cat.category || "").toLowerCase();
        if (name === "total_debt" || name === "borrowings" || name === "total_borrowings") {
          totalDebt = latestValue;
        }
        if (name === "total_equity" || name === "shareholders_equity" || name === "equity") {
          totalEquity = latestValue;
        }
      }

      if (totalDebt !== null && totalEquity !== null && totalEquity > 0) {
        debtToEquity = +((totalDebt / totalEquity).toFixed(2));
      }
    }

    // Parse market cap from profile
    let marketCapCr: number | null = null;
    if (profileResult.status === "fulfilled" && profileResult.value?.data) {
      const profile = profileResult.value.data;
      if (profile.sector_market_cap_inr?.value) {
        marketCapCr = profile.sector_market_cap_inr.value;
      }
    }

    const result: ScreenerData = {
      symbol,
      marketCap: marketCapCr,
      peRatio,
      roe,
      roce,
      bookValue: pbRatio,
      dividendYield,
      revenue,
      netProfit,
      opm,
      eps,
      debtToEquity,
      revenueCagr3yr: null,
      profitCagr3yr: null,
      fetchedAt: Date.now(),
      source: "upstox",
    };

    // If no meaningful data was parsed, return null to trigger Screener.in fallback
    const hasAnyData = peRatio !== null || roe !== null || roce !== null || revenue !== null || netProfit !== null;
    if (!hasAnyData) {
      console.warn(`[Fundamentals] Upstox returned no usable data for ${symbol} (${isin}) — will fallback`);
      return null;
    }

    cache.set(cacheKey, result, TTL.SCREENER);
    console.log(`[Fundamentals] Upstox data fetched for ${symbol} (${isin}): PE=${peRatio} ROE=${roe} EPS=${eps} D/E=${debtToEquity}`);
    return result;
  } catch (error) {
    console.warn(`[Fundamentals] Failed for ${symbol}: ${(error as Error).message}`);
    return null;
  }
}
