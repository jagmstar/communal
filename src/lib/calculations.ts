/**
 * Pure computation functions for the Communal app.
 *
 * These functions accept data as parameters (from API or mock data)
 * and compute derived values: monthly usage, bill predictions,
 * smart insights, bill change factors, reminders.
 *
 * Extracted from mockData.ts so they work with any data source.
 */

import type { Meter, Reading, Tariff, Reminder, BillPrediction, ServiceType } from "./types";

/**
 * Guard against a negative usage delta between two consecutive readings
 * (ticket #1, AC-6).
 *
 * `POST /api/readings` (see src/app/api/readings/route.ts) rejects an
 * ordinary regressive reading server-side as of ticket #1, so under normal
 * operation `curr.value >= prev.value` here. The one case that can still
 * legitimately produce `curr.value < prev.value` is an acknowledged meter
 * rollover (dial wrap-around, submitted with `allowRollover: true`) — the
 * API intentionally lets that through because a schema without a per-meter
 * "dial capacity" field cannot compute the true wrapped usage
 * (`(capacity - prev.value) + curr.value`).
 *
 * Rather than surface a negative — and therefore meaningless — usage/cost
 * to the person (the exact symptom ticket #1 reports), this clamps the
 * delta to 0. This is a deliberate, documented simplification: it under-
 * counts usage for the rollover month instead of showing nonsense. A
 * follow-up ticket to store dial capacity and compute true rollover usage
 * is out of scope here (see ticket #1 "Out of scope").
 */
function nonNegativeDelta(currValue: number, prevValue: number): number {
  const diff = currValue - prevValue;
  return diff < 0 ? 0 : diff;
}

/**
 * Ukrainian pluralization helper.
 * Returns the correct form of a word based on the count.
 * Ukrainian has three plural forms: one, few (2-4), many (5+).
 *
 * @param count - The number of items
 * @param forms - Tuple of [one, few, many] forms, e.g. ["лічильник", "лічильники", "лічильників"]
 */
export function pluralize(count: number, forms: [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

/** Get available years from readings */
export function getAvailableYears(readings: Reading[]): number[] {
  const years = new Set<number>();
  readings.forEach((r) => years.add(new Date(r.date).getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
}

/** Calculate monthly usage from readings for a specific meter */
export function computeMonthlyUsage(
  meterId: string,
  readings: Reading[],
  meters: Meter[],
  tariffs: Tariff[]
): { month: string; usage: number; cost: number }[] {
  const meterReadings = readings
    .filter((r) => r.meterId === meterId)
    .sort((a, b) => a.date.localeCompare(b.date));

  const usage: { month: string; usage: number; cost: number }[] = [];
  for (let i = 1; i < meterReadings.length; i++) {
    const prev = meterReadings[i - 1];
    const curr = meterReadings[i];
    // Non-decreasing assumption guard — see nonNegativeDelta() (ticket #1, AC-6).
    const diff = nonNegativeDelta(curr.value, prev.value);
    const monthName = new Date(curr.date).toLocaleDateString("uk-UA", { month: "short" });
    const meter = meters.find((m) => m.id === meterId);
    const tariff = tariffs.find((t) => t.serviceType === meter?.serviceType);
    const cost = diff * (tariff?.value || 0);
    usage.push({
      month: monthName,
      usage: Math.round(diff * 100) / 100,
      cost: Math.round(cost * 100) / 100,
    });
  }
  return usage;
}

/** Calculate total predicted bill from bill predictions */
export function computeTotalPredictedBill(predictions: BillPrediction[]): number {
  return predictions.reduce((sum, p) => sum + p.predictedAmount, 0);
}

/**
 * Calculate bill change factors by comparing last two months of readings.
 */
export function computeBillChangeFactors(
  meters: Meter[],
  readings: Reading[],
  tariffs: Tariff[],
  predictions: BillPrediction[]
): {
  factors: { label: string; impact: number; percentage: number }[];
  totalImpact: number;
  previousBill: number;
  currentBill: number;
  forecast: number;
} {
  const factors: { label: string; impact: number; percentage: number }[] = [];
  let previousBill = 0;
  let currentBill = 0;

  for (const meter of meters) {
    const meterReadings = readings
      .filter((r) => r.meterId === meter.id)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (meterReadings.length < 2) continue;

    const last = meterReadings[meterReadings.length - 1];
    const prev = meterReadings[meterReadings.length - 2];

    // Non-decreasing assumption guard — see nonNegativeDelta() (ticket #1, AC-6).
    const lastUsage = nonNegativeDelta(last.value, prev.value);
    const prevUsage =
      meterReadings.length >= 3
        ? nonNegativeDelta(prev.value, meterReadings[meterReadings.length - 3].value)
        : prev.value;

    const serviceTariffs = tariffs.filter((t) => t.serviceType === meter.serviceType);
    const tariffValue = serviceTariffs.reduce((sum, t) => sum + t.value, 0);

    const lastCost = lastUsage * tariffValue;
    const prevCost = prevUsage * tariffValue;

    previousBill += prevCost;
    currentBill += lastCost;

    const usageDiff = lastUsage - prevUsage;
    const usagePct = prevUsage > 0 ? Math.round((usageDiff / prevUsage) * 100) : 0;
    const costImpact = Math.round(usageDiff * tariffValue);

    if (Math.abs(usagePct) >= 1 || Math.abs(costImpact) >= 1) {
      const sign = usageDiff > 0 ? "+" : "−";
      factors.push({
        label: `${meter.serviceName} ${sign}${Math.abs(usagePct)}%`,
        impact: costImpact,
        percentage: usagePct,
      });
    }
  }

  const totalImpact = Math.round(currentBill - previousBill);
  const forecast = Math.round(computeTotalPredictedBill(predictions));

  return {
    factors,
    totalImpact,
    previousBill: Math.round(previousBill),
    currentBill: Math.round(currentBill),
    forecast,
  };
}

/** Generate smart insights from meter and reading data */
export function computeSmartInsights(
  meters: Meter[],
  readings: Reading[]
): {
  type: "tip" | "green" | "saving" | "warning" | "streak" | "anomaly";
  title: string;
  description: string;
  icon: "lightbulb" | "leaf" | "trending" | "alert" | "flame" | "zap";
  color: string;
  bgColor: string;
}[] {
  const insights: {
    type: "tip" | "green" | "saving" | "warning" | "streak" | "anomaly";
    title: string;
    description: string;
    icon: "lightbulb" | "leaf" | "trending" | "alert" | "flame" | "zap";
    color: string;
    bgColor: string;
  }[] = [];

  // 1. Streak: count consecutive months of readings
  const allReadings = [...readings].sort((a, b) => a.date.localeCompare(b.date));
  const months = new Set(allReadings.map((r) => r.date.slice(0, 7)));
  const streakCount = months.size;

  if (streakCount >= 3) {
    insights.push({
      type: "streak",
      title: `🔥 ${streakCount} місяців підряд`,
      description: "Передавав показники вчасно та без пропусків. Так тримати!",
      icon: "flame",
      color: "#f97316",
      bgColor: "#fff7ed",
    });
  }

  // 2. Anomaly detection
  for (const meter of meters) {
    const meterReadings = readings
      .filter((r) => r.meterId === meter.id)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (meterReadings.length < 3) continue;

    const lastUsage =
      meterReadings[meterReadings.length - 1].value -
      meterReadings[meterReadings.length - 2].value;
    const prevUsage =
      meterReadings[meterReadings.length - 2].value -
      meterReadings[meterReadings.length - 3].value;

    if (prevUsage > 0) {
      const changePct = ((lastUsage - prevUsage) / prevUsage) * 100;
      if (Math.abs(changePct) >= 15) {
        const sign = changePct > 0 ? "+" : "−";
        insights.push({
          type: "anomaly",
          title: `⚠ ${meter.serviceName} ${sign}${Math.abs(Math.round(changePct))}%`,
          description:
            changePct > 0
              ? `Витрата зросла на ${Math.abs(Math.round(changePct))}% vs попередній місяць. Можливий виток або новий прилад.`
              : `Витрата знизилась на ${Math.abs(Math.round(changePct))}% vs попередній місяць. Хороша економія!`,
          icon: "alert",
          color: changePct > 0 ? "#ef4444" : "#22c55e",
          bgColor: changePct > 0 ? "#fef2f2" : "#f0fdf4",
        });
      }
    }
  }

  // 3. Carbon footprint from electricity
  const elecMeter = meters.find((m) => m.serviceType === "electricity");
  if (elecMeter) {
    const meterReadings = readings
      .filter((r) => r.meterId === elecMeter.id)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (meterReadings.length >= 2) {
      const monthlyUsage =
        meterReadings[meterReadings.length - 1].value -
        meterReadings[meterReadings.length - 2].value;
      const co2kg = (monthlyUsage * 0.3).toFixed(1);
      const treesEquiv = Math.round((monthlyUsage * 0.3) / 21);
      insights.push({
        type: "green",
        title: `🌿 ${co2kg} кг CO₂/міс`,
        description: `Твоя електро-витрата = ${co2kg} кг CO₂. Еквівалент ${treesEquiv} дерев/рік. Знизь на 10% = ${Math.round(treesEquiv * 0.1)} дерев.`,
        icon: "leaf",
        color: "#22c55e",
        bgColor: "#f0fdf4",
      });
    }
  }

  // 4. Savings tip
  insights.push({
    type: "saving",
    title: "💡 Зеконом ₴340/рік",
    description:
      "Перенеси 20% електро на нічний тариф (23:00-07:00) — тариф вдвічі нижчий.",
    icon: "zap",
    color: "#f59e0b",
    bgColor: "#fef3c7",
  });

  // 5. Seasonal tip
  const gasMeter = meters.find((m) => m.serviceType === "gas");
  if (gasMeter) {
    insights.push({
      type: "tip",
      title: "📊 Газ: сезонний патерн",
      description:
        "Твій газ зростає на 40% у грудні-лютому. Запаси дров зараз = зекономиш ₴500/міс взимку.",
      icon: "lightbulb",
      color: "#14b8a6",
      bgColor: "#f0fdfa",
    });
  }

  return insights;
}

/** Generate reminders from meter data */
export function computeReminders(meters: Meter[]): Reminder[] {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return meters
    .map((meter) => {
      const deadline = new Date(currentYear, currentMonth, meter.submitDeadlineDay);
      const diffMs = deadline.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const urgent = daysLeft <= 5 && daysLeft >= 0;

      return {
        id: `rem-${meter.id}`,
        meterId: meter.id,
        serviceName: meter.serviceName,
        type: "reading" as const,
        dueDate: deadline.toISOString().slice(0, 10),
        daysLeft,
        urgent,
      };
    })
    .filter((r) => r.daysLeft >= 0);
}

/** Compute bill predictions from meters, readings, and tariffs */
export function computeBillPredictions(
  meters: Meter[],
  readings: Reading[],
  tariffs: Tariff[]
): BillPrediction[] {
  return meters.map((meter) => {
    const meterReadings = readings
      .filter((r) => r.meterId === meter.id)
      .sort((a, b) => a.date.localeCompare(b.date));

    let predictedUsage = 0;
    if (meterReadings.length >= 2) {
      const last = meterReadings[meterReadings.length - 1];
      const prev = meterReadings[meterReadings.length - 2];
      // Non-decreasing assumption guard — see nonNegativeDelta() (ticket #1, AC-6).
      const lastUsage = nonNegativeDelta(last.value, prev.value);
      predictedUsage = Math.round(lastUsage * 100) / 100;
    }

    const serviceTariffs = tariffs.filter((t) => t.serviceType === meter.serviceType);
    const tariffValue = serviceTariffs.reduce((sum, t) => sum + t.value, 0);
    const predictedAmount = Math.round(predictedUsage * tariffValue * 100) / 100;

    return {
      meterId: meter.id,
      serviceName: meter.serviceName,
      predictedUsage,
      predictedAmount,
      tariff: tariffValue,
      confidence: meterReadings.length >= 3 ? 0.85 : 0.5,
    };
  });
}
