/**
 * POST /api/login — validates the shared household password, sets the
 * HMAC session cookie on success.
 * GET  /api/login  — 405 (the login FORM is served by the /login page,
 *   this route is API-only; killtest only requires GET/POST/etc to not be
 *   5xx, see communal-auth-killtest.ps1 "public route must stay reachable").
 *
 * Pattern ported from F:\dt-home\cloud-dashboard\api\login.js per ticket
 * step 1 ("реюзай, не вигадуй"), adapted from Vercel's classic `module.exports`
 * function style to a Next.js App Router Route Handler.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { setSessionCookieHeader, timingSafeEqualStr } from "@/lib/session";

// ---------------------------------------------------------------------------
// Login audit log — same fingerprinting approach as cloud-dashboard/api/login.js:
// never log the raw password, raw IP, or raw user-agent. Vercel captures
// console.log as function logs (`vercel logs`), no DB/KV provisioned for this
// project (same tradeoff as cloud-dashboard — Roman's call if this needs to
// become a persistent store later).
function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "";
}

function ipFingerprint(ip: string): string {
  if (!ip) return "unknown";
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
  if (v4) return `${v4[1]}.${v4[2]}.${v4[3]}.x`;
  const secret = process.env.COMMUNAL_SESSION_SECRET || "login-log-fallback-salt";
  return "h:" + crypto.createHash("sha256").update(secret + ip).digest("hex").slice(0, 12);
}

function uaFingerprint(ua: string | null): string {
  if (!ua) return "unknown";
  return crypto.createHash("sha256").update(ua).digest("hex").slice(0, 12);
}

function logLoginAttempt(req: NextRequest, success: boolean) {
  const entry = {
    event: "login_attempt",
    ts: new Date().toISOString(),
    success,
    ip_fp: ipFingerprint(clientIp(req)),
    ua_fp: uaFingerprint(req.headers.get("user-agent")),
  };
  console.log(JSON.stringify(entry));
}

// D7 (QA gate, both rounds): rate limiting is NOT implemented — this is a
// single-instance in-memory limiter, which only slows a single Vercel
// function instance and does NOT protect against distributed attempts
// across cold-started instances. Documented as a known limitation in the
// PR description per the ticket; real fix (KV-backed limiter) is a
// follow-up, not silently skipped.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 10;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS_PER_WINDOW;
}

export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const key = ipFingerprint(clientIp(request));
  if (isRateLimited(key)) {
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const expected = process.env.COMMUNAL_PASSWORD || "";

  if (!expected) {
    return NextResponse.json(
      { error: "server_misconfigured", message: "COMMUNAL_PASSWORD not set" },
      { status: 500 }
    );
  }

  const ok = timingSafeEqualStr(password, expected);
  logLoginAttempt(request, ok);

  if (!ok) {
    return NextResponse.json({ ok: false, error: "wrong_password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", setSessionCookieHeader());
  return res;
}
