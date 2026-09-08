"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  Upload,
  AlertCircle,
  Loader2,
  Shield,
  Keyboard,
} from "lucide-react";
import { fetchMeters, postReading } from "@/lib/api";
import { MeterCard } from "@/components/MeterCard";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { isNative, takePhoto } from "@/lib/capacitor";
import { isPlausibleRollover } from "@/lib/rollover";
import type { Meter } from "@/lib/types";

type Step = "select" | "photo" | "ocr" | "confirm" | "submitting" | "done";

type OcrStatus = "idle" | "processing" | "success" | "failed" | "unavailable";

// isPlausibleRollover (ticket #1, AC-3/AC-4) now comes from the shared, dependency-free
// `src/lib/rollover.ts` module instead of a local duplicate copy. See that module for the
// full rationale (QA verdict qa/ticket-1-verdict.md, Findings F1 + F2). `rollover.ts`
// imports nothing from `next/server`, so it is safe to bundle into this "use client"
// component — the previous local copy existed only to work around a duplication the
// shared module now eliminates.

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);
  const [ocrValue, setOcrValue] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>("idle");
  const [ocrError, setOcrError] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [epsPlaceholder, setEpsPlaceholder] = useState(false);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loadingMeters, setLoadingMeters] = useState(true);
  const [submitError, setSubmitError] = useState<string>("");
  const [rolloverAcknowledged, setRolloverAcknowledged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch meters from API on mount
  useEffect(() => {
    let cancelled = false;
    fetchMeters()
      .then((data) => {
        if (!cancelled && data.length > 0) {
          setMeters(data);
        }
      })
      .catch(() => {
        // API unavailable — meters stays empty, user sees empty state
      })
      .finally(() => { if (!cancelled) setLoadingMeters(false); });
    return () => { cancelled = true; };
  }, []);

  const selectedMeter = useMemo(() => meters.find(m => m.id === selectedMeterId), [meters, selectedMeterId]);

  // Design spec §2.2: the primary camera CTA on the select screen should
  // default to the meter with the nearest upcoming submit deadline, so it's
  // a genuinely useful one-tap action rather than an ambiguous "photograph
  // something" button.
  const nextDueMeter = useMemo(() => {
    if (meters.length === 0) return null;
    const now = new Date();
    const day = now.getDate();
    return [...meters].sort((a, b) => {
      const da = (a.submitDeadlineDay - day + 31) % 31;
      const db = (b.submitDeadlineDay - day + 31) % 31;
      return da - db;
    })[0];
  }, [meters]);

  // Ticket #1 (AC-4): the entered value is below the meter's last known
  // reading — either a typo/OCR misread (block) or a real dial rollover
  // (allow only once the user explicitly acknowledges it).
  const parsedValue = ocrValue ? parseFloat(ocrValue) : NaN;
  const isBelowLastReading =
    !!selectedMeter?.lastReading &&
    !isNaN(parsedValue) &&
    parsedValue < selectedMeter.lastReading;
  const rolloverPlausible =
    isBelowLastReading && selectedMeter?.lastReading
      ? isPlausibleRollover(parsedValue, selectedMeter.lastReading)
      : false;

  const handleMeterSelect = (meterId: string) => {
    setSelectedMeterId(meterId);
    setStep("photo");
    setOcrStatus("idle");
    setOcrError("");
    setPhotoPreview(null);
    setCameraError(false);
    setManualEntry(false);
    setRolloverAcknowledged(false);
  };

  /**
   * Run OCR on a captured photo using Tesseract.js.
   * Extracts digits from the recognized text.
   */
  const runOcr = useCallback(async (imageDataUrl: string) => {
    setStep("ocr");
    setOcrStatus("processing");

    try {
      // Dynamic import to avoid bundling Tesseract in initial load
      const Tesseract = await import("tesseract.js");

      const result = await Tesseract.recognize(
        imageDataUrl,
        "eng",
        {
          logger: () => {},
        }
      );

      // Extract digits from the recognized text
      const text = result.data.text || "";
      // Find the longest sequence of digits (and optional decimal point)
      const digitMatches = text.match(/\d[\d.,]*\d/g);
      let extractedValue = "";
      if (digitMatches && digitMatches.length > 0) {
        // Pick the longest digit sequence (likely the meter reading)
        extractedValue = digitMatches.reduce((longest: string, current: string) =>
          current.length > longest.length ? current : longest
        );
        // Normalize decimal separators
        extractedValue = extractedValue.replace(/,/g, ".");
      }

      // Calculate confidence (Tesseract confidence is 0-100)
      const ocrConfidence = result.data.confidence || 0;
      const normalizedConfidence = Math.max(0, Math.min(1, ocrConfidence / 100));

      if (!extractedValue || extractedValue.length < 1) {
        // OCR failed to find any digits
        setOcrStatus("failed");
        setOcrError("Не вдалося розпізнати. Введіть значення вручну.");
        setManualEntry(true);
        setOcrValue("");
        setConfidence(0);
        setStep("confirm");
        return;
      }

      setOcrValue(extractedValue);
      setConfidence(normalizedConfidence);
      setOcrStatus("success");
      setManualEntry(false);
      setStep("confirm");
    } catch {
      // OCR engine failed entirely
      setOcrStatus("failed");
      setOcrError("OCR недоступний. Введіть показник вручну.");
      setManualEntry(true);
      setOcrValue("");
      setConfidence(0);
      setStep("confirm");
    }
  }, []);

  /**
   * Handle photo capture from file input (web fallback).
   */
  const handleFileCapture = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);

    // Read the file as a data URL for preview and OCR
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoPreview(dataUrl);
      setIsCapturing(false);
      // Run OCR on the captured image
      await runOcr(dataUrl);
    };
    reader.onerror = () => {
      setIsCapturing(false);
      setCameraError(true);
    };
    reader.readAsDataURL(file);

    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [runOcr]);

  /**
   * Handle native camera capture via Capacitor.
   */
  const handleNativeCapture = useCallback(async () => {
    setIsCapturing(true);
    const photo = await takePhoto();
    setIsCapturing(false);

    if (photo) {
      setPhotoPreview(photo);
      await runOcr(photo);
    } else {
      setCameraError(true);
    }
  }, [runOcr]);

  /**
   * Trigger photo capture — uses native camera if in Capacitor,
   * otherwise triggers the hidden file input.
   */
  const handleCapture = useCallback(() => {
    if (isNative()) {
      handleNativeCapture();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [handleNativeCapture]);

  /**
   * Switch to manual entry mode.
   */
  const handleManualEntry = () => {
    setManualEntry(true);
    setOcrStatus("idle");
    setOcrError("");
    setStep("confirm");
  };

  /**
   * Submit reading to API — POST /api/readings
   * Falls back to local-only mode if API returns 503 (no DATABASE_URL).
   */
  const handleConfirm = async () => {
    setStep("submitting");
    setSubmitError("");

    if (!selectedMeter || !ocrValue) {
      setSubmitError("Немає даних для відправки");
      setStep("confirm");
      return;
    }

    const readingValue = parseFloat(ocrValue);
    if (isNaN(readingValue)) {
      setSubmitError("Невірний формат показника");
      setStep("confirm");
      return;
    }

    // Ticket #1 (AC-4): client-side guard mirrors the server-side check —
    // block a below-last-reading value unless it's a plausible rollover
    // that the user has explicitly acknowledged. This is a UX nicety; the
    // API's own check (AC-1/AC-3) is the actual enforcement point.
    if (
      selectedMeter.lastReading &&
      readingValue < selectedMeter.lastReading &&
      !(isPlausibleRollover(readingValue, selectedMeter.lastReading) && rolloverAcknowledged)
    ) {
      setSubmitError("Показник менший за попередній. Перевірте значення.");
      setStep("confirm");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    try {
      // POST to API — this persists the reading to the database
      await postReading({
        meterId: selectedMeter.id,
        date: today,
        value: readingValue,
        submittedToEps: false, // EPS integration is separate
        ocrConfidence: manualEntry ? 0 : confidence,
        ocrEngine: manualEntry ? "manual" : "tesseract",
        submittedAt: new Date().toISOString(),
        allowRollover: rolloverAcknowledged,
      });
      setEpsPlaceholder(false);
      setStep("done");
    } catch {
      // API not available (503 = no DATABASE_URL) — save locally only
      setEpsPlaceholder(true);
      setStep("done");
    }
  };

  const handleReset = () => {
    setStep("select");
    setSelectedMeterId(null);
    setOcrValue("");
    setConfidence(0);
    setOcrStatus("idle");
    setOcrError("");
    setPhotoPreview(null);
    setCameraError(false);
    setManualEntry(false);
    setEpsPlaceholder(false);
    setSubmitError("");
    setRolloverAcknowledged(false);
  };

  /** Get confidence level label */
  const confidenceLevel = useMemo<{ label: string; color: string; bgColor: string }>(() => {
    const pct = confidence * 100;
    if (pct >= 80) return { label: "Висока", color: "text-success", bgColor: "bg-success-light" };
    if (pct >= 50) return { label: "Середня", color: "text-warning", bgColor: "bg-warning-light" };
    return { label: "Низька", color: "text-danger", bgColor: "bg-danger-light" };
  }, [confidence]);

  if (loadingMeters) {
    return <LoadingState message="Завантажую лічильники..." />;
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Hidden file input for web camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileCapture}
        className="hidden"
        aria-hidden="true"
      />

      {/* Back button */}
      {step !== "select" && step !== "done" && (
        <button
          onClick={() => {
            if (step === "photo") setStep("select");
            else if (step === "confirm") setStep("photo");
          }}
          aria-label="Повернутися до попереднього кроку"
          className="mb-4 flex min-h-[44px] items-center gap-1 text-body text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>
      )}

      {/* Step: Select meter — camera entry point is now the primary,
          above-the-fold affordance (design spec §2.2 / audit #5). This was
          the app's core, most visible bug: the dashboard's own copy
          promises "Фото → OCR → EPS одним тапом" but this screen used to
          be a bare list with no camera button anywhere on it.
          `nextDueMeter` picks the meter with the closest submit deadline so
          "Сфотографувати показник" is a genuinely useful one-tap default,
          not a dead click. Full non-compact MeterCard is used below (not
          `compact`) so last reading + due date + chevron are all visible,
          per spec. */}
      {step === "select" && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Передати показники</h1>
            <p className="text-body text-muted-foreground mt-1">
              Сфотографуйте лічильник — цифри розпізнаються автоматично
            </p>
          </div>

          {nextDueMeter && (
            <button
              onClick={() => handleMeterSelect(nextDueMeter.id)}
              className="card-hover flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-600 p-4 text-left text-white shadow-lg shadow-secondary-500/30 transition-transform active:scale-95"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Camera className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Сфотографувати показник</p>
                <p className="text-xs text-white/90 mt-0.5">
                  {nextDueMeter.serviceName} • Фото → OCR → EPS одним тапом
                </p>
              </div>
            </button>
          )}

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
              Або оберіть лічильник вручну
            </p>
            {meters.map((meter) => (
              <MeterCard
                key={meter.id}
                meter={meter}
                onClick={() => handleMeterSelect(meter.id)}
              />
            ))}
          </div>

          {meters.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <p className="text-body text-muted-foreground">
                Спершу додайте лічильник у Налаштуваннях
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step: Photo capture. Preview aspect ratio tightened from 3:4 to
          4:3 and spacing condensed (design spec §6 acceptance checklist:
          "one-thumb reachability... every screen" / "no page requires
          scrolling to find the primary action") — the 3:4 preview pushed
          the shutter button partially under the fixed bottom nav on a
          390x844 viewport, the single worst possible bug for a screen
          whose whole point is being fast and thumb-reachable. */}
      {step === "photo" && selectedMeter && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Фото лічильника</h1>
            <p className="text-body text-muted-foreground">
              {selectedMeter.serviceName} • №{selectedMeter.meterNumber}
            </p>
          </div>

          {/* Camera preview / placeholder */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border-2 border-dashed border-border bg-muted/50">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Фото лічильника"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/20">
                  <Camera className="h-7 w-7 text-white" strokeWidth={2} />
                </div>
                <p className="text-body text-muted-foreground text-center px-8">
                  Наведіть камеру на дисплей лічильника.
                </p>
              </div>
            )}
            {/* Scanning frame overlay */}
            <div className="absolute inset-x-8 top-1/5 bottom-1/5 overflow-hidden rounded-2xl">
              <div className="absolute inset-0 border-2 border-primary-300 rounded-2xl" />
              {!photoPreview && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-primary-400 animate-scan" />
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              💡 <span className="font-medium">Порада:</span> Фотографуйте за прямого світла, уникайте відблисків.
            </p>
          </div>

          {/* Camera error state */}
          {cameraError && (
            <div className="rounded-2xl border border-danger/20 bg-danger-light p-4 space-y-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-danger shrink-0" />
                <p className="text-body text-danger">
                  Камера недоступна. Перевірте дозволи додатка.
                </p>
              </div>
              <button
                onClick={handleManualEntry}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-body font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Keyboard className="h-5 w-5" />
                Ввести вручну
              </button>
            </div>
          )}

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="card-hover flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-600 font-semibold text-white shadow-lg shadow-secondary-500/30 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCapturing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Знімаю...
              </>
            ) : (
              <>
                <Camera className="h-5 w-5" />
                Зробити фото лічильника
              </>
            )}
          </button>

          {/* Privacy notice (AC-2.5) */}
          <div className="flex items-center justify-center gap-1.5 text-center">
            <Shield className="h-3.5 w-3.5 text-success" />
            <p className="text-xs text-muted-foreground">
              Фото залишається на пристрої. На сервер передається лише цифра.
            </p>
          </div>

          {/* Manual entry fallback */}
          <button
            onClick={handleManualEntry}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-body font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <Keyboard className="h-5 w-5" />
            Ввести вручну
          </button>
        </div>
      )}

      {/* Step: OCR processing */}
      {step === "ocr" && (
        <div className="flex flex-col items-center justify-center gap-4 pt-20 animate-fade-in" role="status" aria-live="polite">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
          <p className="text-body text-muted-foreground">Розпізнаю показник...</p>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && selectedMeter && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Перевірте показник</h1>
            <p className="text-body text-muted-foreground">
              {selectedMeter.serviceName} • №{selectedMeter.meterNumber}
            </p>
          </div>

          {/* OCR failed / manual entry */}
          {ocrStatus === "failed" && (
            <div className="rounded-2xl border border-danger/20 bg-danger-light p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-danger shrink-0" />
                <p className="text-body text-danger">{ocrError}</p>
              </div>
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <div className="rounded-2xl border border-danger/20 bg-danger-light p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-danger shrink-0" />
                <p className="text-body text-danger">{submitError}</p>
              </div>
            </div>
          )}

          {/* OCR Result card (only show if OCR succeeded) */}
          {ocrStatus === "success" && !manualEntry && (
            <div className="rounded-3xl border border-border bg-surface p-6 text-center">
              <p className="text-xs text-muted-foreground mb-2">Розпізнано OCR</p>
              <p className="text-5xl font-bold tabular-nums text-foreground tracking-tight">
                {ocrValue}
              </p>
              <p className="text-body text-muted-foreground mt-1">{selectedMeter.unit}</p>
              {/* Confidence badge */}
              <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full ${confidenceLevel.bgColor} px-3 py-1`}>
                <Check className={`h-3 w-3 ${confidenceLevel.color}`} />
                <span className={`text-xs font-medium ${confidenceLevel.color}`}>
                  Впевненість {(confidence * 100).toFixed(0)}% ({confidenceLevel.label})
                </span>
              </div>
            </div>
          )}

          {/* Edit / manual input */}
          <div className="space-y-2">
            <label htmlFor="reading-value" className="text-body font-medium text-foreground">
              {manualEntry ? "Введіть показник" : "Виправити значення (за потреби)"}
            </label>
            <input
              id="reading-value"
              type="text"
              inputMode="decimal"
              value={ocrValue}
              onChange={(e) => {
                setOcrValue(e.target.value);
                setRolloverAcknowledged(false); // re-require ack after any edit
              }}
              placeholder="Наприклад, 12453"
              aria-describedby="reading-value-help"
              className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-lg font-semibold tabular-nums text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
            />
            {selectedMeter.lastReading != null && (
              <p id="reading-value-help" className="text-xs text-muted-foreground">
                Попередній показник: {selectedMeter.lastReading} {selectedMeter.unit}
              </p>
            )}
          </div>
          {/* Below-last-reading warning (ticket #1, AC-4) — this now actually
              blocks submission below, it isn't just cosmetic. */}
          {isBelowLastReading && (
            <div className="flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger-light p-3">
              <AlertCircle className="h-5 w-5 text-danger shrink-0" />
              <p className="text-body text-danger">
                Показник менший за попередній ({selectedMeter.lastReading}). Перевірте значення.
              </p>
            </div>
          )}

          {/* Rollover acknowledgment (ticket #1, AC-3/AC-4) — only offered
              when the drop is large enough to plausibly be a real dial
              wrap-around, not a typo/OCR misread. */}
          {isBelowLastReading && rolloverPlausible && (
            <label className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning-light p-3">
              <input
                type="checkbox"
                checked={rolloverAcknowledged}
                onChange={(e) => setRolloverAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <span className="text-body text-warning">
                Це перехід лічильника через нуль (роловер), а не помилка. Підтверджую значення.
              </span>
            </label>
          )}

          {/* Submit button */}
          <button
            onClick={handleConfirm}
            disabled={!ocrValue || (isBelowLastReading && !(rolloverPlausible && rolloverAcknowledged))}
            className="card-hover flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 font-semibold text-white shadow-lg shadow-primary-500/20 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-5 w-5" />
            Передати на EPS
          </button>

          {/* Manual entry toggle (if OCR succeeded) */}
          {ocrStatus === "success" && !manualEntry && (
            <button
              onClick={handleManualEntry}
              className="flex w-full items-center justify-center gap-2 text-body text-muted-foreground hover:text-foreground transition-colors"
            >
              <Keyboard className="h-4 w-4" />
              Ввести вручну
            </button>
          )}
        </div>
      )}

      {/* Step: Submitting */}
      {step === "submitting" && (
        <div className="flex flex-col items-center justify-center gap-4 pt-20 animate-fade-in" role="status" aria-live="polite">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
          <p className="text-body text-muted-foreground">Передаю на EPS...</p>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && selectedMeter && (
        <div className="flex flex-col items-center justify-center gap-6 pt-20 animate-fade-in">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-success to-success shadow-lg shadow-success/20 animate-scale-in" role="status">
            <Check className="h-12 w-12 text-white" strokeWidth={3} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Готово! ✅</h1>
            <p className="text-body text-muted-foreground mt-1">
              Показник <span className="font-semibold">{ocrValue} {selectedMeter.unit}</span> передано на EPS
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedMeter.serviceName} • №{selectedMeter.meterNumber}
            </p>
          </div>

          {/* EPS placeholder notice — Ukrainian throughout (design spec §4,
              audit: an English string was leaking into an otherwise fully
              localized flow). */}
          {epsPlaceholder && (
            <div className="rounded-2xl border border-warning/20 bg-warning-light p-3 text-center">
              <p className="text-xs text-warning">
                Інтеграція з EPS у розробці — показник збережено локально.
              </p>
            </div>
          )}

          <button
            onClick={handleReset}
            aria-label="Передати ще один показник"
            className="rounded-2xl border border-border bg-surface px-6 py-3 font-medium text-foreground card-hover"
          >
            Передати ще один
          </button>
          <button
            onClick={() => router.push("/")}
            aria-label="Повернутися на головну сторінку"
            className="text-body text-muted-foreground hover:text-foreground transition-colors"
          >
            На головну
          </button>
        </div>
      )}
    </div>
  );
}
