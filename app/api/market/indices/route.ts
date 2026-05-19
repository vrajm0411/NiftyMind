import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { UpstoxClient } from "@/lib/upstox/client";
import { getFullQuote } from "@/lib/upstox/market-data";

const INDEX_KEYS = {
  "Nifty 50": "NSE_INDEX|Nifty 50",
  "Sensex": "BSE_INDEX|SENSEX",
  "Bank Nifty": "NSE_INDEX|Nifty Bank",
  "Nifty IT": "NSE_INDEX|Nifty IT",
};

export async function GET() {
  const session = await getSession();
  if (!session || !session.upstoxTokenValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = new UpstoxClient(session.token);
    const results = await Promise.allSettled(
      Object.entries(INDEX_KEYS).map(async ([name, key]) => {
        const data = await getFullQuote(client, key);
        return { name, data };
      })
    );

    const indices = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    return NextResponse.json({ indices });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
