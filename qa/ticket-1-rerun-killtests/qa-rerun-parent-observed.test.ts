/**
 * Ticket #1 — QA RE-RUN kill-tests, PARENT-OBSERVED variant.
 *
 * Identical scenarios to `qa-rerun-killtests.test.ts`, but with assertions written to
 * match the EXPECTED-ON-PARENT (pre-fix, commit 2d2652b~1 = 1aa54d1) behavior instead of
 * the expected-on-patched behavior. This lets both worktrees run this suite green when
 * the fix is truly commit-scoped (i.e. behavior differs exactly as claimed between
 * parent and patched, with no other drift). This file exists ONLY to independently
 * confirm the parent's pre-fix bug is real and reproducible via the direct route-handler
 * path (not to authorize the parent's behavior as acceptable).
 *
 * If this file's assertions ALSO pass on the "patched" worktree, that would itself be a
 * red flag (would mean the fix commit didn't actually change observable behavior).
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db/queries", () => ({
  getReadings: vi.fn(),
  createReading: vi.fn(),
  getMeterById: vi.fn(),
}));
vi.mock("@/lib/db/client", () => ({
  getSql: vi.fn(),
}));

import { POST } from "@/app/api/readings/route";
import { getMeterById, createReading } from "@/lib/db/queries";
import type { Meter } from "@/lib/types";

const METER_ID = "a1b2c3d4-0001-4000-8000-000000000001";

function meter(overrides: Partial<Meter> = {}): Meter {
  return {
    id: METER_ID,
    meterNumber: "001",
    serviceType: "water",
    serviceName: "Вода",
    unit: "м³",
    lastReading: 12453,
    lastReadingDate: "2026-07-31",
    submitDeadlineDay: 31,
    submitWindowStart: 25,
    color: "#0ea5e9",
    colorLight: "#e0f2fe",
    icon: "droplet",
    ...overrides,
  };
}

function makeRequest(url: string, options: { method?: string; body?: unknown } = {}) {
  const init: RequestInit = { method: options.method ?? "GET" };
  if (options.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }
  return new Request(url, init) as any;
}

describe("(a) F1 regression on PARENT: 12453 -> 1453, allowRollover:true -> EXPECTED 201 (bug present, ratio=0.5)", () => {
  it("POST lastReading=12453, value=1453, allowRollover:true", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 12453, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r1", meterId: METER_ID, value: 1453, date: "2026-08-15" });
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 1453, date: "2026-08-15", allowRollover: true },
    });
    const res = await POST(req);
    console.log(`QA-RERUN-PARENT-OBSERVED F1 status=${res.status} (expect 201 on parent = bug present)`);
    expect(res.status).toBe(201);
  });
});

describe("(b) genuine rollover on PARENT: 99998 -> 5, allowRollover:true -> EXPECTED 201 (parent also accepts genuine rollovers)", () => {
  it("POST lastReading=99998, value=5, allowRollover:true", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 99998, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r2", meterId: METER_ID, value: 5, date: "2026-08-15" });
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 5, date: "2026-08-15", allowRollover: true },
    });
    const res = await POST(req);
    console.log(`QA-RERUN-PARENT-OBSERVED genuine-rollover status=${res.status}`);
    expect(res.status).toBe(201);
  });
});

describe("(c) boundary probe on PARENT (ratio=0.5, not 0.05 -- this just documents parent's much looser gate): lastReading=1000, value=49 and 51", () => {
  it("POST lastReading=1000, value=49, allowRollover:true -> expect 201 (49 < 500 under parent's 0.5 ratio)", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 1000, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r3", meterId: METER_ID, value: 49, date: "2026-08-15" });
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 49, date: "2026-08-15", allowRollover: true },
    });
    const res = await POST(req);
    console.log(`QA-RERUN-PARENT-OBSERVED boundary value=49 status=${res.status}`);
    expect(res.status).toBe(201);
  });

  it("POST lastReading=1000, value=51, allowRollover:true -> expect 201 (51 < 500 under parent's 0.5 ratio too -- parent's gate is far looser)", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 1000, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r3b", meterId: METER_ID, value: 51, date: "2026-08-15" });
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 51, date: "2026-08-15", allowRollover: true },
    });
    const res = await POST(req);
    console.log(`QA-RERUN-PARENT-OBSERVED boundary value=51 status=${res.status}`);
    expect(res.status).toBe(201);
  });
});

describe("(d) non-flag path on PARENT (unchanged claim -- should be identical to patched)", () => {
  it("POST lastReading=200, value=150, no flag -> expect 400 (regression check itself predates this fix, from ticket #1's first patch 30a3628)", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 200, lastReadingDate: "2026-07-31" }));
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 150, date: "2026-08-15" },
    });
    const res = await POST(req);
    console.log(`QA-RERUN-PARENT-OBSERVED no-flag-regression status=${res.status}`);
    expect(res.status).toBe(400);
  });

  it("POST lastReading=200, value=250 (legit increase) -> expect 201", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 200, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r4", meterId: METER_ID, value: 250, date: "2026-08-15" });
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 250, date: "2026-08-15" },
    });
    const res = await POST(req);
    console.log(`QA-RERUN-PARENT-OBSERVED legit-increase status=${res.status}`);
    expect(res.status).toBe(201);
  });
});
