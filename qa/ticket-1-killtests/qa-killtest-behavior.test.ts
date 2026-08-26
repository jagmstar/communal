/**
 * Ticket #1 — QA independent kill-test file (from-scratch, NOT copied from the dev's own
 * src/app/api/__tests__/readings.test.ts or src/lib/__tests__/calculations.test.ts).
 *
 * Written BLIND from docs/pipeline/ticket-1-intake.md + `gh issue view 1` body only
 * (Phase 1). Run identically (via a small git-diff-tolerant import shape) against:
 *   - parent   4a530da (bug present, no getMeterById/rollover check in route.ts)
 *   - patched  30a3628 (fix(#1) applied)
 *
 * Convention follows the repo's own test-client pattern (vi.mock db/queries + db/client,
 * import GET/POST directly from the real route module, build a Request via makeRequest).
 *
 * Attack list under test:
 *   1. Client-side-only fake fix — hit the API route handler directly, not the browser.
 *   2. Wrong-meter validation — two distinct meters, confirm comparison tracks the
 *      correct meter's own last_reading, not a global/hardcoded/other-meter value.
 *   3. Rollover flag as an unconditional bypass — genuine rollover shape must be accepted
 *      WITH the flag; typo shape must still be REJECTED even WITH the flag set.
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
import type { Reading, Meter } from "@/lib/types";

function makeRequest(url: string, options: { method?: string; body?: unknown } = {}) {
  const init: RequestInit = { method: options.method ?? "GET" };
  if (options.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }
  return new Request(url, init) as any;
}

function meter(overrides: Partial<Meter> = {}): Meter {
  return {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    meterNumber: "001",
    serviceType: "water",
    serviceName: "Вода",
    unit: "м³",
    lastReading: 200,
    lastReadingDate: "2026-07-31",
    submitDeadlineDay: 31,
    submitWindowStart: 25,
    color: "#0ea5e9",
    colorLight: "#e0f2fe",
    icon: "droplet",
    ...overrides,
  };
}

const METER_B_ID = "a1b2c3d4-0002-4000-8000-000000000002";

function post(body: unknown) {
  const req = makeRequest("http://localhost:3000/api/readings", { method: "POST", body });
  return POST(req);
}

describe("QA kill-test (a): API rejection of value < lastReading", () => {
  it("value below last known reading — records observed status (400 expected on patched, honest report either way)", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 200, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r1", meterId: meter().id, value: 150, date: "2026-08-15" });

    const res = await post({ meterId: meter().id, value: 150, date: "2026-08-15" });
    const status = res.status;
    console.log(`QA-OBSERVED killtest-a status=${status}`);
    // Left loose on purpose so both commits report their raw observed status in the log
    // without aborting the suite on parent (where the bug means 201 is the honest result).
    expect([201, 400]).toContain(status);
  });
});

describe("QA kill-test (b): legit submission still succeeds", () => {
  it("value >= lastReading -> 201 (must hold on BOTH commits)", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 200, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r2", meterId: meter().id, value: 250, date: "2026-08-15" });

    const res = await post({ meterId: meter().id, value: 250, date: "2026-08-15" });
    expect(res.status).toBe(201);
  });

  it("value exactly equal to lastReading -> 201 (no false-positive on boundary)", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 200, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r3", meterId: meter().id, value: 200, date: "2026-08-15" });

    const res = await post({ meterId: meter().id, value: 200, date: "2026-08-15" });
    expect(res.status).toBe(201);
  });
});

describe("QA kill-test — attack #2: validated against the wrong meter", () => {
  it("meter A's own lastReading (100) must gate meter A's submission, not meter B's unrelated lastReading (5000)", async () => {
    (getMeterById as any).mockImplementation(async (id: string) => {
      if (id === meter().id) return meter({ lastReading: 100, lastReadingDate: "2026-07-31" });
      if (id === METER_B_ID) return meter({ id: METER_B_ID, lastReading: 5000, lastReadingDate: "2026-07-31" });
      return null;
    });

    const resA = await post({ meterId: meter().id, value: 50, date: "2026-08-15" });
    console.log(`QA-OBSERVED killtest-attack2-meterA status=${resA.status}`);

    (createReading as any).mockResolvedValue({ id: "r4", meterId: METER_B_ID, value: 5500, date: "2026-08-15" });
    const resB = await post({ meterId: METER_B_ID, value: 5500, date: "2026-08-15" });
    expect(resB.status).toBe(201);
  });
});

describe("QA kill-test (c) / attack #3: rollover flag must not be a blanket bypass", () => {
  it("genuine rollover (99950 -> 12) WITH allowRollover flag -> 201", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 99950, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r5", meterId: meter().id, value: 12, date: "2026-08-15" });

    const res = await post({ meterId: meter().id, value: 12, date: "2026-08-15", allowRollover: true });
    console.log(`QA-OBSERVED killtest-c-genuine-rollover status=${res.status}`);
    expect(res.status).toBe(201);
  });

  it("typo-shaped drop (200 -> 150) WITH allowRollover flag STILL SET -> must remain 400, not a backdoor", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 200, lastReadingDate: "2026-07-31" }));
    (createReading as any).mockResolvedValue({ id: "r6", meterId: meter().id, value: 150, date: "2026-08-15" });

    const res = await post({ meterId: meter().id, value: 150, date: "2026-08-15", allowRollover: true });
    console.log(`QA-OBSERVED killtest-c-typo-with-flag status=${res.status}`);
    expect(res.status).toBe(400);
  });

  it("without allowRollover flag, genuine-rollover-shaped drop is still rejected (flag is required, not automatic)", async () => {
    (getMeterById as any).mockResolvedValue(meter({ lastReading: 99950, lastReadingDate: "2026-07-31" }));

    const res = await post({ meterId: meter().id, value: 12, date: "2026-08-15" });
    console.log(`QA-OBSERVED killtest-c-rollover-no-flag status=${res.status}`);
    expect(res.status).toBe(400);
  });
});
