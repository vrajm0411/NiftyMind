"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  Activity,
  UserPlus,
  LogIn,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Real-Time Analysis",
    description: "Live market data from Upstox with instant price tracking and technical indicators",
  },
  {
    icon: BarChart3,
    title: "AI-Powered Insights",
    description: "Claude AI generates deep fundamental, technical, and risk analysis for any NSE stock",
  },
  {
    icon: Shield,
    title: "Crisis Resilience",
    description: "Score stocks against historical crises — COVID-19, demonetization, rate hikes",
  },
  {
    icon: Zap,
    title: "Streaming Reports",
    description: "Watch AI analysis stream in real-time with progressive section rendering",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyan-400" />
          <span className="text-lg font-semibold gradient-text">NiftyMind</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
            style={{ background: "var(--grad-cyan)" }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6">
            <Activity className="w-3.5 h-3.5" />
            AI-Powered Stock Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Smarter Stock Analysis{" "}
            <span className="gradient-text">Powered by AI</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-10">
            Connect your Upstox account and get institutional-grade stock analysis
            with real-time data, technical indicators, crisis resilience scoring,
            and AI-generated investment reports.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]"
              style={{ background: "var(--grad-cyan)" }}
            >
              <UserPlus className="w-4 h-4" />
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-5xl w-full"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              className="glass-card-hover p-5 text-left"
            >
              <feature.icon className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="font-semibold mb-1.5">{feature.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-[var(--text-muted)] py-6 border-t border-[var(--border-subtle)]">
        NiftyMind — Built with Next.js, Upstox API & Claude AI
      </footer>
    </div>
  );
}
