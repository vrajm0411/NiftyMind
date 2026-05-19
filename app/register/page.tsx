"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Lock,
  Key,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    upstoxApiKey: "",
    upstoxApiSecret: "",
  });
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken: "bypass" }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/access-token");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Registration failed");
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
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Create your account</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Start analyzing stocks with AI-powered insights
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                <User className="w-3.5 h-3.5" />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className={inputClass}
              />
            </div>

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
                <Phone className="w-3.5 h-3.5" />
                Mobile
              </label>
              <input
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="+91 9876543210"
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
                placeholder="Min 8 characters"
                required
                minLength={8}
                className={inputClass}
              />
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-4">
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Upstox API credentials (get from{" "}
                <a
                  href="https://account.upstox.com/developer/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  Upstox Developer Portal
                </a>
                )
              </p>

              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Upstox API Key
                  </label>
                  <input
                    type="text"
                    name="upstoxApiKey"
                    value={form.upstoxApiKey}
                    onChange={handleChange}
                    placeholder="Your Upstox API key"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Upstox API Secret
                  </label>
                  <input
                    type="password"
                    name="upstoxApiSecret"
                    value={form.upstoxApiSecret}
                    onChange={handleChange}
                    placeholder="Your Upstox API secret"
                    className={inputClass}
                  />
                </div>
              </div>
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
                "Create Account"
              )}
            </button>

            <p className="text-center text-sm text-[var(--text-secondary)]">
              Already have an account?{" "}
              <Link href="/login" className="text-cyan-400 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
