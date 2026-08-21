export type ServiceType = "water" | "electricity" | "gas" | "osbb" | "other";

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
  ocrEngine: "mlkit" | "azure" | "manual";
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
    color: "#3b82f6",
    colorLight: "#dbeafe",
    icon: "droplet",
    gradient: "from-blue-500 to-cyan-500",
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
    gradient: "from-orange-500 to-red-500",
  },
  osbb: {
    label: "OSBB",
    labelUa: "ОСББ",
    unit: "₴",
    color: "#8b5cf6",
    colorLight: "#ede9fe",
    icon: "building",
    gradient: "from-violet-500 to-purple-500",
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
