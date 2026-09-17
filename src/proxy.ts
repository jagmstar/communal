/**
 * Next.js Proxy — CORS preflight, rate limiting, and session auth gate.
 *
 * Handles OPTIONS preflight requests for all /api/* routes, rate-limits
 * POST/PUT writes, and (ticket queue-20260917-0455-senior-fullstack-dev,
 * step 2) rejects any request — page or /api/* — that lacks a valid
 * session cookie, except the public allowlist (/login, /api/login,
 * /api/health). This closes deliverables/qa/communal-auth-gate-2026-09-16.md
 * D1/D2: every route previously served Roman's data (incl. EPS account
 * identifiers via /api/settings) to unauthenticated callers.
 *
 * File convention: this repo already had `src/proxy.ts` (Next.js 16 renamed
 * middleware.ts -> proxy.ts, see nextjs.org/docs/app/api-reference/file-conventions/proxy)
 * scoped to `/api/:path*` only. The auth gate below runs FIRST inside the
 * same function and is intentionally NOT split into a second proxy file —
 * Next.js only loads one proxy/middleware file per project.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasValidSession } from "@/lib/session";

// Runtime: proxy.ts ALWAYS runs on Node.js in Next 16 (this project's
// installed version, package.json "next": "16.3.2") — the `runtime` export
// is illegal here (build error: "Route segment config is not allowed in
// Proxy file ... Proxy always runs on Node.js runtime", confirmed via a
// failed `vercel --prod` build this ticket). This is exactly what
// lib/session.ts needs: it uses node:crypto (createHmac/timingSafeEqual),
// which the Edge runtime does not support — Next 16's Node-by-default proxy
// makes that automatic, nothing to declare.
//
// Routes that must stay reachable with NO session (killtest "public" list,
// deliverables/qa/communal-auth-killtest.ps1 $public).
const PUBLIC_PATHS = new Set(["/login", "/api/login", "/api/health"]);

// ============================================
// Rate limiting (in-memory, per-serverless-instance)
// ============================================

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_WRITES = 30; // max POST/PUT per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_WRITES) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up expired entries periodically (every 5 minutes)
let lastCleanup = Date.now();
function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return; // 5 minutes
  lastCleanup = now;
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}

// ============================================
// Static-asset guard (belt-and-braces alongside the matcher's negative
// lookahead below — Next docs warn a loosened matcher can silently
// re-include these and break asset loading under an auth gate).
// ============================================

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    /\.(svg|png|jpg|jpeg|ico|webmanifest|txt)$/.test(pathname)
  );
}

// ============================================
// Proxy
// ============================================

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Public allowlist: reachable with no session, always (killtest $public).
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/api")) {
    // Page route (/, /submit, /history, /settings, …): no valid session ->
    // redirect to /login, preserving the originally requested path so the
    // login page can send the user back after a successful login.
    // INVARIANT auth#1 (ticket queue-20260917-0455-senior-fullstack-dev step 2):
    // every page outside PUBLIC_PATHS requires a valid session cookie,
    // enforced here at the proxy boundary before any page component renders.
    if (hasValidSession(request)) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- /api/* below (excluding the PUBLIC_PATHS handled above) ---

  cleanupExpiredEntries();

  // Handle CORS preflight — must be answered before the auth check: a
  // preflight OPTIONS request never carries the app's cookies/credentials,
  // so gating it on session would break every cross-origin caller's actual
  // (post-preflight) request before it's even sent.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // INVARIANT auth#1 (ticket queue-20260917-0455-senior-fullstack-dev step 2):
  // every /api/* route outside PUBLIC_PATHS requires a valid session cookie.
  // Enforced ONCE here so no individual route.ts can forget it — this is
  // exactly the hole in deliverables/qa/communal-auth-gate-2026-09-16.md D1/D2
  // (/api/settings leaked Roman's EPS account identifiers to anyone, no
  // session at all).
  if (!hasValidSession(request)) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  // Rate limit write operations (authenticated callers only — an
  // unauthenticated write is already rejected above, so the write-rate
  // budget is reserved for the real household user, not probing).
  if (request.method === "POST" || request.method === "PUT") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Занадто багато запитів. Спробуйте пізніше." },
        {
          status: 429,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Retry-After": "60",
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|ico|webmanifest|txt)$).*)",
  ],
};
