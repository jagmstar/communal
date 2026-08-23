"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for offline PWA support.
 * Only runs in production (not in dev mode).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.error("SW registration failed:", err));
  }, []);

  return null;
}
