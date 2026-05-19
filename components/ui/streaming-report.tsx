"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StreamingReportProps {
  content: string;
  isStreaming: boolean;
  className?: string;
}

function renderMarkdown(text: string) {
  // Split into lines and convert markdown to styled elements
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ## Heading
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="text-base font-semibold text-cyan-400 mt-5 mb-2 first:mt-0"
        >
          {formatInline(line.slice(3))}
        </h2>
      );
    }
    // ### Sub-heading
    else if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={key++}
          className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-1.5"
        >
          {formatInline(line.slice(4))}
        </h3>
      );
    }
    // Bullet points
    else if (line.match(/^[\-\*•]\s/)) {
      elements.push(
        <div key={key++} className="flex gap-2 ml-1 mb-1">
          <span className="text-cyan-400 mt-0.5 shrink-0">•</span>
          <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {formatInline(line.replace(/^[\-\*•]\s/, ""))}
          </span>
        </div>
      );
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      if (match) {
        elements.push(
          <div key={key++} className="flex gap-2 ml-1 mb-1">
            <span className="text-cyan-400 text-sm font-medium shrink-0 w-5 text-right">
              {match[1]}.
            </span>
            <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {formatInline(match[2])}
            </span>
          </div>
        );
      }
    }
    // Empty line = paragraph break
    else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
    }
    // Regular paragraph
    else {
      elements.push(
        <p
          key={key++}
          className="text-sm text-[var(--text-secondary)] leading-relaxed mb-1"
        >
          {formatInline(line)}
        </p>
      );
    }
  }

  return elements;
}

function formatInline(text: string): React.ReactNode {
  // Handle **bold** and *italic* patterns
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let partKey = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(
        <span key={`b${partKey++}`} className="font-semibold text-[var(--text-primary)]">
          {boldMatch[1]}
        </span>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // No more patterns, push rest
    parts.push(remaining);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export function StreamingReport({
  content,
  isStreaming,
  className,
}: StreamingReportProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-default)] rounded-xl p-5 overflow-y-auto",
        className
      )}
    >
      {content ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {renderMarkdown(content)}
          {isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-2 h-4 bg-cyan-400 ml-0.5 align-middle"
            />
          )}
        </motion.div>
      ) : isStreaming ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="shimmer h-4 bg-white/5 rounded" style={{ width: `${80 - i * 10}%` }} />
          ))}
        </div>
      ) : (
        <div className="text-center text-[var(--text-muted)] py-12">
          <p className="text-sm">Select a stock and click &quot;Generate Analysis&quot; to begin</p>
        </div>
      )}
    </div>
  );
}
