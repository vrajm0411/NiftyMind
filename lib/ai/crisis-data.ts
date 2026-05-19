import type { CrisisEvent } from "./types";

export interface CrisisHistoricalEvent {
  name: string;
  date: string;
  dayBeforePrice: number;
  change3M: number | null;
  change6M: number | null;
  change1Y: number | null;
  description: string;
}

/** Nifty 50 index performance around major crisis events */
export const CRISIS_HISTORICAL_EVENTS: CrisisHistoricalEvent[] = [
  {
    name: "Demonetization in India",
    date: "Nov 8, 2016",
    dayBeforePrice: 8541,
    change3M: +2.6,
    change6M: +9.1,
    change1Y: +20.7,
    description: "PM Modi banned ₹500 & ₹1000 notes overnight — 86% of currency invalidated.",
  },
  {
    name: "US-China Trade War",
    date: "Jul 6, 2018",
    dayBeforePrice: 10714,
    change3M: -4.2,
    change6M: -0.4,
    change1Y: +7.3,
    description: "US imposed 25% tariffs on $34B of Chinese goods, China retaliated same day.",
  },
  {
    name: "COVID-19 Pandemic",
    date: "Mar 1, 2020",
    dayBeforePrice: 11202,
    change3M: -14.5,
    change6M: -1.3,
    change1Y: +29.7,
    description: "Global lockdowns triggered fastest 40% crash in history. Nifty bottom: 7,511.",
  },
  {
    name: "Russia-Ukraine War",
    date: "Feb 24, 2022",
    dayBeforePrice: 17225,
    change3M: -5.7,
    change6M: +1.9,
    change1Y: +1.0,
    description: "Russia invaded Ukraine — oil spiked, inflation fears hammered global markets.",
  },
  {
    name: "Adani-Hindenburg Crisis",
    date: "Jan 24, 2023",
    dayBeforePrice: 18118,
    change3M: -2.1,
    change6M: +9.0,
    change1Y: +17.2,
    description: "Hindenburg short-seller report wiped $150B from Adani Group market cap.",
  },
  {
    name: "US Tariff Shock",
    date: "Feb 1, 2025",
    dayBeforePrice: 23508,
    change3M: +2.1,
    change6M: +2.9,
    change1Y: +7.2,
    description: "Trump announced sweeping tariff hikes on multiple countries including India.",
  },
  {
    name: "US-Iran War",
    date: "Feb 28, 2026",
    dayBeforePrice: 25497,
    change3M: null,
    change6M: null,
    change1Y: null,
    description: "US-Israel launched coordinated strikes on Iran — Strait of Hormuz closed.",
  },
];

export const CRISIS_EVENTS: CrisisEvent[] = [
  {
    name: "COVID-19 Crash",
    period: "Feb-Mar 2020",
    niftyDrawdown: -38.2,
    description: "Global pandemic lockdowns crashed markets worldwide. Nifty fell from 12,430 to 7,511.",
  },
  {
    name: "Demonetization",
    period: "Nov 2016",
    niftyDrawdown: -8.5,
    description: "India banned 86% of currency notes overnight, disrupting cash-dependent sectors.",
  },
  {
    name: "IL&FS Crisis",
    period: "Sep 2018",
    niftyDrawdown: -16.4,
    description: "IL&FS debt default triggered NBFC liquidity crisis across Indian financial sector.",
  },
  {
    name: "Global Financial Crisis",
    period: "Jan 2008 - Mar 2009",
    niftyDrawdown: -59.9,
    description: "US subprime mortgage crisis led to global market collapse. Nifty fell from 6,274 to 2,524.",
  },
  {
    name: "Russia-Ukraine War",
    period: "Feb-Mar 2022",
    niftyDrawdown: -13.4,
    description: "Geopolitical crisis drove oil prices up, inflation concerns hit markets.",
  },
  {
    name: "Rate Hike Cycle",
    period: "May 2022 - Dec 2023",
    niftyDrawdown: -17.2,
    description: "RBI aggressive rate hikes to combat inflation led to sustained market pressure.",
  },
  {
    name: "Chinese Market Contagion",
    period: "Aug 2015",
    niftyDrawdown: -11.3,
    description: "Chinese stock market crash and yuan devaluation caused global EM selling.",
  },
];

// Sector sensitivity to different crisis types
const SECTOR_SENSITIVITY: Record<string, Record<string, number>> = {
  IT: { covid: 0.6, demonetization: 0.2, financial: 0.4, geopolitical: 0.3 },
  BANKING: { covid: 0.8, demonetization: 0.9, financial: 0.95, geopolitical: 0.5 },
  PHARMA: { covid: 0.3, demonetization: 0.4, financial: 0.3, geopolitical: 0.3 },
  AUTO: { covid: 0.85, demonetization: 0.7, financial: 0.6, geopolitical: 0.6 },
  FMCG: { covid: 0.4, demonetization: 0.6, financial: 0.3, geopolitical: 0.25 },
  ENERGY: { covid: 0.7, demonetization: 0.3, financial: 0.5, geopolitical: 0.9 },
  METALS: { covid: 0.75, demonetization: 0.3, financial: 0.7, geopolitical: 0.8 },
  REALTY: { covid: 0.9, demonetization: 0.85, financial: 0.8, geopolitical: 0.4 },
};

// Map top symbols to sectors
const SYMBOL_SECTOR: Record<string, string> = {
  TCS: "IT", INFY: "IT", WIPRO: "IT", HCLTECH: "IT", TECHM: "IT",
  HDFCBANK: "BANKING", ICICIBANK: "BANKING", SBIN: "BANKING", KOTAKBANK: "BANKING",
  AXISBANK: "BANKING", BAJFINANCE: "BANKING", INDUSINDBK: "BANKING",
  SUNPHARMA: "PHARMA", DRREDDY: "PHARMA", CIPLA: "PHARMA", DIVISLAB: "PHARMA",
  TATAMOTORS: "AUTO", MARUTI: "AUTO", BAJAJ_AUTO: "AUTO", HEROMOTOCO: "AUTO", EICHERMOT: "AUTO",
  HINDUNILVR: "FMCG", ITC: "FMCG", NESTLEIND: "FMCG", BRITANNIA: "FMCG", DABUR: "FMCG",
  RELIANCE: "ENERGY", ONGC: "ENERGY", BPCL: "ENERGY", IOC: "ENERGY",
  TATASTEEL: "METALS", JSWSTEEL: "METALS", HINDALCO: "METALS", VEDL: "METALS",
  ADANIENT: "ENERGY", ADANIPORTS: "ENERGY", ADANIGREEN: "ENERGY",
};

export function getCrisisContext(symbol: string) {
  const sector = SYMBOL_SECTOR[symbol.toUpperCase()] || "FMCG";
  const sensitivity = SECTOR_SENSITIVITY[sector] || SECTOR_SENSITIVITY.FMCG;

  return {
    sector,
    crisisEvents: CRISIS_EVENTS.map((event) => ({
      ...event,
      estimatedImpact: event.niftyDrawdown * (
        event.name.includes("COVID") ? sensitivity.covid :
        event.name.includes("Demonetization") ? sensitivity.demonetization :
        event.name.includes("Financial") || event.name.includes("IL&FS") ? sensitivity.financial :
        sensitivity.geopolitical
      ),
    })),
    sectorSensitivity: sensitivity,
  };
}
