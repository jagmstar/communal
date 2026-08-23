"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Droplet, Zap, Flame, Building, Receipt, Thermometer,
  TrendingUp, TrendingDown, Download,
} from "lucide-react";
import { fetchMeters, fetchReadings, fetchTariffs } from "@/lib/api";
import { computeMonthlyUsage, getAvailableYears } from "@/lib/calculations";
import { UsageChart } from "@/components/UsageChart";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import type { Meter, Reading, Tariff } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  droplet: Droplet,
  zap: Zap,
  flame: Flame,
  building: Building,
  receipt: Receipt,
  thermometer: Thermometer,
};

/** Generate CSV from reading history and trigger download (AC-5.4) */
function exportToCsv(
  meterName: string,
  readings: { date: string; value: number; delta: number; submitted: boolean }[],
) {
  const headers = ["Дата", "Лічильник", "Показник", "Різниця", "Передано на EPS"];
  const rows = readings.map((r) => [
    r.date,
    meterName,
    r.value.toString(),
    r.delta > 0 ? `+${r.delta}` : r.delta.toString(),
    r.submitted ? "Так" : "Ні",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `communal-${meterName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedMeterId, setSelectedMeterId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(false);
      try {
        const [metersData, readingsData, tariffsData] = await Promise.all([
          fetchMeters(),
          fetchReadings(),
          fetchTariffs(),
        ]);
        if (cancelled) return;
        setMeters(metersData);
        setReadings(readingsData);
        setTariffs(tariffsData);
        setSelectedMeterId(metersData[0]?.id || "");
      } catch {
        if (cancelled) return;
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const availableYears = useMemo(() => getAvailableYears(readings), [readings]);
  const selectedMeter = useMemo(() => meters.find(m => m.id === selectedMeterId), [meters, selectedMeterId]);
  const usageData = useMemo(() => {
    if (!selectedMeterId) return [];
    return computeMonthlyUsage(selectedMeterId, readings, meters, tariffs);
  }, [selectedMeterId, readings, meters, tariffs]);

  const Icon = useMemo(() => selectedMeter ? (iconMap[selectedMeter.icon] || Receipt) : Receipt, [selectedMeter]);
  const tariff = useMemo(() => tariffs.find(t => t.serviceType === selectedMeter?.serviceType), [tariffs, selectedMeter]);

  // Filter readings by selected year and meter
  const filteredReadings = useMemo(() => {
    const meterReadings = readings
      .filter((r) => r.meterId === selectedMeterId)
      .filter((r) => selectedYear === "all" || new Date(r.date).getFullYear() === selectedYear)
      .sort((a, b) => a.date.localeCompare(b.date));

    return meterReadings.map((reading, idx) => {
      const prev = meterReadings[idx - 1];
      const delta = prev ? Math.round((reading.value - prev.value) * 100) / 100 : 0;
      return {
        date: reading.date,
        value: reading.value,
        delta,
        submitted: reading.submittedToEps,
      };
    }).reverse();
  }, [selectedMeterId, selectedYear, readings]);

  // Calculate trend
  const lastUsage = usageData[usageData.length - 1]?.usage || 0;
  const prevUsage = usageData[usageData.length - 2]?.usage || 0;
  const trend = prevUsage > 0 ? ((lastUsage - prevUsage) / prevUsage) * 100 : 0;
  const trendUp = trend > 0;
  const hasNoReadings = filteredReadings.length === 0;

  if (loading) {
    return <LoadingState message="Завантажую історію..." />;
  }

  if (error || !selectedMeter) {
    return (
      <ErrorState
        title="Не вдалося завантажити дані"
        message="Перевірте підключення та спробуйте ще раз."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Історія</h1>
        <p className="text-body text-muted-foreground">Витрата та платежі за місяцями</p>
      </header>

      {/* Meter selector pills (AC-5.1) */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" role="tablist" aria-label="Вибір лічильника">
        {meters.map((meter) => {
          const MeterIcon = iconMap[meter.icon] || Receipt;
          const isSelected = meter.id === selectedMeterId;
          return (
            <button
              key={meter.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedMeterId(meter.id)}
              className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 py-2 text-body font-medium transition-all ${
                isSelected
                  ? "text-white shadow-md"
                  : "border border-border bg-surface text-muted-foreground"
              }`}
              style={isSelected ? { backgroundColor: meter.color } : undefined}
            >
              <MeterIcon className="h-4 w-4" strokeWidth={2} />
              {meter.serviceName.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Date range filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="year-filter" className="text-body text-muted-foreground">Рік:</label>
        <select
          id="year-filter"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value === "all" ? "all" : parseInt(e.target.value))}
          className="h-10 rounded-lg border border-border-strong bg-surface px-3 text-body text-foreground focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
        >
          <option value="all">Усі роки</option>
          {availableYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Empty state (AC-5.7) */}
      {hasNoReadings ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-body text-muted-foreground">
            Поки немає даних. Передайте перший показник, щоб побачити графік.
          </p>
        </div>
      ) : (
        <>
          {/* Current meter info */}
          <div className="rounded-2xl border border-border bg-surface p-4 animate-fade-in">
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
                  <p className="text-body font-semibold">{tariff.value} {tariff.unit}</p>
                </div>
              )}
            </div>

            {/* Trend badge (AC-5.4) */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  trendUp
                    ? "bg-secondary-100 text-secondary-700"
                    : "bg-success-light text-success"
                }`}
              >
                {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend).toFixed(1)}%
              </div>
              <span className="text-xs text-muted-foreground">vs попередній місяць</span>
            </div>

            {/* Chart */}
            <UsageChart data={usageData} color={selectedMeter.color} />

            {/* Summary row (AC-6.1) */}
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

          {/* Reading history table */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Історія показників</h2>
              <button
                onClick={() => exportToCsv(selectedMeter.serviceName, filteredReadings)}
                aria-label="Експортувати історію показників в CSV файл"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-body font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-4 w-4" />
                Експорт в CSV
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              {/* Table header */}
              <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2">
                <span className="flex-1 text-xs font-semibold text-muted-foreground">Дата</span>
                <span className="flex-1 text-right text-xs font-semibold text-muted-foreground">Показник</span>
                <span className="flex-1 text-right text-xs font-semibold text-muted-foreground">Δ</span>
                <span className="text-xs font-semibold text-muted-foreground">EPS</span>
              </div>
              {/* Table rows */}
              {filteredReadings.map((reading, idx) => (
                <div
                  key={`${reading.date}-${reading.value}`}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx < filteredReadings.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="flex-1 text-body text-foreground">
                    {new Date(reading.date).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="flex-1 text-right text-body font-semibold tabular-nums text-foreground">
                    {reading.value.toLocaleString("uk-UA")}
                  </span>
                  <span className={`flex-1 text-right text-body tabular-nums ${reading.delta > 0 ? "text-secondary-600" : "text-success"}`}>
                    {reading.delta > 0 ? "+" : ""}{reading.delta}
                  </span>
                  <span>
                    {reading.submitted ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-light">
                        <span className="text-xs text-success">✓</span>
                      </span>
                    ) : (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                        <span className="text-xs text-muted-foreground">—</span>
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Monthly breakdown (AC-5.5) */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">По місяцях</h2>
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              {usageData.slice().reverse().map((item, idx) => (
                <div
                  key={`${item.month}-${idx}`}
                  className={`flex items-center justify-between p-3 ${
                    idx < usageData.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div>
                    <p className="text-body font-medium capitalize">{item.month}</p>
                    <p className="text-xs text-muted-foreground">{item.usage} {selectedMeter.unit}</p>
                  </div>
                  <p className="text-body font-semibold tabular-nums">
                    {item.cost.toLocaleString("uk-UA", { minimumFractionDigits: 2 })} ₴
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Year-over-year placeholder (AC-5.6) */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Аналітика</h2>
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center">
          <p className="text-body text-muted-foreground">
            📊 Річні порівняння та аналітика будуть доступні після 6 місяців використання
          </p>
        </div>
      </section>
    </div>
  );
}
