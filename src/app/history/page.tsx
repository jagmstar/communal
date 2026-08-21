"use client";

import { useState } from "react";
import { mockMeters, getMonthlyUsage, mockTariffs } from "@/lib/mockData";
import { UsageChart } from "@/components/UsageChart";
import { Droplet, Zap, Flame, Building, Receipt, TrendingUp, TrendingDown } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  droplet: Droplet,
  zap: Zap,
  flame: Flame,
  building: Building,
  receipt: Receipt,
};

export default function HistoryPage() {
  const [selectedMeterId, setSelectedMeterId] = useState(mockMeters[0].id);
  const selectedMeter = mockMeters.find(m => m.id === selectedMeterId)!;
  const usageData = getMonthlyUsage(selectedMeterId);
  const Icon = iconMap[selectedMeter.icon] || Receipt;
  const tariff = mockTariffs.find(t => t.serviceType === selectedMeter.serviceType);

  // Calculate trend
  const lastUsage = usageData[usageData.length - 1]?.usage || 0;
  const prevUsage = usageData[usageData.length - 2]?.usage || 0;
  const trend = prevUsage > 0 ? ((lastUsage - prevUsage) / prevUsage) * 100 : 0;
  const trendUp = trend > 0;

  return (
    <div className="px-4 pt-12 pb-4 space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Історія</h1>
        <p className="text-sm text-muted-foreground">Витрата та платежі за місяцями</p>
      </header>

      {/* Meter selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {mockMeters.map((meter) => {
          const MeterIcon = iconMap[meter.icon] || Receipt;
          const isSelected = meter.id === selectedMeterId;
          return (
            <button
              key={meter.id}
              onClick={() => setSelectedMeterId(meter.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? "text-white shadow-md"
                  : "border border-border bg-card text-muted-foreground"
              }`}
              style={isSelected ? { backgroundColor: meter.color } : undefined}
            >
              <MeterIcon className="h-4 w-4" strokeWidth={2} />
              {meter.serviceName.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Current meter info */}
      <div className="rounded-2xl border border-border bg-card p-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: selectedMeter.colorLight, color: selectedMeter.color }}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{selectedMeter.serviceName}</p>
            <p className="text-xs text-muted-foreground">№{selectedMeter.meterNumber}</p>
          </div>
          {tariff && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Тариф</p>
              <p className="text-sm font-semibold">{tariff.value} {tariff.unit}</p>
            </div>
          )}
        </div>

        {/* Trend badge */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              trendUp
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            }`}
          >
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
          <span className="text-xs text-muted-foreground">vs попередній місяць</span>
        </div>

        {/* Chart */}
        <UsageChart data={usageData} color={selectedMeter.color} />

        {/* Cost toggle */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Витрата за останній місяць</p>
            <p className="text-lg font-bold tabular-nums">
              {lastUsage} {selectedMeter.unit}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Вартість</p>
            <p className="text-lg font-bold tabular-nums">
              {(usageData[usageData.length - 1]?.cost || 0).toLocaleString("uk-UA", { minimumFractionDigits: 2 })} ₴
            </p>
          </div>
        </div>
      </div>

      {/* Monthly breakdown */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">По місяцях</h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {usageData.slice().reverse().map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 ${
                idx < usageData.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div>
                <p className="text-sm font-medium capitalize">{item.month}</p>
                <p className="text-xs text-muted-foreground">{item.usage} {selectedMeter.unit}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">
                {item.cost.toLocaleString("uk-UA", { minimumFractionDigits: 2 })} ₴
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Year-over-year placeholder */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Аналітика</h2>
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            📊 Річні порівняння та аналітика будуть доступні після 6 місяців використання
          </p>
        </div>
      </section>
    </div>
  );
}
