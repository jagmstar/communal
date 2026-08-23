"use client";

import { Droplet, Zap, Flame, Building, Receipt, Thermometer, ChevronRight } from "lucide-react";
import { Meter } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  droplet: Droplet,
  zap: Zap,
  flame: Flame,
  building: Building,
  receipt: Receipt,
  thermometer: Thermometer,
};

interface MeterCardProps {
  meter: Meter;
  onClick?: () => void;
  compact?: boolean;
}

export function MeterCard({ meter, onClick, compact = false }: MeterCardProps) {
  const Icon = iconMap[meter.icon] || Receipt;
  const lastReading = meter.lastReading ?? 0;
  const formattedReading = meter.serviceType === "electricity"
    ? lastReading.toLocaleString("uk-UA")
    : lastReading.toFixed(2);

  if (compact) {
    return (
      <button
        onClick={onClick}
        role="button"
        aria-label={`${meter.serviceName}, лічильник номер ${meter.meterNumber}, останній показник ${formattedReading} ${meter.unit}`}
        className="card-hover flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:border-primary-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: meter.colorLight, color: meter.color }}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium text-foreground">{meter.serviceName}</p>
          <p className="text-xs text-muted-foreground">№{meter.meterNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-body font-semibold tabular-nums">{formattedReading}</p>
          <p className="text-xs text-muted-foreground">{meter.unit}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      role="button"
      aria-label={`${meter.serviceName}, лічильник номер ${meter.meterNumber}, останній показник ${formattedReading} ${meter.unit}`}
      className="card-hover w-full overflow-hidden rounded-2xl border border-border bg-surface text-left transition-colors hover:border-primary-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none"
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: meter.colorLight, color: meter.color }}
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">{meter.serviceName}</p>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Лічильник №{meter.meterNumber}</p>
        </div>
      </div>
      <div className="flex items-end justify-between border-t border-border bg-muted/30 px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Останній показник</p>
          <p className="text-lg font-bold tabular-nums text-foreground">
            {formattedReading} <span className="text-body font-normal text-muted-foreground">{meter.unit}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Передати до</p>
          <p className="text-body font-medium text-foreground">{meter.submitDeadlineDay} числа</p>
        </div>
      </div>
    </button>
  );
}
