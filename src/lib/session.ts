/**
 * lib/session.ts — tiny HMAC-signed session cookie for Communal (Next.js App Router).
 *
 * Ported from the proven pattern at F:\dt-home\cloud-dashboard\lib\session.js
 * (single-password / single-user dashboard, no DB, no JWT lib) per ticket
 * queue-20260917-0455-senior-fullstack-dev step 1 ("реюзай, не вигадуй").
 *
 * Session value format: "<unix_expiry_ts>.<hex_hmac>"
 * hmac = HMAC-SHA256(secret, "communal_session:" + expiry), constant-time compared.
 * There is no user identity in the payload — there's exactly one password/one
 * household (Roman) sharing this login, same trust model as cloud-dashboard.
 *
 * Runtime note: this module uses Node's `crypto` (createHmac, timingSafeEqual).
 * The consuming middleware.ts declares `export const runtime = "nodejs"` so
 * this is safe to import there (Next 16 middleware Node runtime is stable
 * since v15.5, see nextjs.org/docs/app/api-reference/file-conventions/proxy
 * version history).
 */
import crypto from "crypto";
import type { NextRequest } from "next/server";

export const COOKIE_NAME = "communal_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days, per ticket step 1

function getSecret(): string {
  const secret = process.env.COMMUNAL_SESSION_SECRET;
  if (!secret) {
    throw new Error("COMMUNAL_SESSION_SECRET env var is not set");
  }
  return secret;
}

function sign(expiry: number): string {
  const secret = getSecret();
  const h = crypto.createHmac("sha256", secret);
  h.update(`communal_session:${expiry}`);
  return h.digest("hex");
}

export function makeSessionCookieValue(): string {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const mac = sign(expiry);
  return `${expiry}.${mac}`;
}

export function isValidSessionValue(value: string | undefined | null): boolean {
  if (!value || typeof value !== "string") return false;
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [expiryStr, mac] = parts;
  const expiry = parseInt(expiryStr, 10);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) {
    return false; // expired
  }
  let expectedMac: string;
  try {
    expectedMac = sign(expiry);
  } catch {
    return false; // COMMUNAL_SESSION_SECRET not set — fail closed
  }
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(expectedMac, "hex");
  // Forged/garbage MAC of a different length must still fail closed without
  // throwing — timingSafeEqual requires equal-length buffers.
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  cookieHeader.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  });
  return out;
}

/** Reads the session cookie off a NextRequest (middleware) and validates it. */
export function hasValidSession(req: NextRequest): boolean {
  const cookies = parseCookies(req.headers.get("cookie") || "");
  return isValidSessionValue(cookies[COOKIE_NAME]);
}

export function setSessionCookieHeader(): string {
  const value = makeSessionCookieValue();
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // still compare against a same-length buffer to avoid a length side-channel
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export { timingSafeEqualStr };
