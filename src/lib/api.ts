/**
 * Client-side API functions for the Communal app.
 *
 * Web: fetches from relative Next.js API routes (/api/*).
 * Native (Capacitor): fetches from the deployed backend URL because the app
 * runs from local static files and has no local API server.
 */

import type { Meter, Reading, Tariff, Settings } from "./types";
import { isNative } from "./capacitor";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Production backend URL for the native mobile app.
// When running on the web (Vercel), relative URLs are used.
const API_BASE = isNative() ? "https://communal-navy.vercel.app" : "";

/** Default request timeout: 15 seconds */
const REQUEST_TIMEOUT_MS = 15_000;

/** Create an AbortController that fires after the timeout */
function withTimeout(): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return controller;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    signal: withTimeout().signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Request failed: ${res.status}`, res.status);
  }
  const json = await res.json();
  // API returns { data: T } envelope — unwrap it
  return (json.data ?? json) as T;
}

/** GET /api/meters — returns all meters */
export async function fetchMeters(): Promise<Meter[]> {
  return fetchJson<Meter[]>("/api/meters");
}

/** GET /api/readings?meterId=… — returns readings, optionally filtered */
export async function fetchReadings(meterId?: string): Promise<Reading[]> {
  const qs = meterId ? `?meterId=${encodeURIComponent(meterId)}` : "";
  return fetchJson<Reading[]>(`/api/readings${qs}`);
}

/** GET /api/tariffs — returns all tariffs */
export async function fetchTariffs(): Promise<Tariff[]> {
  return fetchJson<Tariff[]>("/api/tariffs");
}

/** GET /api/settings — returns singleton settings */
export async function fetchSettings(): Promise<Settings> {
  return fetchJson<Settings>("/api/settings");
}

/** PUT /api/settings — update settings (partial) */
export async function putSettings(partial: Partial<Settings>): Promise<Settings> {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partial),
    signal: withTimeout().signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Update failed: ${res.status}`, res.status);
  }
  const json = await res.json();
  return (json.data ?? json) as Settings;
}

/** POST /api/readings — create a new reading */
export async function postReading(
  reading: Omit<Reading, "id">
): Promise<Reading> {
  const res = await fetch(`${API_BASE}/api/readings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reading),
    signal: withTimeout().signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Create failed: ${res.status}`, res.status);
  }
  const json = await res.json();
  return (json.data ?? json) as Reading;
}
