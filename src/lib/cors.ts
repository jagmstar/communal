/**
 * CORS headers shared by the proxy and every /api/* route.
 *
 * Ticket: APK auth fix 2026-09-17 (senior-fullstack-dev), closing the
 * "Known issue" in docs/AUTH-APK-DECISION-2026-09-17.md (option 3c).
 *
 * Once the native app sends `credentials: "include"` (src/lib/api.ts), the
 * Fetch/WebView CORS algorithm REJECTS a wildcard `Access-Control-Allow-Origin:
 * "*"` outright for that request — the spec requires the exact request
 * origin to be echoed back, plus `Access-Control-Allow-Credentials: true`.
 * This is why option 3b (wildcard ACAO, no client credentials) could never
 * support the APK: it is not a config oversight, it is mutually exclusive
 * with cookie-based native auth.
 *
 * This project has exactly ONE legitimate cross-origin caller of its API:
 * the Capacitor Android WebView, whose default origin (no `server.*`
 * override in capacitor.config.ts => androidScheme "https", hostname
 * "localhost", see capacitorjs.com/docs/config #server) is fixed and known
 * ahead of time. Same-origin web requests (the Vercel-hosted SPA calling
 * its own relative /api/* routes) never trigger a browser CORS check at
 * all, so a static (non-request-echoing) ACAO value is sufficient here —
 * no need to thread the request's Origin header through every route
 * handler's signature for a single-origin allowlist of one.
 */
export const NATIVE_ORIGIN = "https://localhost";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": NATIVE_ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Vary": "Origin",
};
