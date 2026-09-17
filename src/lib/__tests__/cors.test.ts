import { describe, it, expect } from "vitest";
import { CORS_HEADERS, NATIVE_ORIGIN } from "../cors";

// APK auth fix, 2026-09-17 (senior-fullstack-dev): CORS_HEADERS replaces the
// wildcard ACAO that was documented as an intentional D3 known-limitation
// in the prior ticket (docs/AUTH-APK-DECISION-2026-09-17.md). A wildcard
// ACAO is invalid for credentialed requests per the Fetch spec — asserting
// the exact origin + Allow-Credentials here is the regression test for that.
describe("CORS_HEADERS", () => {
  it("echoes the native app's fixed origin, not a wildcard", () => {
    expect(CORS_HEADERS["Access-Control-Allow-Origin"]).toBe(NATIVE_ORIGIN);
    expect(CORS_HEADERS["Access-Control-Allow-Origin"]).not.toBe("*");
  });

  it("sets Allow-Credentials: true (required for the session cookie to be usable cross-origin)", () => {
    expect(CORS_HEADERS["Access-Control-Allow-Credentials"]).toBe("true");
  });

  it("still allows the read/write methods and Content-Type header the app uses", () => {
    expect(CORS_HEADERS["Access-Control-Allow-Methods"]).toBe("GET, POST, PUT, OPTIONS");
    expect(CORS_HEADERS["Access-Control-Allow-Headers"]).toBe("Content-Type, Authorization");
  });

  it("sets Vary: Origin (a fixed non-wildcard ACAO is only cacheable per-origin)", () => {
    expect(CORS_HEADERS["Vary"]).toBe("Origin");
  });
});
