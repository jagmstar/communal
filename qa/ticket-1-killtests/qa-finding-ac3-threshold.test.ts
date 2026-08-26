/**
 * Ticket #1 — QA Finding evidence: ROLLOVER_MAX_RATIO=0.5 threshold vs the ticket's own
 * headline motivating example.
 *
 * The dev report (docs/pipeline/ticket-1-dev-report.md, AC-3 section) claims:
 *   "an ordinary typo (e.g. 12453 -> 1453 is only a ~9% drop, well above the 50%
 *    threshold, so it is still rejected even with the flag set)."
 *
 * This is the ISSUE'S OWN headline motivating example (see gh issue #1 body: "OCR
 * misreads a digit (e.g. 12453 becomes 1453)"). Independent arithmetic check:
 *   1453 / 12453 = 0.1167  ->  the drop is (1 - 0.1167) = 88.33%, NOT ~9%.
 *   12453 * 0.5 = 6226.5;  1453 < 6226.5  ->  isPlausibleRollover(1453, 12453) = TRUE.
 * The dev report's own arithmetic is backwards (it reports the *ratio* percentage,
 * ~11.7%, mislabeled as "the drop", and separately mislabels the result "well above
 * the 50% threshold" when 1453 is in fact well BELOW 12453*0.5).
 *
 * This test independently re-verifies the actual behavior of the real POST route
 * handler (not just the isolated isPlausibleRollover unit) against the ticket's own
 * canonical OCR-misread scenario, with allowRollover both set and unset.
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

describe("QA FINDING F1: the ticket's own headline OCR-misread example (12453 -> 1453) is NOT correctly rejected once allowRollover is set", () => {
  it("arithmetic sanity check: 1453/12453 is an 88.3% drop, not ~9% as the dev report claims", () => {
    const ratio = 1453 / 12453;
    const dropPercent = (1 - ratio) * 100;
    expect(dropPercent).toBeCloseTo(88.33, 1);
    expect(ratio).toBeLessThan(0.5); // below ROLLOVER_MAX_RATIO threshold -> "plausible rollover" per current code
  });

  it("12453 -> 1453 WITHOUT allowRollover -> correctly 400 (AC-1 baseline works)", async () => {
    (getMeterById as any).mockResolvedValue(meter());
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 1453, date: "2026-08-15" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("12453 -> 1453 WITH allowRollover:true -> the dev report claims this 'is still rejected even with the flag set' (400); independently observed to actually be 201 (accepted) — dev report claim is FALSE for this exact example", async () => {
    (getMeterById as any).mockResolvedValue(meter());
    (createReading as any).mockResolvedValue({ id: "r1", meterId: METER_ID, value: 1453, date: "2026-08-15" });
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: METER_ID, value: 1453, date: "2026-08-15", allowRollover: true },
    });
    const res = await POST(req);
    console.log(`QA-FINDING-F1 status=${res.status} (dev report claims 400/rejected; ticket's own headline OCR-misread example)`);
    // This assertion documents the OBSERVED (not desired) behavior on the patched commit.
    expect(res.status).toBe(201);
  });
});
