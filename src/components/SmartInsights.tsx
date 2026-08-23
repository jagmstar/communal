"use client";

import { useState, useMemo } from "react";
import { Lightbulb, Leaf, TrendingUp, AlertCircle, Flame, Zap, X } from "lucide-react";
import { computeSmartInsights } from "@/lib/calculations";
import type { Meter, Reading } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  lightbulb: Lightbulb,
  leaf: Leaf,
  trending: TrendingUp,
  alert: AlertCircle,
  flame: Flame,
  zap: Zap,
};

type Severity = "info" | "warning" | "critical";

/** Map insight type to severity for color coding */
function getSeverity(type: string): Severity {
  if (type === "anomaly") return "warning";
  return "info";
}

/** Severity-based border accent colors */
function getSeverityBorder(severity: Severity): string {
  switch (severity) {
    case "warning":
      return "border-l-warning";
    case "critical":
      return "border-l-danger";
    default:
      return "border-l-primary-300";
  }
}

interface SmartInsightsProps {
  meters: Meter[];
  readings: Reading[];
}

export function SmartInsights({ meters, readings }: SmartInsightsProps) {
  const insights = useMemo(() => computeSmartInsights(meters, readings), [meters, readings]);
  const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set());

  const visibleInsights = insights.map((insight, idx) => ({ ...insight, originalIndex: idx }))
    .filter(({ originalIndex }) => !dismissedIndices.has(originalIndex));

  const handleDismiss = (index: number) => {
    setDismissedIndices((prev) => new Set(prev).add(index));
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-warning" />
          Розумні підказки
        </h2>
        <span className="text-xs text-muted-foreground">AI аналітика</span>
      </div>
      <div className="space-y-2">
        {visibleInsights.map((insight) => {
          const Icon = iconMap[insight.icon] || Lightbulb;
          const severity = getSeverity(insight.type);
          const severityBorder = getSeverityBorder(severity);

          return (
            <div
              key={insight.originalIndex}
              className={`card-hover relative flex items-start gap-3 rounded-2xl border border-border border-l-4 ${severityBorder} p-3 pr-10 animate-fade-in`}
              style={{ backgroundColor: insight.bgColor + "40" }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: insight.bgColor, color: insight.color }}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold" style={{ color: insight.color }}>
                  {insight.title}
                </p>
                <p className="text-body text-muted-foreground mt-0.5 leading-relaxed">
                  {insight.description}
                </p>
                {severity === "warning" && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-warning-light px-2 py-0.5 text-xs font-medium text-warning">
                    Увага
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDismiss(insight.originalIndex)}
                className="absolute top-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Закрити підказку"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        {visibleInsights.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center">
            <p className="text-body text-muted-foreground">
              Немає нових підказок. Передайте показники, щоб отримати аналітику.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
