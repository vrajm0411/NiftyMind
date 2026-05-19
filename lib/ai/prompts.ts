export const SYSTEM_PROMPT = `You are NiftyMind, an expert Indian stock market analyst (NSE/BSE).

Your response must have TWO parts, separated by the exact delimiter "---JSON_DATA---":

**PART 1 (before the delimiter):** A concise, actionable analysis report in plain text with ## headings. Keep each section SHORT — use bullet points, not paragraphs. Include:
- Executive Summary (2 lines max — verdict + key reason)
- Fundamentals (3-4 bullet points using the provided fundamental data: revenue trend, margins, debt, valuation — one line each. Use ONLY the numbers provided in the "Fundamental Data" section. If no fundamental data is provided, state that fundamental data is unavailable.)
- Technicals (3-4 bullet points: trend direction, RSI reading, key support/resistance levels)
- Crisis Resilience (2-3 bullet points: how the stock performed during major crises vs Nifty 50 — use ONLY the stock-specific crisis data provided. If stock was not listed during a crisis, skip it.)
- Peer Comparison (2-3 bullet points: how this stock compares to competitors by market cap and sector positioning — use ONLY the competitor data provided. If no peer data, skip this section.)
- Risks (2-3 bullet points, one line each)
- Outlook (2 sentences: what to do + price target range)

Do NOT write long paragraphs. Every point should be ONE line with a number or percentage. Skip filler words. Be direct.

**PART 2 (after the delimiter):** Compact JSON for dashboard widgets:

---JSON_DATA---
{
  "summary": "1 sentence verdict",
  "healthScore": <0-100>,
  "recommendation": "STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL",
  "confidence": <0-100>,
  "priceTarget": { "bull": <n>, "base": <n>, "bear": <n>, "current": <n>, "timeframe": "12 months" },
  "fundamental": { "score": <0-100>, "revenue": { "trend": "growing|stable|declining", "cagr": <n> }, "profitability": { "margins": "high|medium|low", "roe": <n> }, "debt": { "level": "low|medium|high", "ratio": <n> }, "valuation": { "peRatio": <n>, "fair": "undervalued|fair|overvalued" } },
  "technical": { "score": <0-100>, "trend": "bullish|neutral|bearish", "rsi": <0-100>, "macd": "bullish|neutral|bearish", "support": <n>, "resistance": <n>, "signals": ["signal1", "signal2"] },
  "risk": { "score": <0-100>, "level": "low|medium|high|very_high", "beta": <n>, "drawdown": <n>, "factors": ["risk1", "risk2"] },
  "crisisResilience": { "score": <0-100>, "covid2020": { "drawdown": <n>, "recovery": "fast|medium|slow" }, "inflation2022": { "impact": "low|medium|high" }, "geopolitical": { "sensitivity": "low|medium|high" } },
  "strengths": ["s1", "s2", "s3"],
  "weaknesses": ["w1", "w2"],
  "outlook": "1-2 sentence outlook",
  "narrative": ""
}

Be precise with numbers. Use realistic price targets based on current price.`;

import type { ScreenerData } from "@/lib/screener/types";

interface CrisisPriceEntry {
  eventDate: string;
  dayBeforePrice: number | null;
  crashDayPrice: number | null;
  change3M: number | null;
  change6M: number | null;
  change1Y: number | null;
}

interface CompetitorEntry {
  instrument_key: string;
  company_profile?: string;
  sector?: string;
  sector_market_cap_inr?: { value: number; unit: string; formatted: string };
}

function formatFundamentalSection(data: ScreenerData): string {
  const source = data.source === "screener" ? "Screener.in" : "Upstox";
  const lines: string[] = [`## Fundamental Data (source: ${source}):`];
  const fmt = (v: number | null, suffix = "") =>
    v !== null ? `${v}${suffix}` : "N/A";

  lines.push(`- Market Cap: ₹${fmt(data.marketCap)} Cr.`);
  lines.push(`- P/E Ratio: ${fmt(data.peRatio)}`);
  lines.push(`- P/B Ratio: ${fmt(data.bookValue)}`);
  lines.push(`- ROE: ${fmt(data.roe, "%")}`);
  lines.push(`- ROCE: ${fmt(data.roce, "%")}`);
  lines.push(`- Dividend Yield: ${fmt(data.dividendYield, "%")}`);
  lines.push(`- Revenue (latest annual): ₹${fmt(data.revenue)} Cr.`);
  lines.push(`- Net Profit (latest annual): ₹${fmt(data.netProfit)} Cr.`);
  lines.push(`- OPM: ${fmt(data.opm, "%")}`);
  lines.push(`- EPS: ₹${fmt(data.eps)}`);
  lines.push(`- Debt to Equity: ${fmt(data.debtToEquity)}`);
  if (data.revenueCagr3yr !== null)
    lines.push(`- Revenue CAGR (3yr): ${fmt(data.revenueCagr3yr, "%")}`);
  if (data.profitCagr3yr !== null)
    lines.push(`- Profit CAGR (3yr): ${fmt(data.profitCagr3yr, "%")}`);

  return lines.join("\n");
}

function formatStockCrisisSection(
  symbol: string,
  stockCrisis: CrisisPriceEntry[],
  niftyCrisis: any
): string {
  if (!stockCrisis || stockCrisis.length === 0) return "";

  const lines: string[] = [`## ${symbol} Crisis Performance (stock-specific):`];
  const niftyEvents = Array.isArray(niftyCrisis) ? niftyCrisis : [];

  for (const entry of stockCrisis) {
    if (entry.dayBeforePrice === null) continue; // stock not listed
    const niftyMatch = niftyEvents.find(
      (e: any) => e.date === entry.eventDate
    );
    const eventName = niftyMatch?.name || entry.eventDate;

    let line = `- ${eventName} (${entry.eventDate}): Day Before ₹${entry.dayBeforePrice}`;
    if (entry.crashDayPrice !== null) {
      const drop = (
        ((entry.crashDayPrice - entry.dayBeforePrice) /
          entry.dayBeforePrice) *
        100
      ).toFixed(1);
      line += `, Crash Day Close ₹${entry.crashDayPrice} (${+drop > 0 ? "+" : ""}${drop}%)`;
    }
    if (entry.change3M !== null) line += `, 3M: ${entry.change3M > 0 ? "+" : ""}${entry.change3M}%`;
    if (entry.change6M !== null) line += `, 6M: ${entry.change6M > 0 ? "+" : ""}${entry.change6M}%`;
    if (entry.change1Y !== null) line += `, 1Y: ${entry.change1Y > 0 ? "+" : ""}${entry.change1Y}%`;
    lines.push(line);
  }

  return lines.join("\n");
}

function formatCompetitorsSection(competitors: CompetitorEntry[]): string {
  if (!competitors || competitors.length === 0) return "";

  const lines: string[] = ["## Peer Competitors:"];
  for (const c of competitors.slice(0, 8)) {
    const name = c.instrument_key?.split("|")[1] || c.instrument_key || "Unknown";
    const cap = c.sector_market_cap_inr?.formatted || "N/A";
    const sector = c.sector || "N/A";
    lines.push(`- ${name} | Sector: ${sector} | Market Cap: ₹${cap}`);
  }
  return lines.join("\n");
}

export function buildUserPrompt(
  symbol: string,
  quoteData: any,
  historicalData: any,
  crisisData?: any,
  screenerData?: ScreenerData | null,
  stockCrisisData?: CrisisPriceEntry[],
  competitorsData?: CompetitorEntry[]
): string {
  const fundamentalSection = screenerData
    ? formatFundamentalSection(screenerData)
    : "## Fundamental Data:\nNot available — base your fundamental analysis on any data visible in the market quote.\n";

  const stockCrisisSection = stockCrisisData
    ? formatStockCrisisSection(symbol, stockCrisisData, crisisData)
    : "";

  const competitorsSection = competitorsData
    ? formatCompetitorsSection(competitorsData)
    : "";

  return `Analyze: ${symbol}

## Market Data:
${JSON.stringify(quoteData || {}, null, 2)}

## Price History (${historicalData?.length || 0} daily candles):
${JSON.stringify(historicalData || [], null, 2)}

${fundamentalSection}

${crisisData ? `## Nifty 50 Crisis Reference:\n${JSON.stringify(crisisData, null, 2)}\n` : ""}
${stockCrisisSection}

${competitorsSection}

Give a concise analysis covering fundamentals, technicals, crisis resilience, peer comparison, risks, and a clear recommendation. Use the provided fundamental data for ALL financial metrics — do NOT estimate or fabricate numbers. For crisis resilience, use the stock-specific crisis data (not Nifty). Keep the readable report SHORT — bullet points only, no long paragraphs. Then include the JSON after ---JSON_DATA---.`;
}
