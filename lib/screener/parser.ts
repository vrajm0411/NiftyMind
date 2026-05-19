import type { ScreenerData } from "./types";

/**
 * Extract a numeric value from screener.in "top ratios" list.
 * Screener renders these as:
 *   <li class="flex ..."><span class="name">Market Cap</span><span class="...">₹ 7,50,000 Cr.</span></li>
 * or in the condensed "ratios-list" format:
 *   <li ...>Market Cap ...</li> with the number nearby.
 */
function extractTopRatio(html: string, label: string): number | null {
  // Pattern 1: <span class="name">Label</span> ... <span ...>number</span>
  const p1 = new RegExp(
    `${label}[^<]*</span>\\s*<span[^>]*>\\s*(?:₹\\s*)?([\\d,]+\\.?\\d*)`,
    "i"
  );
  // Pattern 2: Label ... <b>number</b> or <span ...number>
  const p2 = new RegExp(
    `${label}[\\s\\S]{0,200}?(?:<b>|<span[^>]*>)\\s*(?:₹\\s*)?([\\d,]+\\.?\\d*)`,
    "i"
  );
  // Pattern 3: Broader — label followed by a number within 300 chars
  const p3 = new RegExp(
    `${label}[\\s\\S]{0,300}?([\\d,]+\\.?\\d*)\\s*(?:Cr|%|</|\\s)`,
    "i"
  );

  for (const pattern of [p1, p2, p3]) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const num = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(num)) return num;
    }
  }
  return null;
}

/**
 * Extract the latest annual row from P&L section.
 * Screener tables have headers like: Sales, Expenses, Operating Profit, OPM %, Net Profit, EPS
 * The last column in each row is the TTM or latest year.
 */
function extractLastColumnValue(
  html: string,
  rowLabel: string
): number | null {
  // Find the row containing the label, then grab all numbers from <td> cells
  const rowRegex = new RegExp(
    `<td[^>]*>\\s*${rowLabel}[\\s\\S]{0,2000}?</tr>`,
    "i"
  );
  const rowMatch = html.match(rowRegex);
  if (!rowMatch) return null;

  const row = rowMatch[0];
  const numbers: number[] = [];
  const cellRegex = /<td[^>]*>\s*(?:₹\s*)?([\d,]+\.?\d*)\s*(?:%?)\s*<\/td>/gi;
  let cellMatch;
  while ((cellMatch = cellRegex.exec(row)) !== null) {
    const num = parseFloat(cellMatch[1].replace(/,/g, ""));
    if (!isNaN(num)) numbers.push(num);
  }

  // Return the last number (most recent period / TTM)
  return numbers.length > 0 ? numbers[numbers.length - 1] : null;
}

/**
 * Extract compounded growth rates from the "Compounded Growth" section.
 * Screener shows "Compounded Sales Growth" and "Compounded Profit Growth"
 * with 3yr, 5yr, 10yr, TTM columns.
 */
function extractCAGR(html: string, label: string): number | null {
  const regex = new RegExp(
    `${label}[\\s\\S]{0,500}?3[\\s-]*(?:Years?|Yr)[\\s\\S]{0,100}?(\\d+\\.?\\d*)\\s*%`,
    "i"
  );
  const match = html.match(regex);
  if (match?.[1]) {
    const num = parseFloat(match[1]);
    if (!isNaN(num)) return num;
  }
  return null;
}

export function parseScreenerHTML(
  html: string,
  symbol: string
): ScreenerData {
  return {
    symbol,
    marketCap: extractTopRatio(html, "Market Cap"),
    peRatio: extractTopRatio(html, "Stock P/E") ?? extractTopRatio(html, "P/E"),
    roe: extractTopRatio(html, "ROE"),
    roce: extractTopRatio(html, "ROCE"),
    bookValue: extractTopRatio(html, "Book Value"),
    dividendYield: extractTopRatio(html, "Dividend Yield"),
    revenue: extractLastColumnValue(html, "Sales"),
    netProfit: extractLastColumnValue(html, "Net Profit"),
    opm: extractLastColumnValue(html, "OPM"),
    eps: extractLastColumnValue(html, "EPS"),
    debtToEquity: extractTopRatio(html, "Debt to equity") ?? extractTopRatio(html, "Debt/Eq"),
    revenueCagr3yr: extractCAGR(html, "Compounded Sales Growth"),
    profitCagr3yr: extractCAGR(html, "Compounded Profit Growth"),
    fetchedAt: Date.now(),
    source: "screener",
  };
}
