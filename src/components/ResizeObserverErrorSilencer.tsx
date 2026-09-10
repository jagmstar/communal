"use client";

import { useEffect } from "react";

/**
 * 2026-09-10 QA fix (qa/2026-09-10/) — see ChartErrorBoundary.tsx for the
 * full root-cause writeup.
 *
 * "ResizeObserver loop completed with undelivered notifications" (and the
 * older Chrome wording "ResizeObserver loop limit exceeded") is a
 * well-documented browser-level warning, not an application bug — it fires
 * when a ResizeObserver callback (recharts' <ResponsiveContainer> uses one
 * internally, see node_modules/recharts/es6/component/ResponsiveContainer.js)
 * triggers a layout change that would re-trigger the same observer within one
 * frame. Chromium and Firefox both report this to `window.onerror` even
 * though it is harmless and self-recovering. Any global error listener (or,
 * historically, some error-reporting/overlay tooling) that treats every
 * window error as fatal will surface this as a crash even though nothing is
 * actually broken — a known false-positive class, most visible on pages with
 * a resizable chart container (i.e. /history here) during real, human mouse-
 * driven window resizing, which is exactly the report pattern ("crashes on
 * his desktop at ~1150px", never reliably reproduced in headless/scripted
 * resize sweeps).
 *
 * This does NOT swallow real render errors — ErrorBoundary/ChartErrorBoundary
 * still catch and log those via componentDidCatch. It only prevents this one
 * specific, universally-recognized benign browser condition from being
 * treated as an uncaught global error.
 */
const RESIZE_OBSERVER_LOOP_MESSAGES = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
];

export function ResizeObserverErrorSilencer() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (RESIZE_OBSERVER_LOOP_MESSAGES.some((m) => event.message?.includes(m))) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return null;
}
