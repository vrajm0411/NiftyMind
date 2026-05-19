"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { QUICK_PICKS } from "@/lib/upstox/instruments";
import { useStockStore } from "@/hooks/use-stock";

interface SearchResult {
  symbol: string;
  instrumentKey: string;
  name: string;
}

interface StockSearchProps {
  onSelect?: (symbol: string) => void;
  className?: string;
}

export function StockSearch({ onSelect, className }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { setSelectedStock, recentSearches, addRecentSearch } = useStockStore();

  const handleSelect = useCallback(
    (symbol: string) => {
      setSelectedStock(symbol);
      addRecentSearch(symbol);
      setQuery(symbol);
      setOpen(false);
      onSelect?.(symbol);
    },
    [setSelectedStock, addRecentSearch, onSelect]
  );

  const handleSearch = useCallback((q: string) => {
    setQuery(q);

    if (q.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }

    setOpen(true);
    setSearching(true);

    // Debounce API calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && query.trim()) {
        const symbol = query.trim().toUpperCase();
        handleSelect(symbol);
      }
    },
    [query, handleSelect]
  );

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search any NSE stock... (⌘K)"
          className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/40 transition-colors"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg shadow-2xl shadow-black/40 overflow-hidden z-50 max-h-[360px] overflow-y-auto"
          >
            {searching ? (
              <div className="flex items-center gap-2 p-4 text-sm text-[var(--text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching stocks...
              </div>
            ) : results.length > 0 ? (
              <div className="p-1">
                {results.map((r) => (
                  <button
                    key={r.instrumentKey}
                    onClick={() => handleSelect(r.symbol)}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-left hover:bg-white/5 transition-colors"
                  >
                    <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-medium">{r.symbol}</span>
                    <span className="text-[var(--text-muted)] text-xs truncate ml-auto max-w-[200px]">
                      {r.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : query.length >= 1 ? (
              <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                No stocks found for &quot;{query}&quot;
              </div>
            ) : (
              <div className="p-3">
                {recentSearches.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-[var(--text-muted)] mb-2 px-1">Recent</p>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSelect(s)}
                          className="px-2.5 py-1 rounded-md text-xs bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-[var(--text-muted)] mb-2 px-1">Quick Picks</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PICKS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSelect(s)}
                      className="px-2.5 py-1 rounded-md text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
