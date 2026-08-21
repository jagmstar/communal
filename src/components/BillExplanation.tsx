"use client";

import { Info, ArrowUp, ArrowDown } from "lucide-react";

interface BillFactor {
  label: string;
  impact: number; // positive = increases bill, negative = decreases
  percentage: number;
}

const mockFactors: BillFactor[] = [
  { label: "Тариф електро +15%", impact: 185, percentage: 15 },
  { label: "Витрата електро +10%", impact: 124, percentage: 10 },
  { label: "Витрата газу −5%", impact: -48, percentage: -5 },
  { label: "Витрата води +3%", impact: 22, percentage: 3 },
];

export function BillExplanation() {
  const totalImpact = mockFactors.reduce((sum, f) => sum + f.impact, 0);
  const isIncrease = totalImpact > 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Чому рахунок змінився
        </h2>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground">Зміна vs липень</p>
            <p className={`text-xl font-bold flex items-center gap-1 ${isIncrease ? "text-orange-600" : "text-green-600"}`}>
              {isIncrease ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {isIncrease ? "+" : ""}{totalImpact.toLocaleString("uk-UA")} ₴
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Прогноз</p>
            <p className="text-sm font-medium">2,398 ₴</p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {mockFactors.map((factor, idx) => (
            <div key={idx} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                {factor.impact > 0 ? (
                  <ArrowUp className="h-3.5 w-3.5 text-orange-500" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5 text-green-500" />
                )}
                <span className="text-sm text-foreground">{factor.label}</span>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${factor.impact > 0 ? "text-orange-600" : "text-green-600"}`}>
                {factor.impact > 0 ? "+" : ""}{factor.impact} ₴
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
