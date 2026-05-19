import type { AnalysisResult } from "./types";

const JSON_DELIMITER = "---JSON_DATA---";

/**
 * Split the AI response into readable report and JSON data
 */
export function splitResponse(raw: string): { report: string; jsonStr: string } {
  const delimIdx = raw.indexOf(JSON_DELIMITER);
  if (delimIdx === -1) {
    return { report: raw, jsonStr: "" };
  }
  return {
    report: raw.slice(0, delimIdx).trim(),
    jsonStr: raw.slice(delimIdx + JSON_DELIMITER.length).trim(),
  };
}

/**
 * Extract the readable report portion (everything before the JSON delimiter)
 */
export function extractReport(raw: string): string {
  const delimIdx = raw.indexOf(JSON_DELIMITER);
  if (delimIdx === -1) return raw;
  return raw.slice(0, delimIdx).trim();
}

/**
 * Parse the JSON portion of the AI response into structured data
 */
export function parseAnalysisJSON(raw: string): AnalysisResult | null {
  try {
    const { jsonStr } = splitResponse(raw);
    if (!jsonStr) {
      // Fallback: try parsing the entire raw content as JSON
      return parseJSONFromString(raw);
    }
    return parseJSONFromString(jsonStr);
  } catch {
    return null;
  }
}

function parseJSONFromString(str: string): AnalysisResult | null {
  try {
    let jsonStr = str.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    // Find the first { and last } to extract JSON object
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    if (start === -1 || end === -1) return null;

    jsonStr = jsonStr.slice(start, end + 1);
    const parsed = JSON.parse(jsonStr);
    return parsed as AnalysisResult;
  } catch {
    return null;
  }
}

export function extractPartialData(raw: string): Partial<AnalysisResult> {
  const result: Partial<AnalysisResult> = {};

  try {
    // Try to extract known fields even from incomplete JSON
    const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]+)"/);
    if (summaryMatch) result.summary = summaryMatch[1];

    const healthMatch = raw.match(/"healthScore"\s*:\s*(\d+)/);
    if (healthMatch) result.healthScore = parseInt(healthMatch[1]);

    const recMatch = raw.match(/"recommendation"\s*:\s*"(\w+)"/);
    if (recMatch) result.recommendation = recMatch[1] as AnalysisResult["recommendation"];

    const confMatch = raw.match(/"confidence"\s*:\s*(\d+)/);
    if (confMatch) result.confidence = parseInt(confMatch[1]);
  } catch {
    // ignore parse errors for partial data
  }

  return result;
}
