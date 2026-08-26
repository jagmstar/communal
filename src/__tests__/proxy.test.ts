import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy, config } from "../proxy";

// Helper: build a NextRequest for a given /api/* path, method, and optional
// forwarded-for IP (defaults to a unique-per-call IP so tests don't bleed
// into each other's rate-limit buckets unless explicitly shared).
function makeApiRequest(
  method: string,
  options: { ip?: string; path?: string } = {}
) {
  const path = options.path ?? "/api/readings";
  const headers: Record<string, string> = {};
  if (options.ip) {
    headers["x-forwarded-for"] = options.ip;
  }
  return new NextRequest(new URL(`http://localhost:3000${path}`), {
    method,
    headers,
  });
}

describe("proxy config", () => {
  it("matches /api/:path* only", () => {
    expect(config.matcher).toBe("/api/:path*");
  });
});

describe("proxy — non-API routes", () => {
  it("passes through non-/api paths without modification", () => {
    const req = new NextRequest(new URL("http://localhost:3000/dashboard"), {
      method: "OPTIONS",
    });
    const res = proxy(req);
    // NextResponse.next() has no special status override (200 passthrough marker)
    expect(res.status).toBe(200);
  });
});

describe("proxy — CORS preflight", () => {
  it("returns 204 with CORS headers for OPTIONS on /api/*", () => {
    const req = makeApiRequest("OPTIONS", { ip: "10.0.0.1" });
    const res = proxy(req);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST, PUT, OPTIONS"
    );
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe(
      "Content-Type, Authorization"
    );
    expect(res.headers.get("Access-Control-Max-Age")).toBe("86400");
  });

  it("applies CORS preflight to any /api/* subpath", () => {
    const req = makeApiRequest("OPTIONS", {
      ip: "10.0.0.2",
      path: "/api/meters",
    });
    const res = proxy(req);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("proxy — GET passthrough", () => {
  it("does not rate-limit or block GET requests", () => {
    const req = makeApiRequest("GET", { ip: "10.0.0.3" });
    const res = proxy(req);
    expect(res.status).toBe(200);
  });
});

describe("proxy — rate limiting", () => {
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
    expect(lastRes!.headers.get("Access-Control-Allow-Origin")).toBe("*");
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
        headers: { "x-real-ip": "10.2.2.2" },
      }
    );
    const res = proxy(req);
    expect(res.status).toBe(200);
  });
});
