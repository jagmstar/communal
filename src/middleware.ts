/**
 * Next.js Middleware — CORS preflight & basic rate limiting
 *
 * Handles OPTIONS preflight requests for all /api/* routes.
 * Implements a simple in-memory rate limiter for POST/PUT write operations.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
// Middleware
// ============================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  cleanupExpiredEntries();

  // Handle CORS preflight
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

  // Rate limit write operations
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
  matcher: "/api/:path*",
};
