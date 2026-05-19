import { UpstoxClient } from "./client";
import { cache } from "@/lib/cache/redis";
import type { Holding, Position, PortfolioMetrics } from "./types";

export async function getHoldings(client: UpstoxClient): Promise<Holding[]> {
  const cacheKey = "portfolio:holdings";
  const cached = cache.get(cacheKey);
  if (cached) return cached as Holding[];

  const response = await client.getHoldings();
  const holdings: Holding[] = response?.data || [];
  cache.set(cacheKey, holdings, 30);
  return holdings;
}

export async function getPositions(client: UpstoxClient): Promise<Position[]> {
  const cacheKey = "portfolio:positions";
  const cached = cache.get(cacheKey);
  if (cached) return cached as Position[];

  const response = await client.getPositions();
  const positions: Position[] = response?.data || [];
  cache.set(cacheKey, positions, 30);
  return positions;
}

export function computePortfolioMetrics(holdings: Holding[]): PortfolioMetrics {
  let totalInvestment = 0;
  let currentValue = 0;
  let dayPnl = 0;

  for (const h of holdings) {
    const invested = h.average_price * h.quantity;
    const current = (h.last_price || h.average_price) * h.quantity;
    totalInvestment += invested;
    currentValue += current;
    dayPnl += (h.day_change || 0) * h.quantity;
  }

  const totalPnl = currentValue - totalInvestment;
  const totalPnlPercent =
    totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;
  const dayPnlPercent =
    currentValue > 0 ? (dayPnl / (currentValue - dayPnl)) * 100 : 0;

  return {
    totalInvestment,
    currentValue,
    totalPnl,
    totalPnlPercent,
    dayPnl,
    dayPnlPercent,
    holdings,
  };
}
