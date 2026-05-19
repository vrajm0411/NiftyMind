export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function getEnvOptional(key: string, fallback?: string): string {
  return process.env[key] ?? fallback ?? "";
}

export const env = {
  get databaseUrl() {
    return getEnv("DATABASE_URL");
  },
  get jwtSecret() {
    return getEnv("JWT_SECRET");
  },
  get upstoxApiKey() {
    return getEnvOptional("UPSTOX_API_KEY");
  },
  get upstoxApiSecret() {
    return getEnvOptional("UPSTOX_API_SECRET");
  },
  get upstoxRedirectUri() {
    return getEnv("UPSTOX_REDIRECT_URI", "http://localhost:3000/api/auth/upstox/callback");
  },
  get upstoxBaseUrl() {
    return getEnv("UPSTOX_BASE_URL", "https://api.upstox.com/v2");
  },
  get groqApiKey() {
    return getEnv("GROQ_API_KEY");
  },
  get nextAuthSecret() {
    return getEnv("NEXTAUTH_SECRET", "niftymind-dev-secret-change-in-production");
  },
  get apifyApiToken() {
    return getEnvOptional("APIFY_API_TOKEN");
  },
};
