"use client";

import { useState, useCallback, useRef } from "react";
import type { PredictionResult, Horizon } from "@/lib/ai/prediction-types";

interface PredictionState {
  status: "idle" | "loading" | "streaming" | "complete" | "error";
  statusMessage: string;
  rawContent: string;
  result: PredictionResult | null;
  partialData: Partial<PredictionResult>;
  error: string | null;
}

function extractPartialPrediction(raw: string): Partial<PredictionResult> {
  const result: Partial<PredictionResult> = {};
  try {
    const dirMatch = raw.match(/"direction"\s*:\s*"(Bullish|Bearish|Neutral)"/);
    if (dirMatch) result.direction = dirMatch[1] as PredictionResult["direction"];

    const confMatch = raw.match(/"confidence"\s*:\s*(\d+)/);
    if (confMatch) result.confidence = parseInt(confMatch[1]);

    // Try to extract price_forecast
    const forecastMatch = raw.match(/"price_forecast"\s*:\s*\{[^}]*"low"\s*:\s*([\d.]+)[^}]*"base"\s*:\s*([\d.]+)[^}]*"high"\s*:\s*([\d.]+)/);
    if (forecastMatch) {
      result.price_forecast = {
        low: parseFloat(forecastMatch[1]),
        base: parseFloat(forecastMatch[2]),
        high: parseFloat(forecastMatch[3]),
        currency: "INR",
      };
    }

    const riskMatch = raw.match(/"risk"\s*:\s*\{[^}]*"level"\s*:\s*"(Low|Medium|High|Extreme)"/);
    if (riskMatch) {
      result.risk = { level: riskMatch[1] as PredictionResult["risk"]["level"], drivers: [] };
    }
  } catch {
    // ignore parse errors for partial data
  }
  return result;
}

function parsePredictionJSON(raw: string): PredictionResult | null {
  try {
    let jsonStr = raw.trim();
    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    jsonStr = jsonStr.slice(start, end + 1);
    return JSON.parse(jsonStr) as PredictionResult;
  } catch {
    return null;
  }
}

export function usePrediction() {
  const [state, setState] = useState<PredictionState>({
    status: "idle",
    statusMessage: "",
    rawContent: "",
    result: null,
    partialData: {},
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const predict = useCallback(
    async (symbol: string, horizon: Horizon, userMode: "retail" | "professional" = "retail") => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        status: "loading",
        statusMessage: "Starting prediction...",
        rawContent: "",
        result: null,
        partialData: {},
        error: null,
      });

      try {
        const response = await fetch("/api/prediction/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol, horizon, userMode }),
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

                case "prediction":
                  accumulated += data.content;
                  const partial = extractPartialPrediction(accumulated);
                  setState((prev) => ({
                    ...prev,
                    status: "streaming",
                    rawContent: accumulated,
                    partialData: { ...prev.partialData, ...partial },
                  }));
                  break;

                case "complete": {
                  const result = parsePredictionJSON(accumulated);
                  setState((prev) => ({
                    ...prev,
                    status: "complete",
                    statusMessage: "",
                    result,
                    rawContent: accumulated,
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
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      status: "idle",
      statusMessage: "",
      rawContent: "",
      result: null,
      partialData: {},
      error: null,
    });
  }, []);

  return { ...state, predict, reset };
}
