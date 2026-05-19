import { env } from "@/lib/env";

export class UpstoxClient {
  private baseUrl: string;
  private token: string;
  private maxRetries = 3;

  constructor(token: string) {
    this.baseUrl = env.upstoxBaseUrl;
    this.token = token;
  }

  private async fetch<T>(
    endpoint: string,
    options?: RequestInit,
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (res.status === 429 && retryCount < this.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetch<T>(endpoint, options, retryCount + 1);
      }

      if (res.status === 401) {
        throw new UpstoxAuthError("Token expired or invalid");
      }

      if (!res.ok) {
        const body = await res.text();
        throw new UpstoxApiError(
          `Upstox API error ${res.status}: ${body}`,
          res.status
        );
      }

      return res.json();
    } catch (error) {
      if (error instanceof UpstoxAuthError || error instanceof UpstoxApiError) {
        throw error;
      }
      throw new UpstoxApiError(`Network error: ${(error as Error).message}`, 0);
    }
  }

  async getQuote(instrumentKey: string) {
    return this.fetch<any>(
      `/market-quote/quotes?instrument_key=${encodeURIComponent(instrumentKey)}`
    );
  }

  async getLTP(instrumentKey: string) {
    return this.fetch<any>(
      `/market-quote/ltp?instrument_key=${encodeURIComponent(instrumentKey)}`
    );
  }

  async getHistoricalCandles(
    instrumentKey: string,
    interval: "1minute" | "30minute" | "day" | "week" | "month",
    fromDate: string,
    toDate: string
  ) {
    return this.fetch<any>(
      `/historical-candle/${encodeURIComponent(instrumentKey)}/${interval}/${toDate}/${fromDate}`
    );
  }

  async getIntradayCandles(
    instrumentKey: string,
    interval: "1minute" | "30minute"
  ) {
    return this.fetch<any>(
      `/historical-candle/intraday/${encodeURIComponent(instrumentKey)}/${interval}`
    );
  }

  async getHoldings() {
    return this.fetch<any>("/portfolio/long-term-holdings");
  }

  async getPositions() {
    return this.fetch<any>("/portfolio/short-term-positions");
  }

  async getMarketStatus() {
    return this.fetch<any>("/market/status/NSE");
  }

  async getProfile() {
    return this.fetch<any>("/user/profile");
  }

  // ── Company Fundamentals (May 2026 API) ──

  async getKeyRatios(isin: string) {
    return this.fetch<any>(`/fundamentals/${encodeURIComponent(isin)}/key-ratios`);
  }

  async getCompanyProfile(isin: string) {
    return this.fetch<any>(`/fundamentals/${encodeURIComponent(isin)}/profile`);
  }

  async getIncomeStatement(
    isin: string,
    type: "consolidated" | "standalone" = "consolidated",
    timePeriod: "yearly" | "quarterly" = "yearly"
  ) {
    return this.fetch<any>(
      `/fundamentals/${encodeURIComponent(isin)}/income-statement?type=${type}&time_period=${timePeriod}`
    );
  }

  async getBalanceSheet(
    isin: string,
    type: "consolidated" | "standalone" = "consolidated",
    timePeriod: "yearly" | "quarterly" = "yearly"
  ) {
    return this.fetch<any>(
      `/fundamentals/${encodeURIComponent(isin)}/balance-sheet?type=${type}&time_period=${timePeriod}`
    );
  }

  async getCompetitors(isin: string) {
    return this.fetch<any>(`/fundamentals/${encodeURIComponent(isin)}/competitors`);
  }
}

export class UpstoxAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpstoxAuthError";
  }
}

export class UpstoxApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "UpstoxApiError";
    this.status = status;
  }
}
