// INDEPENDENT QA kill-test — written from scratch, NOT copied from the dev's
// src/__tests__/proxy.test.ts. Imports the real module directly from its
// actual file path so an export-name/path mistake (attack #1/#3) would fail
// this import, independent of whatever the dev's own test does.
//
// This exact file is copied into each worktree's src/__tests__/ dir by
// run-killtests.ps1, with __QA_IMPORT_LINE__ and __QA_FN_NAME__ substituted
// per-commit (middleware.ts/middleware on parent, proxy.ts/proxy on patched).

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
__QA_IMPORT_LINE__

function makeApiRequest(
  method: string,
  opts: { ip?: string; path?: string } = {}
) {
  const path = opts.path ?? "/api/readings";
  const headers: Record<string, string> = {};
  if (opts.ip) headers["x-forwarded-for"] = opts.ip;
  return new NextRequest(new URL(`http://localhost:3000${path}`), {
    method,
    headers,
  });
}

describe("QA independent - config.matcher exact value (attack #2)", () => {
  it("matcher is exactly /api/:path* (not dropped, not widened, not narrowed)", () => {
    expect(__QA_CONFIG__.matcher).toBe("/api/:path*");
  });
});

describe("QA independent - non-API passthrough (attack #2 scope check)", () => {
  it("does not rate-limit or CORS-override a non-/api path (e.g. /history)", () => {
    const req = new NextRequest(new URL("http://localhost:3000/history"), {
      method: "OPTIONS",
    });
    const res = __QA_FN__(req);
    expect(res.status).not.toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("QA independent - CORS preflight on named route /api/readings", () => {
  it("OPTIONS -> 204 with all 4 exact CORS headers", () => {
    const req = makeApiRequest("OPTIONS", { ip: "203.0.113.10" });
    const res = __QA_FN__(req);
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
});

describe("QA independent - rate limit boundary (30 ok, 31st -> 429)", () => {
  it("allows exactly 30 POST writes then 429s on the 31st with Retry-After: 60", () => {
    const ip = "203.0.113.20";
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const req = makeApiRequest("POST", { ip });
      const res = __QA_FN__(req);
      statuses.push(res.status);
      if (i === 30) {
        expect(res.status).toBe(429);
        expect(res.headers.get("Retry-After")).toBe("60");
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
      }
    }
    const first30 = statuses.slice(0, 30);
    expect(first30.every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });

  it("PUT is tracked against the same per-IP write budget as POST", () => {
    const ip = "203.0.113.21";
    for (let i = 0; i < 30; i++) {
      __QA_FN__(makeApiRequest("PUT", { ip }));
    }
    const res = __QA_FN__(makeApiRequest("POST", { ip }));
    expect(res.status).toBe(429);
  });

  it("tracks rate limit independently per IP", () => {
    const ipA = "203.0.113.30";
    const ipB = "203.0.113.31";
    for (let i = 0; i < 30; i++) {
      __QA_FN__(makeApiRequest("POST", { ip: ipA }));
    }
    const blockedA = __QA_FN__(makeApiRequest("POST", { ip: ipA }));
    const okB = __QA_FN__(makeApiRequest("POST", { ip: ipB }));
    expect(blockedA.status).toBe(429);
    expect(okB.status).toBe(200);
  });

  it("GET is never rate-limited even after exceeding the write budget", () => {
    const ip = "203.0.113.40";
    for (let i = 0; i < 35; i++) {
      __QA_FN__(makeApiRequest("POST", { ip }));
    }
    const res = __QA_FN__(makeApiRequest("GET", { ip }));
    expect(res.status).toBe(200);
  });
});
