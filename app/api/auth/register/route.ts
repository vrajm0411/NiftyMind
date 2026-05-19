import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { verifyTurnstileToken } from "@/lib/auth/turnstile";

export async function POST(request: NextRequest) {
  try {
    const { name, email, mobile, password, upstoxApiKey, upstoxApiSecret, turnstileToken } =
      await request.json();

    if (!name || !email || !password || !mobile) {
      return NextResponse.json(
        { error: "Name, email, mobile, and password are required" },
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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        passwordHash,
        upstoxApiKey: upstoxApiKey || null,
        upstoxApiSecret: upstoxApiSecret || null,
      },
    });

    const jwt = await signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      success: true,
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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
