"use client";

import { Lightbulb, Leaf, TrendingUp, AlertCircle, Flame, Zap } from "lucide-react";

interface Insight {
  type: "tip" | "green" | "saving" | "warning" | "streak" | "anomaly";
  title: string;
  description: string;
  icon: "lightbulb" | "leaf" | "trending" | "alert" | "flame" | "zap";
  color: string;
  bgColor: string;
}

const iconMap = {
  lightbulb: Lightbulb,
  leaf: Leaf,
  trending: TrendingUp,
  alert: AlertCircle,
  flame: Flame,
  zap: Zap,
};

const mockInsights: Insight[] = [
  {
    type: "streak",
    title: "🔥 12 місяців підряд",
    description: "Передавав показники вчасно 12 місяців поспіль. Так тримати!",
    icon: "flame",
    color: "#f97316",
    bgColor: "#fff7ed",
  },
  {
    type: "saving",
    title: "💡 Зеконом ₴340/рік",
    description: "Перенеси 20% електро на нічний тариф (23:00-07:00) — тариф вдвічі нижчий.",
    icon: "zap",
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  {
    type: "green",
    title: "🌿 0.8т CO₂/рік",
    description: "Твоя електро-витрата = 0.8т CO₂. Еквівалент 36 дерев. Знизь на 10% = 4 дерева.",
    icon: "leaf",
    color: "#22c55e",
    bgColor: "#f0fdf4",
  },
  {
    type: "anomaly",
    title: "⚠ Вода +18%",
    description: "Витрата гарячої води зросла на 18% vs липень. Можливий виток або новий прилад.",
    icon: "alert",
    color: "#ef4444",
    bgColor: "#fef2f2",
  },
  {
    type: "tip",
    title: "📊 Газ: сезонний патерн",
    description: "Твій газ зростає на 40% у грудні-лютому. Запаси дров зараз = зекономиш ₴500/міс взимку.",
    icon: "lightbulb",
    color: "#0891b2",
    bgColor: "#ecfeff",
  },
];

export function SmartInsights() {
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
        {mockInsights.map((insight, idx) => {
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
