import Link from "next/link";
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { mockMeters, mockReminders, mockBillPredictions, getTotalPredictedBill } from "@/lib/mockData";
import { MeterCard } from "@/components/MeterCard";
import { DeadlineAlert } from "@/components/DeadlineAlert";

export default function HomePage() {
  const totalBill = getTotalPredictedBill();
  const urgentCount = mockReminders.filter(r => r.urgent).length;

  return (
    <div className="px-4 pt-12 pb-4 space-y-6">
      {/* Header */}
      <header className="animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight">Привіт, Роман 👋</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </header>

      {/* Predicted Bill Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-600 p-5 text-white shadow-lg shadow-cyan-500/20 animate-slide-up">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -right-12 -bottom-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-cyan-100" />
            <p className="text-sm font-medium text-cyan-50">Прогноз рахунку за серпень</p>
          </div>
          <p className="text-4xl font-bold tracking-tight">
            {totalBill.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-cyan-100">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              4 лічильники
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
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Нагадування
            </h2>
            {urgentCount > 0 && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                {urgentCount} термінових
              </span>
            )}
          </div>
          <DeadlineAlert reminders={mockReminders} />
        </section>
      )}

      {/* Quick Action */}
      <Link
        href="/submit"
        className="card-hover flex items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900 dark:bg-cyan-950/30"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-md">
            <span className="text-xl">📸</span>
          </div>
          <div>
            <p className="font-semibold text-foreground">Передати показники</p>
            <p className="text-xs text-muted-foreground">Фото → OCR → EPS одним тапом</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-cyan-600" />
      </Link>

      {/* Meters */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Мої лічильники</h2>
        <div className="space-y-3">
          {mockMeters.map((meter) => (
            <MeterCard key={meter.id} meter={meter} />
          ))}
        </div>
      </section>

      {/* Bill Breakdown */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Деталі рахунку</h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {mockBillPredictions.map((pred, idx) => (
            <div
              key={pred.meterId}
              className={`flex items-center justify-between p-3 ${
                idx < mockBillPredictions.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: mockMeters.find(m => m.id === pred.meterId)?.color,
                  }}
                />
                <span className="text-sm text-foreground">{pred.serviceName}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {pred.predictedAmount.toLocaleString("uk-UA", { minimumFractionDigits: 2 })} ₴
                </p>
                <p className="text-xs text-muted-foreground">
                  {pred.predictedUsage} {mockMeters.find(m => m.id === pred.meterId)?.unit}
                </p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t-2 border-border bg-muted/30 p-3">
            <span className="font-semibold">Разом</span>
            <span className="font-bold text-lg tabular-nums">
              {totalBill.toLocaleString("uk-UA", { minimumFractionDigits: 2 })} ₴
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
