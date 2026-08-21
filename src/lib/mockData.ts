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
