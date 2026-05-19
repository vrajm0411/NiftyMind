import { env } from "@/lib/env";
import type { UpstoxToken } from "./types";

const UPSTOX_AUTH_URL =
  "https://api.upstox.com/v2/login/authorization/dialog";
const UPSTOX_TOKEN_URL =
  "https://api.upstox.com/v2/login/authorization/token";

export function getAuthorizeUrl(clientId: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: env.upstoxRedirectUri,
  });
  return `${UPSTOX_AUTH_URL}?${params}`;
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<UpstoxToken> {
  const response = await fetch(UPSTOX_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: env.upstoxRedirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${body}`);
  }

  return response.json();
}

export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt;
}
