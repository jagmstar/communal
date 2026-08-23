"use client";

import { AlertCircle, Bell } from "lucide-react";
import { pluralize } from "@/lib/calculations";
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
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-danger/15 bg-danger-light p-3 animate-fade-in"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger/10">
            <AlertCircle className="h-5 w-5 text-danger" />
          </div>
          <div className="flex-1">
            <p className="text-body font-medium text-danger">
              {r.serviceName} — передати до {new Date(r.dueDate).toLocaleDateString("uk-UA", { day: "numeric", month: "long" })}
            </p>
            <p className="text-xs text-danger/80">
              Залишилось {r.daysLeft} {pluralize(r.daysLeft, ["день", "дні", "днів"])}
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
            <p className="text-body font-medium text-foreground">
              {r.serviceName} — передати до {new Date(r.dueDate).toLocaleDateString("uk-UA", { day: "numeric", month: "long" })}
            </p>
            <p className="text-xs text-muted-foreground">
              Ще {r.daysLeft} {pluralize(r.daysLeft, ["день", "дні", "днів"])}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
