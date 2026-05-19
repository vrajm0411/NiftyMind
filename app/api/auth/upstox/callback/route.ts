import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/upstox/auth";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/access-token?error=no_code", request.url)
    );
  }

  // Get user from JWT cookie
  const jwtCookie = request.cookies.get("session_token")?.value;
  if (!jwtCookie) {
    return NextResponse.redirect(
      new URL("/login?error=not_logged_in", request.url)
    );
  }

  const payload = await verifyToken(jwtCookie);
  if (!payload) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_session", request.url)
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { upstoxApiKey: true, upstoxApiSecret: true },
  });

  if (!user?.upstoxApiKey || !user?.upstoxApiSecret) {
    return NextResponse.redirect(
      new URL("/access-token?error=no_api_keys", request.url)
    );
  }

  try {
    const tokenData = await exchangeCodeForToken(
      code,
      user.upstoxApiKey,
      user.upstoxApiSecret
    );

    // Store token in database
    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        upstoxAccessToken: tokenData.access_token,
        upstoxTokenSetAt: new Date(),
      },
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Upstox auth callback error:", error);
    return NextResponse.redirect(
      new URL("/access-token?error=auth_failed", request.url)
    );
  }
}
