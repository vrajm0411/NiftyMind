import { cache, TTL } from "@/lib/cache/redis";
import { env } from "@/lib/env";
import { parseScreenerHTML } from "./parser";
import type { ScreenerData } from "./types";

function cacheKey(symbol: string): string {
  return `screener:${symbol.toUpperCase()}`;
}

/**
 * Map NSE trading symbols to screener.in URL slugs.
 * Most symbols work as-is, but some need adjustment.
 */
function toScreenerSlug(symbol: string): string {
  // Remove exchange prefix if present (e.g., "NSE:INFY" → "INFY")
  const clean = symbol.replace(/^(NSE|BSE):/, "").toUpperCase();
  return clean;
}

async function fetchScreenerDirect(symbol: string): Promise<ScreenerData> {
  const slug = toScreenerSlug(symbol);
  const url = `https://www.screener.in/company/${slug}/consolidated/`;

  console.log(`[Screener] Direct fetch: ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    // Try standalone (non-consolidated) page for companies without subsidiaries
    if (res.status === 404) {
      const standaloneUrl = `https://www.screener.in/company/${slug}/`;
      console.log(`[Screener] Trying standalone: ${standaloneUrl}`);
      const res2 = await fetch(standaloneUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res2.ok) {
        throw new Error(`Screener returned ${res2.status} for ${slug}`);
      }
      const html = await res2.text();
      return parseScreenerHTML(html, symbol);
    }
    throw new Error(`Screener returned ${res.status} for ${slug}`);
  }

  const html = await res.text();
  return parseScreenerHTML(html, symbol);
}

async function fetchScreenerViaApify(symbol: string): Promise<ScreenerData> {
  const token = env.apifyApiToken;
  if (!token) {
    throw new Error("APIFY_API_TOKEN not configured");
  }

  const slug = toScreenerSlug(symbol);
  console.log(`[Screener] Apify fallback for: ${slug}`);

  const res = await fetch(
    "https://api.apify.com/v2/acts/shashwattrivedi~screener-in/run-sync-get-dataset-items?token=" +
      encodeURIComponent(token),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: [`https://www.screener.in/company/${slug}/consolidated/`],
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    throw new Error(`Apify returned ${res.status}`);
  }

  const items = await res.json();
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Apify returned empty dataset");
  }

  const item = items[0];
  return {
    symbol,
    marketCap: item.marketCap ?? null,
    peRatio: item.pe ?? item.peRatio ?? null,
    roe: item.roe ?? null,
    roce: item.roce ?? null,
    bookValue: item.bookValue ?? null,
    dividendYield: item.dividendYield ?? null,
    revenue: item.revenue ?? item.sales ?? null,
    netProfit: item.netProfit ?? null,
    opm: item.opm ?? null,
    eps: item.eps ?? null,
    debtToEquity: item.debtToEquity ?? null,
    revenueCagr3yr: item.revenueCagr3yr ?? null,
    profitCagr3yr: item.profitCagr3yr ?? null,
    fetchedAt: Date.now(),
    source: "screener",
  };
}

export async function getScreenerData(
  symbol: string
): Promise<ScreenerData | null> {
  const key = cacheKey(symbol);

  // Check cache first
  const cached = cache.get(key) as ScreenerData | null;
  if (cached) {
    console.log(`[Screener] Cache hit for ${symbol}`);
    return cached;
  }

  // Try direct fetch, then Apify fallback
  try {
    const data = await fetchScreenerDirect(symbol);
    cache.set(key, data, TTL.SCREENER);
    console.log(`[Screener] Direct fetch success for ${symbol}`);
    return data;
  } catch (directErr) {
    console.warn(`[Screener] Direct fetch failed: ${directErr}`);
  }

  try {
    const data = await fetchScreenerViaApify(symbol);
    cache.set(key, data, TTL.SCREENER);
    console.log(`[Screener] Apify fallback success for ${symbol}`);
    return data;
  } catch (apifyErr) {
    console.warn(`[Screener] Apify fallback failed: ${apifyErr}`);
  }

  // Graceful degradation — analysis proceeds without fundamental data
  console.warn(`[Screener] All fetches failed for ${symbol}, proceeding without fundamental data`);
  return null;
}
