// @vitest-environment jsdom
//
// Needs `window`/`window.location` for the 401 -> /login redirect assertions
// below, so this "node"-project test file (*.test.ts, not *.test.tsx) opts
// into jsdom per-file via the environment docblock (vitest.dev/config
// #environment) instead of moving to the "dom" project's *.test.tsx-only
// glob, which would also pull in @testing-library/react's cleanup() —
// unneeded and unwanted for a pure-function/module test like this one.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// APK auth fix, 2026-09-17 (senior-fullstack-dev): regression coverage for
// credentials:"include" on every request helper and the 401 -> /login
// redirect. Before this ticket, src/lib/api.ts had no test file at all.

vi.mock("../capacitor", () => ({
  isNative: vi.fn(() => false),
}));

function mockLocation(pathname: string) {
  const location = {
    pathname,
    href: "",
    assign(url: string) {
      this.href = url;
    },
  };
  Object.defineProperty(window, "location", {
    value: location,
    writable: true,
  });
  return location;
}

describe("lib/api — credentials + 401 handling", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    mockLocation("/history");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchMeters sends credentials: include", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });
    const { fetchMeters } = await import("../api");
    await fetchMeters();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/meters"),
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("postReading sends credentials: include", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: {} }),
    });
    const { postReading } = await import("../api");
    await postReading({
      meterId: "a1b2c3d4-0001-4000-8000-000000000001",
      value: 10,
      date: "2026-09-17",
      ocrConfidence: 0,
      ocrEngine: "manual",
      submittedToEps: false,
      submittedAt: null,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/readings"),
      expect.objectContaining({ credentials: "include", method: "POST" })
    );
  });

  it("putSettings sends credentials: include", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: {} }),
    });
    const { putSettings } = await import("../api");
    await putSettings({ userName: "x" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/settings"),
      expect.objectContaining({ credentials: "include", method: "PUT" })
    );
  });

  it("postLogin sends credentials: include and reports ok/status", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    const { postLogin } = await import("../api");
    const result = await postLogin("pw");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/login"),
      expect.objectContaining({ credentials: "include", method: "POST" })
    );
    expect(result).toEqual({ ok: true, status: 200 });
  });

  // These assert a "communal:unauthorized" DOM event, NOT
  // window.location.href — see the comment on handleUnauthorized() in
  // ../api.ts. A hard nav to "/login" under Capacitor's static-export
  // html5mode resolves to index.html (Home), not login.html, causing a
  // silent infinite 401 loop (the actual bug this ticket found in the QA
  // emulator run, 2026-09-17: URL bar said /login, rendered tree was
  // Home's ErrorState). The event is consumed by
  // components/UnauthorizedRedirect.tsx via next/navigation's router,
  // which is a same-SPA transition and never touches Capacitor's asset
  // resolution.
  it("dispatches communal:unauthorized with next= on a 401 from a GET helper", async () => {
    mockLocation("/history");
    const handler = vi.fn();
    window.addEventListener("communal:unauthorized", handler);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "unauthorized" }),
    });
    const { fetchMeters, ApiError } = await import("../api");
    await expect(fetchMeters()).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{ next: string }>;
    expect(event.detail.next).toBe("%2Fhistory");
    window.removeEventListener("communal:unauthorized", handler);
  });

  it("does not dispatch the event again when already on /login", async () => {
    mockLocation("/login");
    const handler = vi.fn();
    window.addEventListener("communal:unauthorized", handler);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "unauthorized" }),
    });
    const { fetchMeters, ApiError } = await import("../api");
    await expect(fetchMeters()).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled();
    window.removeEventListener("communal:unauthorized", handler);
  });
});
