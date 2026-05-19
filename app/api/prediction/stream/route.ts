import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { runPrediction } from "@/lib/ai/prediction-analyzer";
import type { Horizon } from "@/lib/ai/prediction-types";

export const dynamic = "force-dynamic";

const VALID_HORIZONS: Horizon[] = [
  "Intraday",
  "Short-term (1–7 days)",
  "Medium-term (1–4 weeks)",
];

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.upstoxTokenValid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { symbol, horizon, userMode } = await request.json();
  if (!symbol) {
    return new Response(JSON.stringify({ error: "Symbol required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validHorizon: Horizon = VALID_HORIZONS.includes(horizon)
    ? horizon
    : "Short-term (1–7 days)";

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  (async () => {
    try {
      for await (const chunk of runPrediction(
        symbol,
        session.token,
        validHorizon,
        userMode === "professional" ? "professional" : "retail"
      )) {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
        );
      }
    } catch (error) {
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            section: "error",
            content: (error as Error).message,
          })}\n\n`
        )
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
