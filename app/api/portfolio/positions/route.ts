import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { UpstoxClient } from "@/lib/upstox/client";
import { getPositions } from "@/lib/upstox/portfolio";

export async function GET() {
  const session = await getSession();
  if (!session || !session.upstoxTokenValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = new UpstoxClient(session.token);
    const positions = await getPositions(client);
    return NextResponse.json({ positions });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
