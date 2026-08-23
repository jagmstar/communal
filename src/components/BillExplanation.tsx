"use client";

import { Info, ArrowUp, ArrowDown } from "lucide-react";
import { useMemo } from "react";
import { computeBillChangeFactors } from "@/lib/calculations";
import type { Meter, Reading, Tariff, BillPrediction } from "@/lib/types";

interface BillExplanationProps {
  meters: Meter[];
  readings: Reading[];
  tariffs: Tariff[];
  billPredictions: BillPrediction[];
}

export function BillExplanation({ meters, readings, tariffs, billPredictions }: BillExplanationProps) {
  const { factors, totalImpact, previousBill, currentBill, forecast } = useMemo(
    () => computeBillChangeFactors(meters, readings, tariffs, billPredictions),
    [meters, readings, tariffs, billPredictions],
  );
  const isIncrease = totalImpact > 0;

  const previousMonthName = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toLocaleDateString("uk-UA", { month: "long" });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-primary-500" />
          Чому рахунок змінився
        </h2>
      </div>
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground">Зміна vs {previousMonthName}</p>
            <p className={`text-xl font-bold flex items-center gap-1 ${isIncrease ? "text-secondary-600" : "text-success"}`}>
              {isIncrease ? <ArrowUp className="h-4 w-4 text-secondary-500" /> : <ArrowDown className="h-4 w-4 text-success" />}
              {isIncrease ? "+" : ""}{totalImpact.toLocaleString("uk-UA")} ₴
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {previousBill.toLocaleString("uk-UA")} → {currentBill.toLocaleString("uk-UA")} ₴
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Прогноз</p>
            <p className="text-body font-medium">{forecast.toLocaleString("uk-UA")} ₴</p>
          </div>
        </div>
        {factors.length > 0 ? (
          <div className="divide-y divide-border">
            {factors.map((factor, idx) => (
              <div key={`${factor.label}-${idx}`} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  {factor.impact > 0 ? (
                    <ArrowUp className="h-3.5 w-3.5 text-secondary-500" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5 text-success" />
                  )}
                  <span className="text-body text-foreground">{factor.label}</span>
                </div>
                <span className={`text-body font-semibold tabular-nums ${factor.impact > 0 ? "text-secondary-600" : "text-success"}`}>
                  {factor.impact > 0 ? "+" : ""}{factor.impact} ₴
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-body text-muted-foreground">
              Витрата стабільна — значних змін не виявлено
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
