"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Droplet, Zap, Flame, Building, Receipt, Thermometer,
  TrendingUp, TrendingDown, Minus, Download, ChevronDown,
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

/**
 * Short tab label per design spec §2.3 / §4 (P0 bug fix, audit #2).
 * Previously every tab used `meter.serviceName.split(" ")[0]`, which
 * collapsed "Вода (гаряча)" and "Вода (холодна)" to the same "Вода" label
 * with no way to tell hot from cold apart. Water meters now read "Гаряча"
 * / "Холодна"; electricity is shortened to "Електро" (full name is still
 * used elsewhere, e.g. the meter info card below the tabs).
 */
function tabLabel(meter: Meter): string {
  const name = meter.serviceName.toLowerCase();
  if (meter.serviceType === "water") {
    if (name.includes("гаряч")) return "Гаряча";
    if (name.includes("холодн")) return "Холодна";
    return meter.serviceName.split(" ")[0];
  }
  if (meter.serviceType === "electricity") return "Електро";
  return meter.serviceName.split(" ")[0];
}

/** Distinct hot/cold water tint per design spec §1.1 — never rely on hue
 * alone since both are "blue"; label always carries the distinction too. */
function waterTint(meter: Meter | undefined): { color: string; light: string } | null {
  if (!meter || meter.serviceType !== "water") return null;
  const name = meter.serviceName.toLowerCase();
  if (name.includes("холодн")) return { color: "#38bdf8", light: "#e0f2fe" };
  return { color: "#0ea5e9", light: "#e0f2fe" };
}

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
  // Design spec §2.3: raw table is unbounded and grows unusably long after a
  // year of use — cap default view to last 6 rows + "Показати більше".
  const [showAllReadings, setShowAllReadings] = useState(false);

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
  // Design spec §4 / audit #4: flat/no-change usage previously showed
  // "0.0%" in a success-green chip, which read as a bug (green implies a
  // positive change happened). A |trend| below 0.5% now renders as a
  // neutral "без змін" chip instead of misleadingly celebrating "0%".
  const trendFlat = Math.abs(trend) < 0.5;
  const hasNoReadings = filteredReadings.length === 0;
  const visibleReadings = showAllReadings ? filteredReadings : filteredReadings.slice(0, 6);
  const tint = waterTint(selectedMeter);

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

      {/* Meter selector pills (AC-5.1). Labels + tint per design spec §2.3 /
          §4 (P0 bug fix, audit #2): hot/cold water are now "Гаряча" /
          "Холодна" with distinct tints, not two identical "Вода" tabs. */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" role="tablist" aria-label="Вибір лічильника">
        {meters.map((meter) => {
          const MeterIcon = iconMap[meter.icon] || Receipt;
          const isSelected = meter.id === selectedMeterId;
          const meterTint = waterTint(meter);
          const activeColor = meterTint?.color || meter.color;
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
              style={isSelected ? { backgroundColor: activeColor } : undefined}
            >
              <MeterIcon className="h-4 w-4" strokeWidth={2} />
              {tabLabel(meter)}
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

      {/* Empty state (AC-5.7). Copy + CTA per design spec §3: dashed-border
          placeholder matching the eventual filled-card shape so layout
          doesn't jump once data arrives, plus an inline CTA to the submit
          flow rather than a dead-end message. */}
      {hasNoReadings ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center space-y-3">
          <p className="text-body text-muted-foreground">
            Це ваш перший місяць із цим лічильником — передайте перший показник, щоб побачити графік.
          </p>
          <Link
            href="/submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary-500 px-5 text-body font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-600 active:scale-95 transition-all"
          >
            Передати показник
          </Link>
        </div>
      ) : (
        <>
          {/* Current meter info */}
          <div className="rounded-2xl border border-border bg-surface p-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: tint?.light || selectedMeter.colorLight, color: tint?.color || selectedMeter.color }}
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

            {/* Trend badge (AC-5.4). Design spec §4 / audit #4: flat usage
                (|trend| < 0.5%) now gets a neutral gray "без змін" chip
                instead of a misleading success-green "0.0%". Every state
                carries a glyph + word, not just a color (WCAG). */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  trendFlat
                    ? "bg-muted text-muted-foreground"
                    : trendUp
                    ? "bg-secondary-100 text-secondary-700"
                    : "bg-success-light text-success"
                }`}
              >
                {trendFlat ? (
                  <Minus className="h-3 w-3" />
                ) : trendUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trendFlat ? "без змін" : `${Math.abs(trend).toFixed(1)}%`}
              </div>
              <span className="text-xs text-muted-foreground">vs попередній місяць</span>
            </div>

            {/* Chart — single labeled axis, one scale, gridlines (design
                spec §2.3 / audit #3; see UsageChart.tsx) */}
            <UsageChart data={usageData} color={tint?.color || selectedMeter.color} unit={selectedMeter.unit} />

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
              {/* Table rows — capped to 6 by default (design spec §2.3):
                  the raw table is unbounded and grows unusably long after a
                  year of readings. */}
              {visibleReadings.map((reading, idx) => (
                <div
                  key={`${reading.date}-${reading.value}`}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx < visibleReadings.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="flex-1 text-body text-foreground">
                    {new Date(reading.date).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="flex-1 text-right text-body font-semibold tabular-nums text-foreground">
                    {reading.value.toLocaleString("uk-UA")}
                  </span>
                  <span className={`flex-1 text-right text-body tabular-nums ${reading.delta > 0 ? "text-secondary-600" : reading.delta < 0 ? "text-success" : "text-muted-foreground"}`}>
                    {reading.delta > 0 ? "+" : ""}{reading.delta === 0 ? "0" : reading.delta}
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
            {filteredReadings.length > 6 && (
              <button
                onClick={() => setShowAllReadings((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface py-2.5 text-body font-medium text-foreground hover:bg-muted transition-colors"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showAllReadings ? "rotate-180" : ""}`} />
                {showAllReadings ? "Показати менше" : `Показати більше (${filteredReadings.length - 6})`}
              </button>
            )}
          </section>

          {/* Monthly breakdown — month cards with delta chips vs previous
              month (design spec §2.3). Each card shows the big tabular-num
              reading, a delta chip (▲ danger-tinted if usage rose, ▼
              success-tinted if it fell, neutral "без змін" if flat), and
              the cost — replacing the old flat two-column bar-only view. */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">По місяцях</h2>
            <div className="space-y-2">
              {usageData.slice().reverse().map((item, idx, arr) => {
                const prevItem = arr[idx + 1]; // arr is reversed, so idx+1 is the older month
                const delta = prevItem ? Math.round((item.usage - prevItem.usage) * 100) / 100 : null;
                const deltaFlat = delta !== null && Math.abs(delta) < 0.05;
                const deltaUp = delta !== null && delta > 0;
                return (
                  <div
                    key={`${item.month}-${idx}`}
                    className="rounded-2xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body font-medium capitalize">{item.month}</p>
                        <p className="text-xl font-bold tabular-nums mt-0.5">
                          {item.usage} <span className="text-xs font-normal text-muted-foreground">{selectedMeter.unit}</span>
                        </p>
                      </div>
                      <div className="text-right space-y-1.5">
                        {delta !== null && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              deltaFlat
                                ? "bg-muted text-muted-foreground"
                                : deltaUp
                                ? "bg-danger-light text-danger"
                                : "bg-success-light text-success"
                            }`}
                          >
                            {deltaFlat ? (
                              <Minus className="h-3 w-3" />
                            ) : deltaUp ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {deltaFlat ? "без змін" : `${delta > 0 ? "+" : ""}${delta} ${selectedMeter.unit}`}
                          </span>
                        )}
                        <p className="text-body font-semibold tabular-nums">
                          {item.cost.toLocaleString("uk-UA", { minimumFractionDigits: 2 })} ₴
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Year-over-year placeholder (AC-5.6). Copy softened per design spec
          §4: the old wording ("будуть доступні після 6 місяців
          використання") read as generic/patronizing; this is warmer and
          more consistent with the "Тепло домівки" tone while saying the
          same thing. Shown once, not repeated per meter. */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Аналітика</h2>
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center">
          <p className="text-body text-muted-foreground">
            📊 Ще накопичуємо дані — з&apos;явиться після 6 місяців
          </p>
        </div>
      </section>
    </div>
  );
}
