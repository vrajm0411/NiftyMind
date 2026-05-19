"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
  glow?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
  padding = "md",
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-default)] rounded-xl",
        paddingMap[padding],
        hover &&
          "transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-[0_0_30px_rgba(0,212,255,0.1)] hover:-translate-y-0.5",
        glow && "glow-cyan",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
