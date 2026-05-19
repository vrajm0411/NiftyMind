import { UpstoxClient } from "@/lib/upstox/client";
import { resolveInstrumentKey } from "@/lib/upstox/instruments";
import { resolveSymbolToKey } from "@/lib/upstox/instrument-master";
import { getFullQuote, getHistoricalOHLC } from "@/lib/upstox/market-data";
import { getUpstoxFundamentals, extractISIN } from "@/lib/upstox/fundamentals";
import { fetchCrisisPrices } from "@/lib/upstox/crisis-prices";
import { getScreenerData } from "@/lib/screener/client";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { streamAnalysis } from "./streaming";
import { getCrisisContext } from "./crisis-data";
import type { AnalysisChunk } from "./types";

export async function* runAnalysis(
  symbol: string,
  token: string
): AsyncGenerator<AnalysisChunk> {
  const client = new UpstoxClient(token);

  // Try local map first, then dynamic resolution
  let instrumentKey = resolveInstrumentKey(symbol);
  if (!instrumentKey) {
    yield { section: "status", content: "Resolving instrument..." };
    instrumentKey = await resolveSymbolToKey(symbol);
  }

  if (!instrumentKey) {
    yield {
      section: "error",
      content: `Could not find instrument key for "${symbol}". Please check the symbol name.`,
    };
    return;
  }

  // Step 1: Fetch core data in parallel (quote + history + fundamentals)
  yield { section: "status", content: "Fetching market data & fundamentals..." };

  let [quoteResult, historyResult, fundamentalsResult] =
    await Promise.allSettled([
      getFullQuote(client, instrumentKey),
      getHistoricalOHLC(client, instrumentKey, "day", 90),
      getUpstoxFundamentals(client, instrumentKey, symbol),
    ]);

  // If quote returns empty data, the static instrument key may be stale — retry with dynamic resolver
  const quoteVal = quoteResult.status === "fulfilled" ? quoteResult.value : null;
  const quoteIsEmpty = quoteVal && Object.keys(quoteVal?.data || {}).length === 0;
  if (quoteIsEmpty) {
    const dynamicKey = await resolveSymbolToKey(symbol);
    if (dynamicKey && dynamicKey !== instrumentKey) {
      console.log(`[Analyzer] Static key stale for ${symbol}, using dynamic: ${dynamicKey}`);
      instrumentKey = dynamicKey;
      [quoteResult, historyResult, fundamentalsResult] = await Promise.allSettled([
        getFullQuote(client, instrumentKey),
        getHistoricalOHLC(client, instrumentKey, "day", 90),
        getUpstoxFundamentals(client, instrumentKey, symbol),
      ]);
    }
  }

  const quoteData =
    quoteResult.status === "fulfilled" ? quoteResult.value : null;
  const historyData =
    historyResult.status === "fulfilled" ? historyResult.value : null;
  let fundamentalsData =
    fundamentalsResult.status === "fulfilled" ? fundamentalsResult.value : null;

  // Fallback to Screener.in if Upstox fundamentals unavailable
  if (!fundamentalsData) {
    yield { section: "status", content: "Fetching fundamentals from backup source..." };
    try {
      fundamentalsData = await getScreenerData(symbol);
    } catch {
      // Continue without fundamentals
    }
  }

  // Step 2: Fetch crisis prices + competitors in parallel
  yield { section: "status", content: "Fetching crisis & peer data..." };

  const isin = extractISIN(instrumentKey);
  const [crisisPricesResult, competitorsResult] = await Promise.allSettled([
    fetchCrisisPrices(client, instrumentKey, symbol),
    isin ? client.getCompetitors(isin) : Promise.resolve(null),
  ]);

  const stockCrisisData =
    crisisPricesResult.status === "fulfilled" ? crisisPricesResult.value : undefined;
  const competitorsRaw =
    competitorsResult.status === "fulfilled" ? competitorsResult.value : null;
  const competitorsData = competitorsRaw?.data || undefined;

  // Step 3: Get Nifty crisis reference context
  const crisisContext = getCrisisContext(symbol);

  // Step 4: Build prompt
  yield { section: "status", content: "Running AI analysis..." };

  const userPrompt = buildUserPrompt(
    symbol,
    quoteData?.data,
    historyData,
    crisisContext,
    fundamentalsData,
    stockCrisisData,
    competitorsData
  );

  // Step 5: Stream AI response
  yield { section: "status", content: "Generating report..." };

  for await (const text of streamAnalysis(SYSTEM_PROMPT, userPrompt)) {
    yield { section: "analysis", content: text };
  }

  yield { section: "complete", content: "Analysis complete" };
}
