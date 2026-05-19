import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { UpstoxClient } from "@/lib/upstox/client";
import { getHoldings, computePortfolioMetrics } from "@/lib/upstox/portfolio";

export async function GET() {
  const session = await getSession();
  if (!session || !session.upstoxTokenValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = new UpstoxClient(session.token);
    const holdings = await getHoldings(client);
    const metrics = computePortfolioMetrics(holdings);
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
