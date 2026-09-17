import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { NextRequest } from "next/server";

// The proxy auth gate reads COMMUNAL_SESSION_SECRET at request time (inside
// lib/session.ts's sign()/getSecret()), so it's safe to set this before
// importing — no module-level caching to worry about.
process.env.COMMUNAL_SESSION_SECRET = "test-secret-for-proxy-spec-only";

import { proxy, config } from "../proxy";
import { COOKIE_NAME, makeSessionCookieValue } from "../lib/session";

// Helper: build a NextRequest for a given path/method, optionally with a
// valid session cookie and/or a forwarded-for IP (unique per call so tests
// don't bleed into each other's rate-limit buckets unless explicitly shared).
function makeRequest(
  method: string,
  options: { ip?: string; path?: string; authed?: boolean; cookie?: string } = {}
) {
  const path = options.path ?? "/api/readings";
  const headers: Record<string, string> = {};
  if (options.ip) {
    headers["x-forwarded-for"] = options.ip;
  }
  const cookieValue = options.cookie ?? (options.authed ? makeSessionCookieValue() : undefined);
  if (cookieValue) {
    headers["cookie"] = `${COOKIE_NAME}=${cookieValue}`;
  }
  return new NextRequest(new URL(`http://localhost:3000${path}`), {
    method,
    headers,
  });
}

function makeApiRequest(
  method: string,
  options: { ip?: string; path?: string; authed?: boolean } = {}
) {
  // Pre-auth-gate tests always ran as authenticated household traffic in
  // intent (rate limiting / CORS preflight behavior) — default to a valid
  // session unless a test explicitly wants to exercise the 401 path.
  return makeRequest(method, { authed: true, ...options });
}

describe("proxy config", () => {
  it("matches all paths except static assets (auth gate now covers pages too)", () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher[0]).toContain("_next/static");
  });
});

describe("proxy — auth gate (ticket queue-20260917-0455-senior-fullstack-dev)", () => {
  it("redirects an unauthenticated page request to /login, preserving the path", () => {
    const req = makeRequest("GET", { path: "/settings" });
    const res = proxy(req);
    expect(res.status).toBe(307); // NextResponse.redirect default
    const location = res.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("next=%2Fsettings");
  });

  it("allows an authenticated page request through", () => {
    const req = makeRequest("GET", { path: "/settings", authed: true });
    const res = proxy(req);
    expect(res.status).toBe(200); // NextResponse.next() passthrough
  });

  it("rejects an unauthenticated /api/* request with 401", () => {
    const req = makeRequest("GET", { path: "/api/settings" });
    const res = proxy(req);
    expect(res.status).toBe(401);
  });

  it("rejects a forged session cookie with 401 (HMAC must actually verify)", async () => {
    const req = makeRequest("GET", {
      path: "/api/settings",
      cookie: "9999999999.deadbeef",
    });
    const res = proxy(req);
    expect(res.status).toBe(401);
  });

  it("allows an authenticated /api/* request through", () => {
    const req = makeRequest("GET", { path: "/api/settings", authed: true });
    const res = proxy(req);
    expect(res.status).toBe(200);
  });

  it.each(["/login", "/api/login", "/api/health"])(
    "leaves public path %s reachable with no session",
    (path) => {
      const req = makeRequest("GET", { path });
      const res = proxy(req);
      expect(res.status).toBe(200);
    }
  );

  it("does not gate static assets", () => {
    const req = makeRequest("GET", { path: "/manifest.json" });
    const res = proxy(req);
    expect(res.status).toBe(200);
  });
});

describe("proxy — CORS preflight", () => {
  // ACAO is the native app's fixed origin (was "*" until the APK auth fix,
  // 2026-09-17) — a wildcard is incompatible with the credentialed
  // (cookie) requests the native client now sends. See src/lib/cors.ts.
  it("returns 204 with CORS headers for OPTIONS on /api/* (no session needed for preflight)", () => {
    const req = makeRequest("OPTIONS", { path: "/api/meters" });
    const res = proxy(req);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://localhost");
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST, PUT, OPTIONS"
    );
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe(
      "Content-Type, Authorization"
    );
    expect(res.headers.get("Access-Control-Max-Age")).toBe("86400");
  });

  it("applies CORS preflight to any /api/* subpath", () => {
    const req = makeRequest("OPTIONS", { path: "/api/readings" });
    const res = proxy(req);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://localhost");
  });

  // Regression test for the actual bug found in this ticket's own emulator
  // QA run, 2026-09-17: /api/login and /api/health are in PUBLIC_PATHS, and
  // the OPTIONS handling used to run AFTER the public-path passthrough —
  // so their preflight got a bare NextResponse.next() with NO CORS headers
  // at all. A same-origin web caller never preflights, so this was
  // invisible on web; the native app's cross-origin POST to /api/login
  // always preflights, and a headerless-ACAO preflight response makes the
  // browser/WebView block the real POST before it is ever sent
  // (net::ERR_FAILED -> "Помилка мережі" on the login screen).
  it.each(["/api/login", "/api/health"])(
    "returns CORS headers for OPTIONS preflight on public path %s, not a bare passthrough",
    (path) => {
      const req = makeRequest("OPTIONS", { path });
      const res = proxy(req);
      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://localhost");
      expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
      expect(res.headers.get("Access-Control-Max-Age")).toBe("86400");
    }
  );

  it("still lets a non-OPTIONS request to a public path through with no CORS-preflight branch taken", () => {
    const req = makeRequest("GET", { path: "/api/login" });
    const res = proxy(req);
    expect(res.status).toBe(200); // NextResponse.next() passthrough, not 204
  });
});

describe("proxy — GET passthrough (authenticated)", () => {
  it("does not rate-limit or block authenticated GET requests", () => {
    const req = makeApiRequest("GET", { ip: "10.0.0.3" });
    const res = proxy(req);
    expect(res.status).toBe(200);
  });
});

describe("proxy — rate limiting (authenticated writes)", () => {
  it("allows the first 30 POST/PUT requests per minute per IP", () => {
    const ip = "10.1.1.1";
    for (let i = 0; i < 30; i++) {
      const req = makeApiRequest("POST", { ip });
      const res = proxy(req);
      expect(res.status).toBe(200);
    }
  });

  it("returns 429 with Retry-After: 60 on the 31st write within the window", () => {
    const ip = "10.1.1.2";
    let lastRes;
    for (let i = 0; i < 31; i++) {
      const req = makeApiRequest("POST", { ip });
      lastRes = proxy(req);
    }
    expect(lastRes!.status).toBe(429);
    expect(lastRes!.headers.get("Retry-After")).toBe("60");
    expect(lastRes!.headers.get("Access-Control-Allow-Origin")).toBe("https://localhost");
  });

  it("tracks PUT requests against the same per-IP write budget as POST", () => {
    const ip = "10.1.1.3";
    for (let i = 0; i < 30; i++) {
      const res = proxy(makeApiRequest("PUT", { ip }));
      expect(res.status).toBe(200);
    }
    const res31 = proxy(makeApiRequest("PUT", { ip }));
    expect(res31.status).toBe(429);
    expect(res31.headers.get("Retry-After")).toBe("60");
  });

  it("tracks rate limits independently per IP", () => {
    const ipA = "10.1.1.4";
    const ipB = "10.1.1.5";
    for (let i = 0; i < 30; i++) {
      expect(proxy(makeApiRequest("POST", { ip: ipA })).status).toBe(200);
    }
    // ipA is now at its limit; ipB should still be allowed
    const resA = proxy(makeApiRequest("POST", { ip: ipA }));
    const resB = proxy(makeApiRequest("POST", { ip: ipB }));
    expect(resA.status).toBe(429);
    expect(resB.status).toBe(200);
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = new NextRequest(
      new URL("http://localhost:3000/api/readings"),
      {
        method: "POST",
        headers: {
          "x-real-ip": "10.2.2.2",
          cookie: `${COOKIE_NAME}=${makeSessionCookieValue()}`,
        },
      }
    );
    const res = proxy(req);
    expect(res.status).toBe(200);
  });
});
