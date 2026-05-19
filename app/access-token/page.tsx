"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Loader2,
  AlertCircle,
  CheckCircle,
  Key,
  ExternalLink,
} from "lucide-react";

export default function AccessTokenPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [upstoxLoginUrl, setUpstoxLoginUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/upstox-login-url")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.url) setUpstoxLoginUrl(data.url);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Invalid token");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Connection failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyan-400" />
          <span className="text-lg font-semibold gradient-text">
            NiftyMind
          </span>
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <Key className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Connect Upstox</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Paste your daily Upstox access token to access live market data
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
            {upstoxLoginUrl && (
              <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-xs text-[var(--text-secondary)] mb-2">
                  Log in to Upstox to generate your daily access token:
                </p>
                <a
                  href={upstoxLoginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:underline"
                >
                  Open Upstox Login
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                <Key className="w-3.5 h-3.5" />
                Access Token
              </label>
              <textarea
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="Paste your Upstox access token here..."
                required
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/40 transition-colors resize-none font-mono"
              />
            </div>

            {status === "success" && (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                Token verified! Redirecting to dashboard...
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 text-sm text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={!token.trim() || status === "loading" || status === "success"}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-shadow"
            >
              {status === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Verify & Connect"
              )}
            </button>

            <div className="border-t border-[var(--border-subtle)] pt-3">
              <p className="text-xs text-[var(--text-muted)]">
                Upstox access tokens expire every 24 hours. You&apos;ll need to
                enter a new token each trading day.
              </p>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
