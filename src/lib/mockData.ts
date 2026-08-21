import { Meter, Reading, Tariff, Reminder, BillPrediction, ServiceType } from "./types";

export const mockMeters: Meter[] = [
  {
    id: "m1",
    meterNumber: "14091126",
    serviceType: "water",
    serviceName: "Вода (гаряча)",
    unit: "м³",
    lastReading: 182.34,
    lastReadingDate: "2026-07-31",
    submitDeadlineDay: 31,
    submitWindowStart: 25,
    color: "#3b82f6",
    colorLight: "#dbeafe",
    icon: "droplet",
  },
  {
    id: "m2",
    meterNumber: "14097821",
    serviceType: "water",
    serviceName: "Вода (холодна)",
    unit: "м³",
    lastReading: 345.67,
    lastReadingDate: "2026-07-31",
    submitDeadlineDay: 31,
    submitWindowStart: 25,
    color: "#3b82f6",
    colorLight: "#dbeafe",
    icon: "droplet",
  },
  {
    id: "m3",
    meterNumber: "2400786276",
    serviceType: "electricity",
    serviceName: "Електроенергія",
    unit: "кВт·год",
    lastReading: 12453,
    lastReadingDate: "2026-07-31",
    submitDeadlineDay: 3,
    submitWindowStart: 28,
    color: "#f59e0b",
    colorLight: "#fef3c7",
    icon: "zap",
  },
  {
    id: "m4",
    meterNumber: "98040",
    serviceType: "gas",
    serviceName: "Газ",
    unit: "м³",
    lastReading: 5678,
    lastReadingDate: "2026-07-31",
    submitDeadlineDay: 5,
    submitWindowStart: 1,
    color: "#f97316",
    colorLight: "#ffedd5",
    icon: "flame",
  },
];

export const mockTariffs: Tariff[] = [
  {
    id: "t1",
    serviceType: "water",
    serviceName: "Вода",
    value: 35.20,
    unit: "₴/м³",
    effectiveFrom: "2026-01-01",
    source: "eps",
  },
  {
    id: "t2",
    serviceType: "electricity",
    serviceName: "Електроенергія",
    value: 4.32,
    unit: "₴/кВт·год",
    effectiveFrom: "2026-01-01",
    source: "nerc",
  },
  {
    id: "t3",
    serviceType: "gas",
    serviceName: "Газ (розподіл)",
    value: 7.99,
    unit: "₴/м³",
    effectiveFrom: "2026-01-01",
    source: "eps",
  },
  {
    id: "t4",
    serviceType: "gas",
    serviceName: "Нафтогаз (постачання)",
    value: 13.87,
    unit: "₴/м³",
    effectiveFrom: "2026-01-01",
    source: "naftogaz",
  },
];

export const mockReadings: Reading[] = [
  // Water hot (m1)
  { id: "r1", meterId: "m1", value: 178.12, date: "2026-05-31", ocrConfidence: 0.98, ocrEngine: "mlkit", submittedToEps: true, submittedAt: "2026-05-31T10:00:00" },
  { id: "r2", meterId: "m1", value: 180.23, date: "2026-06-30", ocrConfidence: 0.95, ocrEngine: "mlkit", submittedToEps: true, submittedAt: "2026-06-30T10:00:00" },
  { id: "r3", meterId: "m1", value: 182.34, date: "2026-07-31", ocrConfidence: 0.97, ocrEngine: "mlkit", submittedToEps: true, submittedAt: "2026-07-31T10:00:00" },
  // Water cold (m2)
  { id: "r4", meterId: "m2", value: 338.45, date: "2026-05-31", ocrConfidence: 0.96, ocrEngine: "mlkit", submittedToEps: true, submittedAt: "2026-05-31T10:00:00" },
  { id: "r5", meterId: "m2", value: 342.01, date: "2026-06-30", ocrConfidence: 0.99, ocrEngine: "mlkit", submittedToEps: true, submittedAt: "2026-06-30T10:00:00" },
  { id: "r6", meterId: "m2", value: 345.67, date: "2026-07-31", ocrConfidence: 0.94, ocrEngine: "mlkit", submittedToEps: true, submittedAt: "2026-07-31T10:00:00" },
  // Electricity (m3)
  { id: "r7", meterId: "m3", value: 11890, date: "2026-05-31", ocrConfidence: 0.92, ocrEngine: "mlkit", submittedToEps: true, submittedAt: "2026-05-31T10:00:00" },
  { id: "r8", meterId: "m3", value: 12167, date: "2026-06-30", ocrConfidence: 0.96, ocrEngine: "mlkit", submittedToEps: true, submittedAt: "2026-06-30T10:00:00" },
  { id: "r9", meterId: "m3", value: 12453, date: "2026-07-31", ocrConfidence: 0.98, ocrEngine: "mlkit", submittedToEps: true, submittedAt: "2026-07-31T10:00:00" },
  // Gas (m4)
  { id: "r10", meterId: "m4", value: 5589, date: "2026-05-31", ocrConfidence: 0.91, ocrEngine: "mlkit", submittedToEps: true, submittedAt: "2026-05-31T10:00:00" },
  { id: "r11", meterId: "m4", value: 5634, date: "2026-06-30", ocrConfidence: 0.93, ocrEngine: "mlkit", submittedToEps: true, submittedAt: "2026-06-30T10:00:00" },
  { id: "r12", meterId: "m4", value: 5678, date: "2026-07-31", ocrConfidence: 0.97, ocrEngine: "mlkit", submittedToEps: true, submittedAt: "2026-07-31T10:00:00" },
];

export const mockReminders: Reminder[] = [
  {
    id: "rem1",
    meterId: "m4",
    serviceName: "Газ",
    type: "reading",
    dueDate: "2026-08-05",
    daysLeft: 4,
    urgent: true,
  },
  {
    id: "rem2",
    meterId: "m3",
    serviceName: "Електроенергія",
    type: "reading",
    dueDate: "2026-08-03",
    daysLeft: 2,
    urgent: true,
  },
  {
    id: "rem3",
    meterId: "m1",
    serviceName: "Вода",
    type: "reading",
    dueDate: "2026-08-31",
    daysLeft: 30,
    urgent: false,
  },
];

export const mockBillPredictions: BillPrediction[] = [
  {
    meterId: "m1",
    serviceName: "Вода (гаряча)",
    predictedUsage: 2.1,
    predictedAmount: 73.92,
    tariff: 35.20,
    confidence: 0.85,
  },
  {
    meterId: "m2",
    serviceName: "Вода (холодна)",
    predictedUsage: 3.6,
    predictedAmount: 126.72,
    tariff: 35.20,
    confidence: 0.88,
  },
  {
    meterId: "m3",
    serviceName: "Електроенергія",
    predictedUsage: 286,
    predictedAmount: 1235.52,
    tariff: 4.32,
    confidence: 0.92,
  },
  {
    meterId: "m4",
    serviceName: "Газ",
    predictedUsage: 44,
    predictedAmount: 962.36,
    tariff: 21.87,
    confidence: 0.78,
  },
];

export function getMonthlyUsage(meterId: string): { month: string; usage: number; cost: number }[] {
  const readings = mockReadings.filter(r => r.meterId === meterId).sort((a, b) => a.date.localeCompare(b.date));
  const usage: { month: string; usage: number; cost: number }[] = [];
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1];
    const curr = readings[i];
    const diff = curr.value - prev.value;
    const monthName = new Date(curr.date).toLocaleDateString("uk-UA", { month: "short" });
    const meter = mockMeters.find(m => m.id === meterId);
    const tariff = mockTariffs.find(t => t.serviceType === meter?.serviceType);
    const cost = diff * (tariff?.value || 0);
    usage.push({ month: monthName, usage: Math.round(diff * 100) / 100, cost: Math.round(cost * 100) / 100 });
  }
  return usage;
}

export function getTotalPredictedBill(): number {
  return mockBillPredictions.reduce((sum, p) => sum + p.predictedAmount, 0);
}

/**
 * Calculate bill change factors by comparing last two months of readings.
 * Returns factors that explain WHY the bill changed vs previous month.
 */
export function getBillChangeFactors(): {
  factors: { label: string; impact: number; percentage: number }[];
  totalImpact: number;
  previousBill: number;
  currentBill: number;
  forecast: number;
} {
  const factors: { label: string; impact: number; percentage: number }[] = [];

  let previousBill = 0;
  let currentBill = 0;

  for (const meter of mockMeters) {
    const readings = mockReadings
      .filter(r => r.meterId === meter.id)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (readings.length < 2) continue;

    const last = readings[readings.length - 1];
    const prev = readings[readings.length - 2];

    const lastUsage = last.value - prev.value;
    const prevUsage = prev.value - readings[readings.length - 3]?.value || prev.value;

    // Find tariff for this meter
    const tariffs = mockTariffs.filter(t => t.serviceType === meter.serviceType);
    const tariffValue = tariffs.reduce((sum, t) => sum + t.value, 0); // sum all tariffs for service

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

  // Check for tariff changes (mock: no tariff changes in data, but structure is ready)
  // If tariffs changed between months, add tariff factor

  const totalImpact = Math.round(currentBill - previousBill);
  const forecast = Math.round(getTotalPredictedBill());

  return { factors, totalImpact, previousBill: Math.round(previousBill), currentBill: Math.round(currentBill), forecast };
}

/**
 * Generate smart insights from actual meter data
 */
export function getSmartInsights(): {
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
  const allReadings = mockReadings.sort((a, b) => a.date.localeCompare(b.date));
  const months = new Set(allReadings.map(r => r.date.slice(0, 7)));
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

  // 2. Anomaly detection: check for unusual usage increases
  for (const meter of mockMeters) {
    const readings = mockReadings
      .filter(r => r.meterId === meter.id)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (readings.length < 3) continue;

    const lastUsage = readings[readings.length - 1].value - readings[readings.length - 2].value;
    const prevUsage = readings[readings.length - 2].value - readings[readings.length - 3].value;

    if (prevUsage > 0) {
      const changePct = ((lastUsage - prevUsage) / prevUsage) * 100;
      if (Math.abs(changePct) >= 15) {
        const sign = changePct > 0 ? "+" : "−";
        insights.push({
          type: "anomaly",
          title: `⚠ ${meter.serviceName} ${sign}${Math.abs(Math.round(changePct))}%`,
          description: changePct > 0
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
  const elecMeter = mockMeters.find(m => m.serviceType === "electricity");
  if (elecMeter) {
    const readings = mockReadings.filter(r => r.meterId === elecMeter.id).sort((a, b) => a.date.localeCompare(b.date));
    if (readings.length >= 2) {
      const monthlyUsage = readings[readings.length - 1].value - readings[readings.length - 2].value;
      // Ukraine electricity CO2: ~0.3 kg/kWh
      const co2kg = (monthlyUsage * 0.3).toFixed(1);
      const treesEquiv = Math.round((monthlyUsage * 0.3) / 21); // 1 tree absorbs ~21kg CO2/yr
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

  // 4. Savings tip: electricity night tariff
  insights.push({
    type: "saving",
    title: "💡 Зеконом ₴340/рік",
    description: "Перенеси 20% електро на нічний тариф (23:00-07:00) — тариф вдвічі нижчий.",
    icon: "zap",
    color: "#f59e0b",
    bgColor: "#fef3c7",
  });

  // 5. Seasonal tip: gas usage pattern
  const gasMeter = mockMeters.find(m => m.serviceType === "gas");
  if (gasMeter) {
    insights.push({
      type: "tip",
      title: "📊 Газ: сезонний патерн",
      description: "Твій газ зростає на 40% у грудні-лютому. Запаси дров зараз = зекономиш ₴500/міс взимку.",
      icon: "lightbulb",
      color: "#0891b2",
      bgColor: "#ecfeff",
    });
  }

  return insights;
}
