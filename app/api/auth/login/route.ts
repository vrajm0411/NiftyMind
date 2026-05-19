import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { verifyTurnstileToken } from "@/lib/auth/turnstile";

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: NextRequest) {
  try {
    const { email, password, turnstileToken } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Verify Cloudflare Turnstile
    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Security verification required" },
        { status: 400 }
      );
    }
    const turnstileValid = await verifyTurnstileToken(turnstileToken);
    if (!turnstileValid) {
      return NextResponse.json(
        { error: "Security verification failed. Please try again." },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const jwt = await signToken({ userId: user.id, email: user.email });

    const hasValidUpstoxToken =
      !!user.upstoxAccessToken &&
      !!user.upstoxTokenSetAt &&
      Date.now() - user.upstoxTokenSetAt.getTime() < TOKEN_MAX_AGE_MS;

    const response = NextResponse.json({
      success: true,
      hasValidUpstoxToken,
      user: { id: user.id, name: user.name, email: user.email },
    });

    response.cookies.set("session_token", jwt, {
      httpOnly: true,
      secure: process.env.USE_HTTPS === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
