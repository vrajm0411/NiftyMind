"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  LayoutDashboard,
  Brain,
  Sparkles,
  Briefcase,
  Star,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Circle,
  User,
} from "lucide-react";
import { cn, isMarketOpen } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/ai-analysis", icon: Brain, label: "AI Analysis" },
  { href: "/dashboard/ai-prediction", icon: Sparkles, label: "AI Prediction" },
  { href: "/dashboard/portfolio", icon: Briefcase, label: "Portfolio" },
  { href: "/dashboard/watchlist", icon: Star, label: "Watchlist" },
  { href: "/dashboard/market", icon: BarChart3, label: "Market" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const marketOpen = isMarketOpen();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[var(--border-subtle)]">
          <Activity className="w-7 h-7 text-cyan-400 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-lg font-semibold gradient-text whitespace-nowrap overflow-hidden"
              >
                NiftyMind
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Market Status */}
        <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Circle
              className={cn(
                "w-2.5 h-2.5 fill-current",
                marketOpen ? "text-emerald-400 animate-pulse" : "text-rose-400"
              )}
            />
            {!collapsed && (
              <span className="text-xs text-[var(--text-secondary)]">
                NSE {marketOpen ? "Open" : "Closed"}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive ? "text-cyan-400" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info + Controls */}
        <div className="px-2 py-3 border-t border-[var(--border-subtle)]">
          {/* User info */}
          {userName && !collapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{userName}</p>
                {userEmail && (
                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                    {userEmail}
                  </p>
                )}
              </div>
            </div>
          )}
          {userName && collapsed && (
            <div className="flex justify-center py-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-colors w-full"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/5 transition-colors w-full mt-1"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)]/95 backdrop-blur-xl border-t border-[var(--border-subtle)] px-2 py-1.5">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 6).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
                  isActive
                    ? "text-cyan-400"
                    : "text-[var(--text-muted)]"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
