import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: "access_token is required" },
        { status: 400 }
      );
    }

    // Verify the token works by calling Upstox profile API
    const profileRes = await fetch("https://api.upstox.com/v2/user/profile", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
      },
    });

    if (!profileRes.ok) {
      return NextResponse.json(
        { error: "Invalid Upstox access token" },
        { status: 400 }
      );
    }

    // Store the verified token in the database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        upstoxAccessToken: access_token,
        upstoxTokenSetAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token save error:", error);
    return NextResponse.json(
      { error: "Failed to save token" },
      { status: 500 }
    );
  }
}
