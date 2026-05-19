interface CacheEntry {
  data: unknown;
  expiry: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry>();

  get(key: string): unknown | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: unknown, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    this.store.forEach((entry, key) => {
      if (now > entry.expiry) {
        this.store.delete(key);
      }
    });
  }

  get size(): number {
    return this.store.size;
  }
}

// Singleton cache instance
export const cache = new MemoryCache();

// TTL presets in seconds
export const TTL = {
  QUOTE: 60,
  LTP: 10,
  OHLC: 300,
  NEWS: 1800,
  FILINGS: 86400,
  ANALYSIS: 900,
  PORTFOLIO: 30,
  INSTRUMENTS: 3600,
  SCREENER: 3600,
} as const;

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => cache.cleanup(), 5 * 60 * 1000);
}
