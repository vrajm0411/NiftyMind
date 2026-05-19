import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete("session_token");
  cookieStore.delete("upstox_token");
  cookieStore.delete("upstox_user");

  return NextResponse.json({ success: true });
}

export async function GET() {
  const cookieStore = cookies();
  cookieStore.delete("session_token");
  cookieStore.delete("upstox_token");
  cookieStore.delete("upstox_user");

  return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}
