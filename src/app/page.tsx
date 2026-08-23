"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, Camera } from "lucide-react";
import { fetchMeters, fetchReadings, fetchTariffs } from "@/lib/api";
import {
  computeTotalPredictedBill,
  computeReminders,
  computeBillPredictions,
  pluralize,
} from "@/lib/calculations";
import { MeterCard } from "@/components/MeterCard";
import { DeadlineAlert } from "@/components/DeadlineAlert";
import { SmartInsights } from "@/components/SmartInsights";
import { BillExplanation } from "@/components/BillExplanation";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import type { Meter, Reading, Tariff, Reminder, BillPrediction } from "@/lib/types";

export default function HomePage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [billPredictions, setBillPredictions] = useState<BillPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        setReminders(computeReminders(metersData));
        setBillPredictions(computeBillPredictions(metersData, readingsData, tariffsData));
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

  if (loading) {
    return <LoadingState message="Завантажую дані..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Не вдалося завантажити дані"
        message="Перевірте підключення до інтернету та спробуйте ще раз."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const totalBill = useMemo(() => computeTotalPredictedBill(billPredictions), [billPredictions]);
  const urgentCount = useMemo(() => reminders.filter((r) => r.urgent).length, [reminders]);
  const currentMonth = useMemo(() => new Date().toLocaleDateString("uk-UA", { month: "long" }), []);

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <header className="animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight">Привіт, Роман 👋</h1>
        </div>
        <p className="text-body text-muted-foreground">
          {new Date().toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </header>

      {/* Predicted Bill Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 p-5 text-white shadow-lg shadow-primary-500/20 animate-slide-up">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -right-12 -bottom-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary-100" />
            <p className="text-body font-medium text-primary-50">Прогноз рахунку за {currentMonth}</p>
          </div>
          <p className="text-4xl font-bold tracking-tight tabular-nums">
            {totalBill.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-primary-100">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {meters.length} {pluralize(meters.length, ["лічильник", "лічильники", "лічильників"])}
            </span>
            <span>•</span>
            <span>Оновлено сьогодні</span>
          </div>
        </div>
      </div>

      {/* Deadline Alerts */}
      {urgentCount > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-secondary-500" />
              Нагадування
            </h2>
            <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-700">
              {urgentCount} термінових
            </span>
          </div>
          <DeadlineAlert reminders={reminders} />
        </section>
      )}

      {/* Quick Action */}
      <Link
        href="/submit"
        className="card-hover flex items-center justify-between rounded-2xl border border-primary-200 bg-primary-50 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-md">
            <Camera className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Передати показники</p>
            <p className="text-xs text-muted-foreground">Фото → OCR → EPS одним тапом</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-primary-600" />
      </Link>

      {/* Smart Insights */}
      <SmartInsights meters={meters} readings={readings} />

      {/* Meters */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Мої лічильники</h2>
        <div className="space-y-3">
          {meters.map((meter, idx) => (
            <div key={meter.id} className={`animate-fade-in stagger-${Math.min(idx + 1, 5)}`}>
              <MeterCard meter={meter} />
            </div>
          ))}
        </div>
      </section>

      {/* Bill Breakdown */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Деталі рахунку</h2>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          {billPredictions.map((pred, idx) => (
            <div
              key={pred.meterId}
              className={`flex items-center justify-between p-3 ${
                idx < billPredictions.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: meters.find((m) => m.id === pred.meterId)?.color,
                  }}
                />
                <span className="text-body text-foreground">{pred.serviceName}</span>
              </div>
              <div className="text-right">
                <p className="text-body font-semibold tabular-nums">
                  {pred.predictedAmount.toLocaleString("uk-UA", { minimumFractionDigits: 2 })} ₴
                </p>
                <p className="text-xs text-muted-foreground">
                  {pred.predictedUsage} {meters.find((m) => m.id === pred.meterId)?.unit}
                </p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t-2 border-border-strong bg-muted/30 p-3">
            <span className="font-semibold">Разом</span>
            <span className="font-bold text-lg tabular-nums">
              {totalBill.toLocaleString("uk-UA", { minimumFractionDigits: 2 })} ₴
            </span>
          </div>
        </div>
      </section>

      {/* Bill Explanation */}
      <BillExplanation meters={meters} readings={readings} tariffs={tariffs} billPredictions={billPredictions} />
    </div>
  );
}
