"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * Reusable error state component with icon, title, message, and retry button.
 * Uses teal color scheme with animated entrance.
 *
 * Used for AC-13.7: "If an API call fails, the system shall display an error state
 * with a retry button, not a blank page."
 */
export function ErrorState({
  icon: Icon = AlertCircle,
  title = "Не вдалося завантажити",
  message = "Перевірте підключення та спробуйте ще раз",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-20 animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-light">
        <Icon className="h-8 w-8 text-danger" />
      </div>
      <div className="text-center">
        <p className="text-body font-medium text-foreground">{title}</p>
        <p className="text-body text-muted-foreground mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 text-body font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-600 active:bg-primary-700 active:scale-95 transition-all"
        >
          <RotateCcw className="h-5 w-5" />
          Спробувати ще раз
        </button>
      )}
    </div>
  );
}
