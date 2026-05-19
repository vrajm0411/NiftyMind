"use client";

import { AnimatePresence } from "framer-motion";
import { ToastContainer } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      {children}
      <ToastContainer />
    </AnimatePresence>
  );
}
