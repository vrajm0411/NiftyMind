"use client";

import { useState, useCallback, useRef } from "react";
import { parseAnalysisJSON, extractPartialData, extractReport } from "@/lib/ai/parser";
import type { AnalysisResult } from "@/lib/ai/types";

interface AnalysisState {
  status: "idle" | "loading" | "streaming" | "complete" | "error";
  statusMessage: string;
  rawContent: string;
  reportContent: string;
  result: AnalysisResult | null;
  partialData: Partial<AnalysisResult>;
  error: string | null;
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    status: "idle",
    statusMessage: "",
    rawContent: "",
    reportContent: "",
    result: null,
    partialData: {},
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (symbol: string) => {
    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      status: "loading",
      statusMessage: "Starting analysis...",
      rawContent: "",
      reportContent: "",
      result: null,
      partialData: {},
      error: null,
    });

    try {
      const response = await fetch("/api/analysis/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            switch (data.section) {
              case "status":
                setState((prev) => ({
                  ...prev,
                  status: "loading",
                  statusMessage: data.content,
                }));
                break;

              case "analysis":
                accumulated += data.content;
                const report = extractReport(accumulated);
                const partial = extractPartialData(accumulated);
                setState((prev) => ({
                  ...prev,
                  status: "streaming",
                  rawContent: accumulated,
                  reportContent: report,
                  partialData: { ...prev.partialData, ...partial },
                }));
                break;

              case "complete": {
                const result = parseAnalysisJSON(accumulated);
                const finalReport = extractReport(accumulated);
                setState((prev) => ({
                  ...prev,
                  status: "complete",
                  statusMessage: "",
                  result,
                  rawContent: accumulated,
                  reportContent: finalReport,
                }));
                break;
              }

              case "error":
                setState((prev) => ({
                  ...prev,
                  status: "error",
                  error: data.content,
                }));
                break;
            }
          } catch {
            // ignore parse errors for incomplete chunks
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        status: "error",
        error: (error as Error).message,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      status: "idle",
      statusMessage: "",
      rawContent: "",
      reportContent: "",
      result: null,
      partialData: {},
      error: null,
    });
  }, []);

  return { ...state, analyze, reset };
}
