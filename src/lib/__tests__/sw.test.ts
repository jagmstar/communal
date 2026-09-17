/**
 * Regression test for public/sw.js's cross-origin fetch behavior.
 *
 * APK auth fix, 2026-09-17 (senior-fullstack-dev): this is the third real
 * bug this ticket found (after the proxy.ts CORS-preflight gap and the
 * html5mode hard-navigation loop). Confirmed via a live CDP Network
 * capture on the emulator: an intercepted cross-origin /api/* request
 * (native calls communal-navy.vercel.app; the SW's own origin is
 * https://localhost) came back from the service worker with
 * "fromServiceWorker": true and NO Cookie header on the outgoing request,
 * even though the identical fetch made directly from the page (bypassing
 * the SW) carried the session cookie and succeeded. The service worker
 * has no test file/harness in this repo, so this loads the real
 * public/sw.js source into a minimal self/caches/fetch sandbox (Node vm)
 * and exercises its actual "fetch" event listener — not a reimplementation
 * of the logic, the shipped file itself.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import vm from "vm";

const SW_SOURCE = readFileSync(resolve(__dirname, "../../../public/sw.js"), "utf-8");

interface FakeEvent {
  request: { url: string; method: string };
  respondWithCalled: boolean;
  responsePromise: Promise<unknown> | null;
  waitUntilPromise: Promise<unknown> | null;
  respondWith(p: Promise<unknown>): void;
  waitUntil(p: Promise<unknown>): void;
}

function makeEvent(url: string, method = "GET"): FakeEvent {
  const ev: FakeEvent = {
    request: { url, method },
    respondWithCalled: false,
    responsePromise: null,
    waitUntilPromise: null,
    respondWith(p) {
      this.respondWithCalled = true;
      this.responsePromise = p;
    },
    waitUntil(p) {
      this.waitUntilPromise = p;
    },
  };
  return ev;
}

describe("public/sw.js — cross-origin fetch handling", () => {
  let listeners: Record<string, (e: FakeEvent) => void>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    listeners = {};
    fetchMock = vi.fn().mockResolvedValue({ ok: true, clone: () => ({}) });

    const cachesMock = {
      open: vi.fn().mockResolvedValue({
        addAll: vi.fn().mockResolvedValue(undefined),
        put: vi.fn().mockResolvedValue(undefined),
        match: vi.fn().mockResolvedValue(undefined),
      }),
      keys: vi.fn().mockResolvedValue([]),
      match: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    const self = {
      addEventListener: (type: string, handler: (e: FakeEvent) => void) => {
        listeners[type] = handler;
      },
      location: { origin: "https://localhost" },
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn() },
    };

    const sandbox = {
      self,
      caches: cachesMock,
      fetch: fetchMock,
      Response: class {
        constructor(public body: unknown, public init: unknown) {}
      },
      URL,
      console,
    };

    vm.createContext(sandbox);
    vm.runInContext(SW_SOURCE, sandbox);
  });

  it("does NOT intercept a cross-origin /api/* GET (the actual bug: SW dropped the session cookie)", () => {
    const ev = makeEvent("https://communal-navy.vercel.app/api/meters");
    listeners["fetch"](ev);
    expect(ev.respondWithCalled).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("DOES intercept a same-origin /api/* GET (existing network-first behavior preserved)", () => {
    const ev = makeEvent("https://localhost/api/meters");
    listeners["fetch"](ev);
    expect(ev.respondWithCalled).toBe(true);
  });

  it("does not intercept cross-origin static assets either", () => {
    const ev = makeEvent("https://communal-navy.vercel.app/some-asset.png");
    listeners["fetch"](ev);
    expect(ev.respondWithCalled).toBe(false);
  });

  it("still intercepts same-origin static assets (cache-first)", () => {
    const ev = makeEvent("https://localhost/icon-192.svg");
    listeners["fetch"](ev);
    expect(ev.respondWithCalled).toBe(true);
  });

  it("ignores non-GET requests regardless of origin", () => {
    const ev = makeEvent("https://localhost/api/readings", "POST");
    listeners["fetch"](ev);
    expect(ev.respondWithCalled).toBe(false);
  });
});
