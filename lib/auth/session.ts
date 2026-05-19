import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import { prisma } from "@/lib/db/prisma";

export interface Session {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    mobile: string;
  };
  upstoxTokenValid: boolean;
}

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const jwtCookie = cookieStore.get("session_token")?.value;

  if (!jwtCookie) return null;

  const payload = await verifyToken(jwtCookie);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) return null;

  const upstoxTokenValid =
    !!user.upstoxAccessToken &&
    !!user.upstoxTokenSetAt &&
    Date.now() - user.upstoxTokenSetAt.getTime() < TOKEN_MAX_AGE_MS;

  return {
    token: user.upstoxAccessToken || "",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      mobile: user.mobile,
    },
    upstoxTokenValid,
  };
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new AuthRequiredError();
  }
  return session;
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}
