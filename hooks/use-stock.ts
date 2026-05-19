import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StockState {
  selectedStock: string | null;
  watchlist: string[];
  recentSearches: string[];
  setSelectedStock: (symbol: string) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  addRecentSearch: (symbol: string) => void;
}

export const useStockStore = create<StockState>()(
  persist(
    (set) => ({
      selectedStock: null,
      watchlist: [],
      recentSearches: [],
      setSelectedStock: (symbol) => set({ selectedStock: symbol }),
      addToWatchlist: (symbol) =>
        set((state) => ({
          watchlist: state.watchlist.includes(symbol)
            ? state.watchlist
            : [...state.watchlist, symbol],
        })),
      removeFromWatchlist: (symbol) =>
        set((state) => ({
          watchlist: state.watchlist.filter((s) => s !== symbol),
        })),
      addRecentSearch: (symbol) =>
        set((state) => ({
          recentSearches: [
            symbol,
            ...state.recentSearches.filter((s) => s !== symbol),
          ].slice(0, 10),
        })),
    }),
    {
      name: "niftymind-stock-store",
    }
  )
);
