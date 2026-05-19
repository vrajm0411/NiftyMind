import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAuthorizeUrl } from "@/lib/upstox/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { upstoxApiKey: true },
  });

  if (!user?.upstoxApiKey) {
    return NextResponse.json(
      { error: "No Upstox API key configured. Update your profile in Settings." },
      { status: 400 }
    );
  }

  const url = getAuthorizeUrl(user.upstoxApiKey);
  return NextResponse.json({ url });
}
