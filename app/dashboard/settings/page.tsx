"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Link2Off, Key, Trash2, Loader2, CheckCircle, AlertCircle, User } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { cache } from "@/lib/cache/redis";

export default function SettingsPage() {
  const router = useRouter();
  const { user, upstoxTokenValid, loading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [token, setToken] = useState("");
  const [tokenStatus, setTokenStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [tokenError, setTokenError] = useState("");

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast("Logged out successfully", "success");
      router.push("/login");
    } catch {
      toast("Failed to logout", "error");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSubmitToken = async () => {
    if (!token.trim()) return;

    setTokenStatus("loading");
    setTokenError("");

    try {
      const res = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTokenStatus("success");
        toast("Upstox token updated!", "success");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setTokenStatus("error");
        setTokenError(data.error || "Invalid token");
      }
    } catch {
      setTokenStatus("error");
      setTokenError("Connection failed. Please try again.");
    }
  };

  const handleClearCache = () => {
    cache.clear();
    toast("Cache cleared", "success");
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[var(--text-muted)]/10">
          <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage your account and connections
          </p>
        </div>
      </div>

      {/* User Profile */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-[var(--text-muted)]" />
          <h3 className="text-sm font-medium">Profile</h3>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading...</p>
        ) : user ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white/5 space-y-1">
              {user.name && (
                <p className="text-sm">
                  <span className="text-[var(--text-muted)]">Name: </span>
                  {user.name}
                </p>
              )}
              {user.email && (
                <p className="text-sm">
                  <span className="text-[var(--text-muted)]">Email: </span>
                  {user.email}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 text-sm hover:bg-rose-500/20 transition-colors disabled:opacity-50"
            >
              <Link2Off className="w-4 h-4" />
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        ) : null}
      </GlassCard>

      {/* Upstox Token */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[var(--text-muted)]" />
            <h3 className="text-sm font-medium">Upstox Access Token</h3>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                upstoxTokenValid ? "bg-emerald-400" : "bg-rose-400"
              )}
            />
            <span className="text-xs text-[var(--text-secondary)]">
              {loading ? "Checking..." : upstoxTokenValid ? "Valid" : "Expired / Not set"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {upstoxTokenValid
              ? "Your Upstox token is active. Renew it below when it expires (every 24 hours)."
              : "Enter a new Upstox access token to connect to live market data."}
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={token}
              onChange={(e) => { setToken(e.target.value); setTokenStatus("idle"); }}
              placeholder="Paste new access token..."
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/40 transition-colors"
            />
            <button
              onClick={handleSubmitToken}
              disabled={!token.trim() || tokenStatus === "loading"}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-shadow"
            >
              {tokenStatus === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Update"
              )}
            </button>
          </div>

          {tokenStatus === "success" && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              Token updated! Refreshing...
            </div>
          )}
          {tokenStatus === "error" && (
            <div className="flex items-center gap-2 text-sm text-rose-400">
              <AlertCircle className="w-4 h-4" />
              {tokenError}
            </div>
          )}

          <p className="text-xs text-[var(--text-muted)]">
            Get your token from{" "}
            <a
              href="https://account.upstox.com/developer/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              Upstox Developer Portal
            </a>
            . Tokens are valid for 24 hours.
          </p>
        </div>
      </GlassCard>

      {/* Cache Controls */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-4 h-4 text-[var(--text-muted)]" />
          <h3 className="text-sm font-medium">Cache</h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Market data is cached in-memory to reduce API calls. Clear the cache
          to force fresh data on next request.
        </p>
        <button
          onClick={handleClearCache}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-sm text-[var(--text-secondary)] hover:bg-white/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Cache
        </button>
      </GlassCard>
    </div>
  );
}
