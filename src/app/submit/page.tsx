"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, Upload, AlertCircle, Loader2 } from "lucide-react";
import { mockMeters } from "@/lib/mockData";
import { MeterCard } from "@/components/MeterCard";
import { SERVICE_CONFIG } from "@/lib/types";
import type { ServiceType } from "@/lib/types";

type Step = "select" | "photo" | "ocr" | "confirm" | "submitting" | "done";

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);
  const [ocrValue, setOcrValue] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);

  const selectedMeter = mockMeters.find(m => m.id === selectedMeterId);

  const handleMeterSelect = (meterId: string) => {
    setSelectedMeterId(meterId);
    setStep("photo");
  };

  const handlePhotoCapture = () => {
    // Simulate OCR processing
    setStep("ocr");
    setTimeout(() => {
      // Mock OCR result
      const mockValue = selectedMeter?.serviceType === "electricity" ? "12512" : "184.56";
      setOcrValue(mockValue);
      setConfidence(0.96);
      setStep("confirm");
    }, 2000);
  };

  const handleConfirm = () => {
    setStep("submitting");
    setTimeout(() => {
      setStep("done");
    }, 2000);
  };

  const handleReset = () => {
    setStep("select");
    setSelectedMeterId(null);
    setOcrValue("");
    setConfidence(0);
  };

  return (
    <div className="px-4 pt-12 pb-4">
      {/* Back button */}
      {step !== "select" && step !== "done" && (
        <button
          onClick={() => {
            if (step === "photo") setStep("select");
            else if (step === "confirm") setStep("photo");
          }}
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>
      )}

      {/* Step: Select meter */}
      {step === "select" && (
        <div className="space-y-4 animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">Передати показники</h1>
          <p className="text-sm text-muted-foreground">
            Оберіть лічильник для передачі показників
          </p>
          <div className="space-y-3">
            {mockMeters.map((meter) => (
              <MeterCard
                key={meter.id}
                meter={meter}
                compact
                onClick={() => handleMeterSelect(meter.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step: Photo capture */}
      {step === "photo" && selectedMeter && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Фото лічильника</h1>
            <p className="text-sm text-muted-foreground">
              {selectedMeter.serviceName} • №{selectedMeter.meterNumber}
            </p>
          </div>

          {/* Camera placeholder */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border-2 border-dashed border-border bg-muted/50">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/20">
                <Camera className="h-8 w-8 text-white" strokeWidth={2} />
              </div>
              <p className="text-sm text-muted-foreground text-center px-8">
                Наведіть камеру на дисплей лічильника.<br />
                Цифри мають бути чітко видимими.
              </p>
            </div>
            {/* Scanning frame overlay */}
            <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-cyan-400 rounded-2xl" />
          </div>

          {/* Tips */}
          <div className="rounded-2xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              💡 <span className="font-medium">Порада:</span> Фотографуйте за прямого світла. Уникайте відблисків на дисплеї.
            </p>
          </div>

          {/* Capture button */}
          <button
            onClick={handlePhotoCapture}
            className="card-hover flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 p-4 font-semibold text-white shadow-lg shadow-cyan-500/20 transition-transform active:scale-95"
          >
            <Camera className="h-5 w-5" />
            Зробити фото
          </button>

          <p className="text-center text-xs text-muted-foreground">
            🔒 Фото залишається на пристрої. На сервер передається лише цифра.
          </p>
        </div>
      )}

      {/* Step: OCR processing */}
      {step === "ocr" && (
        <div className="flex flex-col items-center justify-center gap-4 pt-20 animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Розпізнаю цифри...</p>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && selectedMeter && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Перевірте показник</h1>
            <p className="text-sm text-muted-foreground">
              {selectedMeter.serviceName} • №{selectedMeter.meterNumber}
            </p>
          </div>

          {/* OCR Result */}
          <div className="rounded-3xl border border-border bg-card p-6 text-center">
            <p className="text-xs text-muted-foreground mb-2">Розпізнано OCR</p>
            <p className="text-5xl font-bold tabular-nums text-foreground tracking-tight">
              {ocrValue}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{selectedMeter.unit}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 dark:bg-green-900/30">
              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                Впевненість {(confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Edit option */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Виправити значення (за потреби)
            </label>
            <input
              type="text"
              value={ocrValue}
              onChange={(e) => setOcrValue(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-lg font-semibold tabular-nums text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Monotonicity check */}
          {selectedMeter.lastReading && parseFloat(ocrValue) < selectedMeter.lastReading && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">
                Показник менший за попередній ({selectedMeter.lastReading}). Перевірте значення.
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleConfirm}
            className="card-hover flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 p-4 font-semibold text-white shadow-lg shadow-cyan-500/20 transition-transform active:scale-95"
          >
            <Upload className="h-5 w-5" />
            Передати на EPS
          </button>
        </div>
      )}

      {/* Step: Submitting */}
      {step === "submitting" && (
        <div className="flex flex-col items-center justify-center gap-4 pt-20 animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Передаю на EPS...</p>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && selectedMeter && (
        <div className="flex flex-col items-center justify-center gap-6 pt-20 animate-fade-in">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/20">
            <Check className="h-12 w-12 text-white" strokeWidth={3} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Готово! ✅</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Показник <span className="font-semibold">{ocrValue} {selectedMeter.unit}</span> передано на EPS
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedMeter.serviceName} • №{selectedMeter.meterNumber}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="rounded-2xl border border-border bg-card px-6 py-3 font-medium text-foreground card-hover"
          >
            Передати ще один
          </button>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            На головну
          </button>
        </div>
      )}
    </div>
  );
}
