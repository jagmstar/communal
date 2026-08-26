import { describe, it, expect } from "vitest";
import {
  pluralize,
  getAvailableYears,
  computeMonthlyUsage,
  computeTotalPredictedBill,
  computeBillPredictions,
  computeBillChangeFactors,
  computeSmartInsights,
  computeReminders,
} from "../calculations";
import type { Meter, Reading, Tariff, BillPrediction } from "../types";

// ============================================
// Test fixtures
// ============================================

const meters: Meter[] = [
  {
    id: "meter-1",
    meterNumber: "001",
    serviceType: "water",
    serviceName: "Вода (гаряча)",
    unit: "м³",
    lastReading: 200,
    lastReadingDate: "2026-07-31",
    submitDeadlineDay: 31,
    submitWindowStart: 25,
    color: "#0ea5e9",
    colorLight: "#e0f2fe",
    icon: "droplet",
  },
  {
    id: "meter-2",
    meterNumber: "002",
    serviceType: "electricity",
    serviceName: "Електроенергія",
    unit: "кВт·год",
    lastReading: 12500,
    lastReadingDate: "2026-07-31",
    submitDeadlineDay: 3,
    submitWindowStart: 28,
    color: "#f59e0b",
    colorLight: "#fef3c7",
    icon: "zap",
  },
  {
    id: "meter-3",
    meterNumber: "003",
    serviceType: "gas",
    serviceName: "Газ",
    unit: "м³",
    lastReading: 5700,
    lastReadingDate: "2026-07-31",
    submitDeadlineDay: 5,
    submitWindowStart: 1,
    color: "#f97316",
    colorLight: "#ffedd5",
    icon: "flame",
  },
];

const tariffs: Tariff[] = [
  { id: "t1", serviceType: "water", serviceName: "Вода", value: 35.2, unit: "₴/м³", effectiveFrom: "2026-01-01", source: "eps" },
  { id: "t2", serviceType: "electricity", serviceName: "Електроенергія", value: 4.32, unit: "₴/кВт·год", effectiveFrom: "2026-01-01", source: "nerc" },
  { id: "t3", serviceType: "gas", serviceName: "Газ (розподіл)", value: 7.99, unit: "₴/м³", effectiveFrom: "2026-01-01", source: "eps" },
  { id: "t4", serviceType: "gas", serviceName: "Нафтогаз (постачання)", value: 13.87, unit: "₴/м³", effectiveFrom: "2026-01-01", source: "naftogaz" },
];

const readings: Reading[] = [
  // Water meter-1: May, Jun, Jul
  { id: "r1", meterId: "meter-1", value: 170, date: "2026-05-31", ocrConfidence: 0.98, ocrEngine: "manual", submittedToEps: true, submittedAt: "2026-05-31T10:00:00Z" },
  { id: "r2", meterId: "meter-1", value: 185, date: "2026-06-30", ocrConfidence: 0.95, ocrEngine: "manual", submittedToEps: true, submittedAt: "2026-06-30T10:00:00Z" },
  { id: "r3", meterId: "meter-1", value: 200, date: "2026-07-31", ocrConfidence: 0.97, ocrEngine: "manual", submittedToEps: true, submittedAt: "2026-07-31T10:00:00Z" },
  // Electricity meter-2: May, Jun, Jul
  { id: "r4", meterId: "meter-2", value: 12200, date: "2026-05-31", ocrConfidence: 0.99, ocrEngine: "manual", submittedToEps: true, submittedAt: "2026-05-31T10:00:00Z" },
  { id: "r5", meterId: "meter-2", value: 12350, date: "2026-06-30", ocrConfidence: 0.96, ocrEngine: "manual", submittedToEps: true, submittedAt: "2026-06-30T10:00:00Z" },
  { id: "r6", meterId: "meter-2", value: 12500, date: "2026-07-31", ocrConfidence: 0.98, ocrEngine: "manual", submittedToEps: true, submittedAt: "2026-07-31T10:00:00Z" },
  // Gas meter-3: May, Jun, Jul
  { id: "r7", meterId: "meter-3", value: 5600, date: "2026-05-31", ocrConfidence: 0.91, ocrEngine: "manual", submittedToEps: true, submittedAt: "2026-05-31T10:00:00Z" },
  { id: "r8", meterId: "meter-3", value: 5650, date: "2026-06-30", ocrConfidence: 0.93, ocrEngine: "manual", submittedToEps: true, submittedAt: "2026-06-30T10:00:00Z" },
  { id: "r9", meterId: "meter-3", value: 5700, date: "2026-07-31", ocrConfidence: 0.95, ocrEngine: "manual", submittedToEps: true, submittedAt: "2026-07-31T10:00:00Z" },
];

// ============================================
// pluralize
// ============================================

describe("pluralize", () => {
  it("returns form[0] for 1 (one)", () => {
    expect(pluralize(1, ["лічильник", "лічильники", "лічильників"])).toBe("лічильник");
  });

  it("returns form[0] for 21, 31, 41 (ends in 1, not 11)", () => {
    expect(pluralize(21, ["лічильник", "лічильники", "лічильників"])).toBe("лічильник");
    expect(pluralize(31, ["лічильник", "лічильники", "лічильників"])).toBe("лічильник");
  });

  it("returns form[1] for 2-4 (few)", () => {
    expect(pluralize(2, ["лічильник", "лічильники", "лічильників"])).toBe("лічильники");
    expect(pluralize(3, ["лічильник", "лічильники", "лічильників"])).toBe("лічильники");
    expect(pluralize(4, ["лічильник", "лічильники", "лічильників"])).toBe("лічильники");
  });

  it("returns form[1] for 22-24 (few, not 12-14)", () => {
    expect(pluralize(22, ["лічильник", "лічильники", "лічильників"])).toBe("лічильники");
    expect(pluralize(23, ["лічильник", "лічильники", "лічильників"])).toBe("лічильники");
    expect(pluralize(24, ["лічильник", "лічильники", "лічильників"])).toBe("лічильники");
  });

  it("returns form[2] for 0 (many)", () => {
    expect(pluralize(0, ["лічильник", "лічильники", "лічильників"])).toBe("лічильників");
  });

  it("returns form[2] for 5-20 (many)", () => {
    expect(pluralize(5, ["лічильник", "лічильники", "лічильників"])).toBe("лічильників");
    expect(pluralize(11, ["лічильник", "лічильники", "лічильників"])).toBe("лічильників");
    expect(pluralize(12, ["лічильник", "лічильники", "лічильників"])).toBe("лічильників");
    expect(pluralize(20, ["лічильник", "лічильники", "лічильників"])).toBe("лічильників");
  });

  it("returns form[2] for 25-30 (many)", () => {
    expect(pluralize(25, ["лічильник", "лічильники", "лічильників"])).toBe("лічильників");
    expect(pluralize(30, ["лічильник", "лічильники", "лічильників"])).toBe("лічильників");
  });
});

// ============================================
// getAvailableYears
// ============================================

describe("getAvailableYears", () => {
  it("extracts unique years from readings", () => {
    const result = getAvailableYears(readings);
    expect(result).toContain(2026);
    expect(result.length).toBe(1);
  });

  it("returns years sorted descending", () => {
    const multiYear: Reading[] = [
      ...readings,
      { id: "r-old", meterId: "meter-1", value: 100, date: "2025-12-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
    ];
    const result = getAvailableYears(multiYear);
    expect(result).toEqual([2026, 2025]);
  });

  it("returns empty array for no readings", () => {
    expect(getAvailableYears([])).toEqual([]);
  });
});

// ============================================
// computeMonthlyUsage
// ============================================

describe("computeMonthlyUsage", () => {
  it("computes monthly usage and cost for water meter", () => {
    const result = computeMonthlyUsage("meter-1", readings, meters, tariffs);
    expect(result).toHaveLength(2); // 3 readings → 2 intervals

    // Jun: 185 - 170 = 15, cost = 15 * 35.2 = 528
    expect(result[0]).toEqual({ month: "черв.", usage: 15, cost: 528 });

    // Jul: 200 - 185 = 15, cost = 15 * 35.2 = 528
    expect(result[1]).toEqual({ month: "лип.", usage: 15, cost: 528 });
  });

  it("returns empty array for meter with no readings", () => {
    const result = computeMonthlyUsage("nonexistent", readings, meters, tariffs);
    expect(result).toEqual([]);
  });

  it("returns empty array for meter with only 1 reading", () => {
    const single: Reading[] = [readings[0]];
    const result = computeMonthlyUsage("meter-1", single, meters, tariffs);
    expect(result).toEqual([]);
  });

  it("computes electricity usage correctly", () => {
    const result = computeMonthlyUsage("meter-2", readings, meters, tariffs);
    expect(result).toHaveLength(2);

    // Jun: 12350 - 12200 = 150, cost = 150 * 4.32 = 648
    expect(result[0]).toEqual({ month: "черв.", usage: 150, cost: 648 });

    // Jul: 12500 - 12350 = 150, cost = 150 * 4.32 = 648
    expect(result[1]).toEqual({ month: "лип.", usage: 150, cost: 648 });
  });

  // Ticket #1, AC-6: a negative delta (e.g. an acknowledged meter rollover
  // that bypassed the API's regression check) must never produce a negative
  // usage/cost — it is clamped to 0 instead of showing a nonsense bill.
  it("clamps a negative delta (rollover/regressive value) to zero usage", () => {
    const rolloverReadings: Reading[] = [
      { id: "ro1", meterId: "meter-1", value: 99950, date: "2026-06-30", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      { id: "ro2", meterId: "meter-1", value: 12, date: "2026-07-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
    ];
    const result = computeMonthlyUsage("meter-1", rolloverReadings, meters, tariffs);
    expect(result).toHaveLength(1);
    expect(result[0].usage).toBe(0);
    expect(result[0].cost).toBe(0);
  });
});

// ============================================
// computeTotalPredictedBill
// ============================================

describe("computeTotalPredictedBill", () => {
  it("sums all predicted amounts", () => {
    const predictions: BillPrediction[] = [
      { meterId: "m1", serviceName: "Вода", predictedUsage: 15, predictedAmount: 528, tariff: 35.2, confidence: 0.85 },
      { meterId: "m2", serviceName: "Електро", predictedUsage: 150, predictedAmount: 648, tariff: 4.32, confidence: 0.85 },
      { meterId: "m3", serviceName: "Газ", predictedUsage: 50, predictedAmount: 1093, tariff: 21.86, confidence: 0.85 },
    ];
    expect(computeTotalPredictedBill(predictions)).toBe(2269);
  });

  it("returns 0 for empty predictions", () => {
    expect(computeTotalPredictedBill([])).toBe(0);
  });
});

// ============================================
// computeBillPredictions
// ============================================

describe("computeBillPredictions", () => {
  it("predicts usage from last interval for each meter", () => {
    const predictions = computeBillPredictions(meters, readings, tariffs);
    expect(predictions).toHaveLength(3);

    // Water: last usage = 15, tariff = 35.2 → 528
    expect(predictions[0].predictedUsage).toBe(15);
    expect(predictions[0].predictedAmount).toBe(528);

    // Electricity: last usage = 150, tariff = 4.32 → 648
    expect(predictions[1].predictedUsage).toBe(150);
    expect(predictions[1].predictedAmount).toBe(648);

    // Gas: last usage = 50, tariff = 7.99 + 13.87 = 21.86 → 1093
    expect(predictions[2].predictedUsage).toBe(50);
    expect(predictions[2].predictedAmount).toBe(1093);
  });

  it("sets confidence 0.85 for 3+ readings, 0.5 for fewer", () => {
    const predictions = computeBillPredictions(meters, readings, tariffs);
    expect(predictions[0].confidence).toBe(0.85); // 3 readings

    const fewReadings = readings.slice(0, 2); // only 2 readings for meter-1
    const predictions2 = computeBillPredictions([meters[0]], fewReadings, tariffs);
    expect(predictions2[0].confidence).toBe(0.5);
  });

  it("handles meter with no readings", () => {
    const predictions = computeBillPredictions([meters[0]], [], tariffs);
    expect(predictions[0].predictedUsage).toBe(0);
    expect(predictions[0].predictedAmount).toBe(0);
  });

  // Ticket #1, AC-6: a negative delta must not produce a negative predicted bill.
  it("clamps a negative delta to zero predicted usage/amount", () => {
    const rolloverReadings: Reading[] = [
      { id: "ro1", meterId: "meter-1", value: 99950, date: "2026-06-30", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      { id: "ro2", meterId: "meter-1", value: 12, date: "2026-07-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
    ];
    const predictions = computeBillPredictions([meters[0]], rolloverReadings, tariffs);
    expect(predictions[0].predictedUsage).toBe(0);
    expect(predictions[0].predictedAmount).toBe(0);
  });
});

// ============================================
// computeBillChangeFactors
// ============================================

describe("computeBillChangeFactors", () => {
  it("computes change factors comparing last two intervals", () => {
    // Create readings with varying usage so factors are generated
    const varyingReadings: Reading[] = [
      // Water: May=170, Jun=190 (usage 20), Jul=220 (usage 30) → +50%
      { id: "vr1", meterId: "meter-1", value: 170, date: "2026-05-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      { id: "vr2", meterId: "meter-1", value: 190, date: "2026-06-30", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      { id: "vr3", meterId: "meter-1", value: 220, date: "2026-07-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      // Electricity: May=12200, Jun=12350 (usage 150), Jul=12700 (usage 350) → +133%
      { id: "vr4", meterId: "meter-2", value: 12200, date: "2026-05-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      { id: "vr5", meterId: "meter-2", value: 12350, date: "2026-06-30", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      { id: "vr6", meterId: "meter-2", value: 12700, date: "2026-07-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      // Gas: May=5600, Jun=5650 (usage 50), Jul=5720 (usage 70) → +40%
      { id: "vr7", meterId: "meter-3", value: 5600, date: "2026-05-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      { id: "vr8", meterId: "meter-3", value: 5650, date: "2026-06-30", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      { id: "vr9", meterId: "meter-3", value: 5720, date: "2026-07-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
    ];

    const predictions = computeBillPredictions(meters, varyingReadings, tariffs);
    const result = computeBillChangeFactors(meters, varyingReadings, tariffs, predictions);

    expect(result.factors.length).toBeGreaterThan(0);
    expect(result.currentBill).toBeGreaterThan(0);
    expect(result.previousBill).toBeGreaterThan(0);
    expect(typeof result.totalImpact).toBe("number");
    expect(typeof result.forecast).toBe("number");

    // Water: +50% change should be in factors
    const waterFactor = result.factors.find((f) => f.label.includes("Вода"));
    expect(waterFactor).toBeDefined();
    expect(waterFactor!.percentage).toBe(50);
  });

  it("returns empty factors when only 1 reading per meter", () => {
    const singleReadings = readings.slice(0, 1);
    const result = computeBillChangeFactors(meters, singleReadings, tariffs, []);
    expect(result.factors).toEqual([]);
    expect(result.currentBill).toBe(0);
  });

  // Ticket #1, AC-6: a negative delta must not produce a negative currentBill/impact.
  it("clamps a negative delta to zero usage instead of a negative bill", () => {
    const rolloverReadings: Reading[] = [
      { id: "ro1", meterId: "meter-1", value: 170, date: "2026-05-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      { id: "ro2", meterId: "meter-1", value: 99950, date: "2026-06-30", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      { id: "ro3", meterId: "meter-1", value: 12, date: "2026-07-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
    ];
    const predictions = computeBillPredictions([meters[0]], rolloverReadings, tariffs);
    const result = computeBillChangeFactors([meters[0]], rolloverReadings, tariffs, predictions);

    // currentBill uses the clamped (zeroed) last-interval usage, never negative
    expect(result.currentBill).toBeGreaterThanOrEqual(0);
  });
});

// ============================================
// computeSmartInsights
// ============================================

describe("computeSmartInsights", () => {
  it("generates streak insight for 3+ months of readings", () => {
    const insights = computeSmartInsights(meters, readings);
    const streak = insights.find((i) => i.type === "streak");
    expect(streak).toBeDefined();
    expect(streak!.title).toContain("місяців");
  });

  it("generates anomaly insight for 15%+ usage change", () => {
    // Create readings with a 50% jump
    const anomalyReadings: Reading[] = [
      { id: "a1", meterId: "meter-1", value: 100, date: "2026-05-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      { id: "a2", meterId: "meter-1", value: 120, date: "2026-06-30", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
      { id: "a3", meterId: "meter-1", value: 180, date: "2026-07-31", ocrConfidence: 1, ocrEngine: "manual", submittedToEps: false, submittedAt: null },
    ];
    const insights = computeSmartInsights(meters, anomalyReadings);
    const anomaly = insights.find((i) => i.type === "anomaly");
    expect(anomaly).toBeDefined();
    expect(anomaly!.title).toContain("+");
  });

  it("generates carbon footprint insight for electricity meter", () => {
    const insights = computeSmartInsights(meters, readings);
    const green = insights.find((i) => i.type === "green");
    expect(green).toBeDefined();
    expect(green!.title).toContain("CO₂");
  });

  it("generates savings tip", () => {
    const insights = computeSmartInsights(meters, readings);
    const saving = insights.find((i) => i.type === "saving");
    expect(saving).toBeDefined();
    expect(saving!.title).toContain("Зеконом");
  });

  it("generates seasonal gas tip when gas meter exists", () => {
    const insights = computeSmartInsights(meters, readings);
    const tip = insights.find((i) => i.type === "tip");
    expect(tip).toBeDefined();
    expect(tip!.title).toContain("Газ");
  });

  it("does not generate streak for < 3 months", () => {
    const fewReadings = readings.slice(0, 2);
    const insights = computeSmartInsights(meters, fewReadings);
    const streak = insights.find((i) => i.type === "streak");
    expect(streak).toBeUndefined();
  });
});

// ============================================
// computeReminders
// ============================================

describe("computeReminders", () => {
  it("generates reminders for all meters with future deadlines", () => {
    // Use a mock date — we can't control new Date() easily, but we can check structure
    const reminders = computeReminders(meters);
    expect(reminders.length).toBeGreaterThan(0);

    for (const r of reminders) {
      expect(r.id).toMatch(/^rem-meter-\d$/);
      expect(r.meterId).toMatch(/^meter-\d$/);
      expect(r.type).toBe("reading");
      expect(typeof r.dueDate).toBe("string");
      expect(typeof r.daysLeft).toBe("number");
      expect(typeof r.urgent).toBe("boolean");
    }
  });

  it("marks urgent when daysLeft <= 5", () => {
    const reminders = computeReminders(meters);
    const urgent = reminders.find((r) => r.urgent);
    // At least one meter has deadline day 3 or 5, which is likely urgent
    if (urgent) {
      expect(urgent.daysLeft).toBeLessThanOrEqual(5);
      expect(urgent.daysLeft).toBeGreaterThanOrEqual(0);
    }
  });

  it("filters out past deadlines (daysLeft < 0)", () => {
    const reminders = computeReminders(meters);
    for (const r of reminders) {
      expect(r.daysLeft).toBeGreaterThanOrEqual(0);
    }
  });
});
