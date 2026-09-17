import { describe, it, expect, beforeAll, vi } from "vitest";

beforeAll(() => {
  process.env.COMMUNAL_SESSION_SECRET = "test-secret-for-session-spec-only";
});

import {
  makeSessionCookieValue,
  isValidSessionValue,
  setSessionCookieHeader,
  clearSessionCookieHeader,
  timingSafeEqualStr,
  COOKIE_NAME,
} from "../session";

describe("session cookie value", () => {
  it("produces a value the module itself accepts as valid", () => {
    const value = makeSessionCookieValue();
    expect(isValidSessionValue(value)).toBe(true);
  });

  it("rejects a forged value with a bogus HMAC (D3 killtest: forged cookie must fail closed)", () => {
    expect(isValidSessionValue("9999999999.deadbeef")).toBe(false);
  });

  it("rejects a well-formed but expired value", () => {
    const past = Math.floor(Date.now() / 1000) - 10;
    // Any mac at all — expiry check short-circuits before the mac compare.
    expect(isValidSessionValue(`${past}.00`)).toBe(false);
  });

  it("rejects malformed values (wrong shape, missing parts, non-string)", () => {
    expect(isValidSessionValue("")).toBe(false);
    expect(isValidSessionValue(undefined)).toBe(false);
    expect(isValidSessionValue(null)).toBe(false);
    expect(isValidSessionValue("no-dot-here")).toBe(false);
    expect(isValidSessionValue("a.b.c")).toBe(false);
  });

  it("fails closed (not throws) when COMMUNAL_SESSION_SECRET is unset at verify time", () => {
    const value = makeSessionCookieValue();
    const original = process.env.COMMUNAL_SESSION_SECRET;
    delete process.env.COMMUNAL_SESSION_SECRET;
    try {
      expect(() => isValidSessionValue(value)).not.toThrow();
      expect(isValidSessionValue(value)).toBe(false);
    } finally {
      process.env.COMMUNAL_SESSION_SECRET = original;
    }
  });
});

describe("Set-Cookie headers", () => {
  // SameSite=None (was Lax) as of the APK auth fix, 2026-09-17: the native
  // app's requests are cross-site, and SameSite=Lax never attaches to a
  // cross-site fetch — see the comment on setSessionCookieHeader.
  it("setSessionCookieHeader includes HttpOnly, Secure, SameSite=None, 30-day Max-Age", () => {
    const header = setSessionCookieHeader();
    expect(header).toContain(`${COOKIE_NAME}=`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=None");
    expect(header).toContain(`Max-Age=${60 * 60 * 24 * 30}`);
  });

  it("clearSessionCookieHeader expires the cookie immediately", () => {
    const header = clearSessionCookieHeader();
    expect(header).toContain(`${COOKIE_NAME}=;`);
    expect(header).toContain("Max-Age=0");
  });
});

describe("timingSafeEqualStr", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqualStr("hunter2", "hunter2")).toBe(true);
  });

  it("returns false for different strings, including different lengths", () => {
    expect(timingSafeEqualStr("hunter2", "hunter3")).toBe(false);
    expect(timingSafeEqualStr("short", "muchlongerstring")).toBe(false);
  });
});
