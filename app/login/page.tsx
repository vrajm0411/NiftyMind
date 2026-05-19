"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Loader2, AlertCircle, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (status === "error") setStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken: "bypass" }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.hasValidUpstoxToken) {
          router.push("/dashboard");
        } else {
          router.push("/access-token");
        }
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Login failed");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Connection failed. Please try again.");
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/40 transition-colors";

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
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Sign in to your NiftyMind account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                <Mail className="w-3.5 h-3.5" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                <Lock className="w-3.5 h-3.5" />
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                required
                className={inputClass}
              />
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 text-sm text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-shadow"
            >
              {status === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Sign In"
              )}
            </button>

            <p className="text-center text-sm text-[var(--text-secondary)]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-cyan-400 hover:underline"
              >
                Create one
              </Link>
            </p>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
