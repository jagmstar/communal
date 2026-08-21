"use client";

import { AlertCircle, Bell } from "lucide-react";
import { Reminder } from "@/lib/types";

interface DeadlineAlertProps {
  reminders: Reminder[];
}

export function DeadlineAlert({ reminders }: DeadlineAlertProps) {
  const urgent = reminders.filter(r => r.urgent);
  const upcoming = reminders.filter(r => !r.urgent);

  if (urgent.length === 0 && upcoming.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {urgent.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-3 animate-fade-in dark:border-orange-900 dark:bg-orange-950/30"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
              {r.serviceName} — передати до {new Date(r.dueDate).toLocaleDateString("uk-UA", { day: "numeric", month: "long" })}
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Залишилось {r.daysLeft} {r.daysLeft === 1 ? "день" : "дні"}
            </p>
          </div>
        </div>
      ))}
      {upcoming.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 p-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {r.serviceName} — передати до {r.dueDate.slice(8)} числа
            </p>
            <p className="text-xs text-muted-foreground">
              Ще {r.daysLeft} днів
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
