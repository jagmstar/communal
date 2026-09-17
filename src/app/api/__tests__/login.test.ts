import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

beforeAll(() => {
  process.env.COMMUNAL_SESSION_SECRET = "test-secret-for-login-route-spec-only";
  process.env.COMMUNAL_PASSWORD = "correct-horse-battery-staple";
});

import { GET, POST } from "../login/route";
import { isValidSessionValue, COOKIE_NAME } from "@/lib/session";

function makeRequest(body: unknown, ip = "203.0.113.1") {
  return new Request("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  }) as any;
}

describe("GET /api/login", () => {
  it("returns 405 (the login FORM is served by the /login page, not this route)", async () => {
    const response = await GET();
    expect(response.status).toBe(405);
  });
});

describe("POST /api/login", () => {
  it("sets a valid session cookie and returns ok:true for the correct password", async () => {
    const req = makeRequest({ password: "correct-horse-battery-staple" }, "203.0.113.10");
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);

    const setCookie = response.headers.get("Set-Cookie") || response.headers.get("set-cookie");
    expect(setCookie).toContain(`${COOKIE_NAME}=`);
    const value = setCookie!.split(`${COOKIE_NAME}=`)[1].split(";")[0];
    expect(isValidSessionValue(value)).toBe(true);
  });

  it("returns 401 for the wrong password, with no Set-Cookie", async () => {
    const req = makeRequest({ password: "wrong" }, "203.0.113.11");
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.12" },
      body: "not json{",
    }) as any;
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("returns 500 when COMMUNAL_PASSWORD is not configured", async () => {
    const original = process.env.COMMUNAL_PASSWORD;
    delete process.env.COMMUNAL_PASSWORD;
    try {
      const req = makeRequest({ password: "anything" }, "203.0.113.13");
      const response = await POST(req);
      expect(response.status).toBe(500);
    } finally {
      process.env.COMMUNAL_PASSWORD = original;
    }
  });

  it("returns 429 after MAX_ATTEMPTS_PER_WINDOW wrong attempts from the same IP (D7 partial mitigation)", async () => {
    const ip = "203.0.113.20";
    let lastResponse;
    for (let i = 0; i < 12; i++) {
      const req = makeRequest({ password: "wrong" }, ip);
      lastResponse = await POST(req);
    }
    expect(lastResponse!.status).toBe(429);
  });
});
