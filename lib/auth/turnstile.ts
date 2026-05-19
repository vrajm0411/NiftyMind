const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify a Cloudflare Turnstile token server-side.
 * Returns true if valid, false otherwise.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) {
    // No secret key configured — skip server-side verification
    // Client-side widget still provides bot protection
    console.warn("[Turnstile] No secret key configured — skipping server verification");
    return true;
  }

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });

    const data: TurnstileVerifyResponse = await res.json();
    return data.success;
  } catch (error) {
    console.error("[Turnstile] Verification failed:", error);
    return false;
  }
}
