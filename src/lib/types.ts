export type ServiceType = "water" | "electricity" | "gas" | "heating" | "osbb" | "other";

export interface Meter {
  id: string;
  meterNumber: string;
  serviceType: ServiceType;
  serviceName: string;
  unit: string;
  lastReading: number | null;
  lastReadingDate: string | null;
  submitDeadlineDay: number;
  submitWindowStart: number;
  color: string;
  colorLight: string;
  icon: string;
}

export interface Reading {
  id: string;
  meterId: string;
  value: number;
  date: string;
  photoUrl?: string;
  ocrConfidence: number;
  ocrEngine: "mlkit" | "azure" | "manual" | "tesseract";
  submittedToEps: boolean;
  submittedAt: string | null;
}

export interface Tariff {
  id: string;
  serviceType: ServiceType;
  serviceName: string;
  value: number;
  unit: string;
  effectiveFrom: string;
  source: string;
}

export interface BillPrediction {
  meterId: string;
  serviceName: string;
  /**
   * `null` when there isn't enough plausible reading data to predict this
   * month's usage/amount (ticket fix-communal-impossible-bill-forecast,
   * 2026-09-20). UI must render an honest "дані уточнюються" state instead
   * of a numeric ₴0,00 or a fabricated figure — see `dataSufficient`.
   */
  predictedUsage: number | null;
  predictedAmount: number | null;
  tariff: number;
  confidence: number;
  /**
   * False when computeBillPredictions() could not find two plausible,
   * consecutive readings for this meter (fewer than 2 rows, or the delta
   * between the last two readings exceeds the meter's own current
   * lastReading — a physical impossibility that flags mismatched-source
   * data, e.g. a stray test reading diffed against a real EPS snapshot).
   * Consumers MUST treat predictedUsage/predictedAmount as unusable when
   * this is false, and MUST exclude the row from any "Разом" total.
   */
  dataSufficient: boolean;
}

export interface Reminder {
  id: string;
  meterId: string;
  serviceName: string;
  type: "reading" | "payment";
  dueDate: string;
  daysLeft: number;
  urgent: boolean;
}

export interface Settings {
  epsUsername: string | null;
  epsAccountNumber: string | null;
  notificationReading: boolean;
  notificationPayment: boolean;
  notificationTariff: boolean;
  notificationAnomaly: boolean;
  userName: string | null;
  userAddress: string | null;
}

/**
 * Real EPS payment/charge history entry (komunalka-eps-real-data-20260917b).
 * Backed by the `payments_history` table — see
 * src/lib/db/migrations/2026-09-17-eps-history.sql. Never generated from
 * mock/seed data; `source` distinguishes how this row was captured.
 */
export interface PaymentHistoryEntry {
  id: string;
  serviceName: string;
  payerNumber: string;
  /**
   * EPS's own coarse month label for `source='snapshot'` rows (e.g.
   * "Серпня"). For `source='cabinet_export'` rows (full per-receipt
   * history, ticket komunalka-eps-real-data-impl-20260922) this column
   * instead holds the EPS receipt serial — it is the dedup key, NOT a
   * display label for those rows. UI must prefer `paymentDate` when
   * present and only fall back to `period` as a month label.
   */
  period: string;
  debtBefore: number;
  paidLastMonth: number;
  charged: number;
  subsidy: number;
  dueAmount: number;
  paidThisMonth: number;
  balance: number;
  source: "snapshot" | "cabinet_export" | "manual";
  fetchedAt: string;
  /** Exact receipt date (2026-09-22 full-history migration). Null for older snapshot rows that never carried one. */
  paymentDate: string | null;
  /** EPS human-readable receipt number, distinct from the `period` dedup key above. Null for snapshot rows. */
  receiptNumber: string | null;
}

/**
 * Real EPS meter-reading history entry (readings_history table, full
 * per-reading history — komunalka-eps-real-data-impl-20260922). Distinct
 * from the legacy `Reading` type: this is never derived from mock/seed
 * data and spans the account's full available EPS history, not just the
 * app's own manual-submission log.
 */
export interface ReadingHistoryEntry {
  id: string;
  meterNumber: string;
  serviceName: string;
  value: number;
  readingDate: string | null;
  source: "snapshot" | "cabinet_export" | "manual";
  fetchedAt: string;
}

export interface NotificationSettings {
  reading: boolean;
  payment: boolean;
  tariff: boolean;
  anomaly: boolean;
}

export interface UserSettings {
  epsUsername: string | null;
  epsAccountNumber: string | null;
  epsConnected: boolean;
  notification: NotificationSettings;
  userName: string;
  userAddress: string;
}

export const SERVICE_CONFIG: Record<ServiceType, {
  label: string;
  labelUa: string;
  unit: string;
  color: string;
  colorLight: string;
  icon: string;
  gradient: string;
}> = {
  water: {
    label: "Water",
    labelUa: "Вода",
    unit: "м³",
    color: "#0ea5e9",
    colorLight: "#e0f2fe",
    icon: "droplet",
    gradient: "from-primary-500 to-primary-600",
  },
  electricity: {
    label: "Electricity",
    labelUa: "Електроенергія",
    unit: "кВт·год",
    color: "#f59e0b",
    colorLight: "#fef3c7",
    icon: "zap",
    gradient: "from-amber-500 to-yellow-500",
  },
  gas: {
    label: "Gas",
    labelUa: "Газ",
    unit: "м³",
    color: "#f97316",
    colorLight: "#ffedd5",
    icon: "flame",
    gradient: "from-secondary-500 to-secondary-400",
  },
  heating: {
    label: "Heating",
    labelUa: "Опалення",
    unit: "Гкал",
    color: "#ef4444",
    colorLight: "#fee2e2",
    icon: "thermometer",
    gradient: "from-heating to-heating",
  },
  osbb: {
    label: "OSBB",
    labelUa: "ОСББ",
    unit: "₴",
    color: "#64748b",
    colorLight: "#f1f5f9",
    icon: "building",
    gradient: "from-osbb to-osbb",
  },
  other: {
    label: "Other",
    labelUa: "Інше",
    unit: "₴",
    color: "#64748b",
    colorLight: "#f1f5f9",
    icon: "receipt",
    gradient: "from-slate-500 to-gray-500",
  },
};
