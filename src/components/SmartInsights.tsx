"use client";

import { Lightbulb, Leaf, TrendingUp, AlertCircle, Flame, Zap } from "lucide-react";
import { getSmartInsights } from "@/lib/mockData";

const iconMap = {
  lightbulb: Lightbulb,
  leaf: Leaf,
  trending: TrendingUp,
  alert: AlertCircle,
  flame: Flame,
  zap: Zap,
};

export function SmartInsights() {
  const insights = getSmartInsights();

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Розумні підказки
        </h2>
        <span className="text-xs text-muted-foreground">AI аналітика</span>
      </div>
      <div className="space-y-2">
        {insights.map((insight, idx) => {
          const Icon = iconMap[insight.icon];
          return (
            <div
              key={idx}
              className="card-hover flex items-start gap-3 rounded-2xl border border-border p-3 animate-fade-in"
              style={{ backgroundColor: insight.bgColor + "40" }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: insight.bgColor, color: insight.color }}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: insight.color }}>
                  {insight.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
