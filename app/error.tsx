"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[var(--bg-primary)]">
      <div className="p-4 rounded-2xl bg-rose-500/10 mb-6">
        <AlertCircle className="w-10 h-10 text-rose-400" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md">
        An unexpected error occurred. This has been logged for investigation.
      </p>
      {error.message && (
        <p className="text-xs text-[var(--text-muted)] mb-6 font-mono-numbers bg-white/5 px-3 py-2 rounded-lg max-w-md truncate">
          {error.message}
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-[var(--text-secondary)] text-sm hover:bg-white/10 transition-colors"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
