import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INR_COMPACT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    // Use lakhs/crores for Indian numbering
    if (Math.abs(value) >= 1e7) {
      return `₹${(value / 1e7).toFixed(1)}Cr`;
    }
    if (Math.abs(value) >= 1e5) {
      return `₹${(value / 1e5).toFixed(1)}L`;
    }
    return INR_COMPACT.format(value);
  }
  return INR.format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatVolume(value: number): string {
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)}Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)}L`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}

export function getChangeColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-rose-400";
  return "text-slate-400";
}

export function getChangeBg(value: number): string {
  if (value > 0) return "bg-emerald-500/10 text-emerald-400";
  if (value < 0) return "bg-rose-500/10 text-rose-400";
  return "bg-slate-500/10 text-slate-400";
}

export function isMarketOpen(): boolean {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = ist.getDay();
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const time = hours * 60 + minutes;

  // Mon-Fri, 9:15 AM - 3:30 PM IST
  if (day === 0 || day === 6) return false;
  return time >= 555 && time <= 930; // 9:15 = 555, 15:30 = 930
}
