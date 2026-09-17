/**
 * Client-side API functions for the Communal app.
 *
 * Web: fetches from relative Next.js API routes (/api/*), session cookie is
 * already same-origin so the browser attaches it automatically.
 * Native (Capacitor): fetches from the deployed backend URL because the app
 * runs from local static files and has no local API server. This is a
 * cross-origin request, so `credentials: "include"` is required or the
 * HMAC session cookie (src/lib/session.ts) is never sent/stored — this was
 * the APK auth gap tracked in docs/AUTH-APK-DECISION-2026-09-17.md
 * ("Known issue", owner senior-fullstack-dev), closed by this ticket.
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
// Exported so /login (the one page that must call the API before any
// session exists) builds the same absolute URL instead of a relative one
// that 404s when the APK's WebView has no local server.
export const API_BASE = isNative() ? "https://communal-navy.vercel.app" : "";

/** Default request timeout: 15 seconds */
const REQUEST_TIMEOUT_MS = 15_000;

/** Create an AbortController that fires after the timeout */
function withTimeout(): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return controller;
}

/**
 * 401 handler shared by every request helper below.
 *
 * On native, a 401 means the session cookie is missing or expired — the
 * only recovery is sending the user back through /login (there is no
 * silent token refresh in this design, matching the web flow's
 * proxy.ts redirect). On web this never fires from inside the SPA fetch
 * path because proxy.ts already redirects unauthenticated PAGE loads before
 * any component runs; it's a defensive net for an expired cookie once a
 * page is already open.
 *
 * IMPORTANT: this dispatches a DOM event instead of doing
 * `window.location.href = "/login"` (a hard navigation). The mobile build
 * is a static export (next.config.ts MOBILE_BUILD) served from Capacitor's
 * local WebView server, which runs with Capacitor's default `html5mode`
 * (`CapConfig.java`: `html5mode = true`). Under html5mode, the local server
 * serves `index.html` for *any* extensionless path that isn't a real
 * on-disk asset (`WebViewLocalServer.java`: `!lastPathSegment.contains(".")
 * && html5mode` -> serve index.html) — so a hard nav to "/login" resolves
 * to the HOME bundle, not `login.html`. Home's own effect then 401s again
 * and calls this same handler again: an invisible infinite loop where the
 * URL bar (history API) says "/login" but the rendered tree is Home's
 * ErrorState. QA screenshot 2026-09-17 ("Не вдалося завантажити дані" stuck
 * after a valid backend fix) is this failure mode. Routing through the
 * already-mounted Next.js client router (UnauthorizedRedirect component,
 * layout.tsx) is a same-SPA client-side transition — no new server/asset
 * request at all, so the html5mode fallback never enters the picture.
 */
function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  const next = encodeURIComponent(window.location.pathname);
  window.dispatchEvent(new CustomEvent("communal:unauthorized", { detail: { next } }));
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: "include",
    signal: withTimeout().signal,
  });
  if (res.status === 401) handleUnauthorized();
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
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partial),
    signal: withTimeout().signal,
  });
  if (res.status === 401) handleUnauthorized();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Update failed: ${res.status}`, res.status);
  }
  const json = await res.json();
  return (json.data ?? json) as Settings;
}

/**
 * POST /api/login — submit the shared household password.
 * Returns true on success (session cookie is set by the server response;
 * credentials:"include" is required on native so the browser/WebView
 * actually stores the Set-Cookie from a cross-origin response).
 */
export async function postLogin(password: string): Promise<{ ok: boolean; status: number }> {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
    signal: withTimeout().signal,
  });
  return { ok: res.ok, status: res.status };
}

/**
 * POST /api/readings — create a new reading.
 * `allowRollover` (ticket #1, AC-3/AC-4) is an optional explicit override for
 * a real meter dial rollover; omit/false for ordinary submissions.
 */
export async function postReading(
  reading: Omit<Reading, "id"> & { allowRollover?: boolean }
): Promise<Reading> {
  const res = await fetch(`${API_BASE}/api/readings`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reading),
    signal: withTimeout().signal,
  });
  if (res.status === 401) handleUnauthorized();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Create failed: ${res.status}`, res.status);
  }
  const json = await res.json();
  return (json.data ?? json) as Reading;
}
