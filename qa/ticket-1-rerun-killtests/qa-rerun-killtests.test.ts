/**
 * Ticket #1 — QA RE-RUN kill-tests (Adversarial Two-Run, independent twin).
 *
 * This is a fresh, from-scratch kill-test file for the RE-RUN verification of dev
 * commit `2d2652b` ("fix(#1): tighten rollover plausibility per QA verdict, dedupe
 * predicate"), which claims to fix Findings F1 and F2 from the original REJECT verdict
 * (`qa/ticket-1-verdict.md`, commit `1aa54d1`).
 *
 * Run against BOTH worktrees:
 *   F:\communal-qa-parent2   @ 2d2652b~1  (= 1aa54d1, still has ROLLOVER_MAX_RATIO=0.5,
 *                                          the F1 bug the original REJECT verdict found)
 *   F:\communal-qa-patched2  @ 2d2652b    (dev's claimed fix)
 *
 * Do NOT trust the dev-report numbers — every assertion here is independently derived
 * arithmetic, not copied from the dev's own test file or report.
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

async function post(body: unknown) {
  (getMeterById as any).mockResolvedValue(meter({ lastReading: (body as any).__lastReading ?? 12453 }));
  (createReading as any).mockResolvedValue({ id: "r1", ...((body as any) as object) });
  const req = makeRequest("http://localhost:3000/api/readings", { method: "POST", body });
  return POST(req);
}

// ---------------------------------------------------------------------------
// (a) F1 regression — the ticket's own headline OCR-misread example
// ---------------------------------------------------------------------------
describe("(a) F1 regression: 12453 -> 1453, allowRollover:true", () => {
  it("arithmetic re-derivation, independent of dev claim", () => {
    const ratio = 1453 / 12453;
    const dropPercent = (1 - ratio) * 100;
    expect(dropPercent).toBeCloseTo(88.33, 1);
    // Under OLD ratio 0.5 (parent): 1453 < 12453*0.5=6226.5 -> TRUE -> bug present (201 expected)
    expect(1453 < 12453 * 0.5).toBe(true);
    // Under NEW ratio 0.05 (patched, per dev claim): 1453 < 12453*0.05=622.65 -> FALSE -> rejected (400 expected)
    expect(1453 < 12453 * 0.05).toBe(false);
  });

  it("POST meterId lastReading=12453, value=1453, allowRollover:true -> route handler status", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 12453, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r1", meterId: METER_ID, value: 1453, date: "2026-08-15" });
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 1453, date: "2026-08-15", allowRollover: true },
    });
    const res = await POST(req);
    console.log(`QA-RERUN F1 status=${res.status}`);
    // NOTE: this expectation is written to PASS on the PATCHED commit (400 expected).
    // On the PARENT commit this assertion is expected to FAIL (parent returns 201) —
    // that mismatch is itself the evidence the bug was present pre-fix. See raw logs.
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// (b) Genuine rollover still accepted on patched
// ---------------------------------------------------------------------------
describe("(b) genuine rollover: 99998 -> 5, allowRollover:true -> 201 on patched", () => {
  it("arithmetic: 5/99998 drop is >99.99%, comfortably under both 0.5 and 0.05 ratios", () => {
    const ratio = 5 / 99998;
    expect(ratio).toBeLessThan(0.05);
  });

  it("POST lastReading=99998, value=5, allowRollover:true", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 99998, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r2", meterId: METER_ID, value: 5, date: "2026-08-15" });
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 5, date: "2026-08-15", allowRollover: true },
    });
    const res = await POST(req);
    console.log(`QA-RERUN genuine-rollover status=${res.status}`);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// (c) Boundary probe around the 5% edge: lastReading=1000, submit 49 vs 51
// ---------------------------------------------------------------------------
describe("(c) boundary probe: lastReading=1000, ratio edge at 50 (5%)", () => {
  it("arithmetic: 49/1000=4.9% (< 5%, should be plausible); 51/1000=5.1% (>= 5%, should NOT be plausible); exact 50/1000=5.0% is the documented edge", () => {
    expect(49 < 1000 * 0.05).toBe(true); // 49 < 50 -> true -> plausible
    expect(51 < 1000 * 0.05).toBe(false); // 51 < 50 -> false -> not plausible
    expect(50 < 1000 * 0.05).toBe(false); // 50 < 50 -> false (strict <, not <=) -> exact 5% is NOT plausible
  });

  it("POST lastReading=1000, value=49, allowRollover:true -> expect 201 (under 5%)", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 1000, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r3", meterId: METER_ID, value: 49, date: "2026-08-15" });
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 49, date: "2026-08-15", allowRollover: true },
    });
    const res = await POST(req);
    console.log(`QA-RERUN boundary value=49 status=${res.status}`);
    expect(res.status).toBe(201);
  });

  it("POST lastReading=1000, value=51, allowRollover:true -> expect 400 (at/over 5%)", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 1000, lastReadingDate: "2026-07-31" }));
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 51, date: "2026-08-15", allowRollover: true },
    });
    const res = await POST(req);
    console.log(`QA-RERUN boundary value=51 status=${res.status}`);
    expect(res.status).toBe(400);
  });

  it("POST lastReading=1000, value=50 (exact 5% boundary), allowRollover:true -> documents actual behavior at the exact edge", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 1000, lastReadingDate: "2026-07-31" }));
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 50, date: "2026-08-15", allowRollover: true },
    });
    const res = await POST(req);
    console.log(`QA-RERUN boundary EXACT EDGE value=50 status=${res.status} (strict < means exact 5% should be REJECTED/400)`);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// (d) Non-flag path unchanged
// ---------------------------------------------------------------------------
describe("(d) non-flag path unchanged", () => {
  it("POST lastReading=200, value=150, no flag -> 400", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 200, lastReadingDate: "2026-07-31" }));
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 150, date: "2026-08-15" },
    });
    const res = await POST(req);
    console.log(`QA-RERUN no-flag-regression status=${res.status}`);
    expect(res.status).toBe(400);
  });

  it("POST lastReading=200, value=250 (legit increase) -> 201", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 200, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r4", meterId: METER_ID, value: 250, date: "2026-08-15" });
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 250, date: "2026-08-15" },
    });
    const res = await POST(req);
    console.log(`QA-RERUN legit-increase status=${res.status}`);
    expect(res.status).toBe(201);
  });
});
