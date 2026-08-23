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
  predictedUsage: number;
  predictedAmount: number;
  tariff: number;
  confidence: number;
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
