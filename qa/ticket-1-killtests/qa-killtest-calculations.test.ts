/**
 * Ticket #1 — QA independent kill-test (d): bills math must clamp negative usage delta
 * to 0, not propagate a negative/nonsense usage or cost.
 *
 * Written from scratch (not copied from src/lib/__tests__/calculations.test.ts), imports
 * only the exported public function computeMonthlyUsage (the internal nonNegativeDelta
 * helper is not exported, so this test exercises the guard through its only public
 * entry point, exactly as an external caller/QA would).
 *
 * Run against BOTH commits: on the parent (4a530da) computeMonthlyUsage has no such
 * guard (the ticket's own evidence says "the DB transaction... then overwrites
 * last_reading... computes a negative usage delta"); on the patched commit (30a3628) the
 * guard must be present per AC-6.
 */
import { describe, it, expect } from "vitest";
import { computeMonthlyUsage } from "@/lib/calculations";
import type { Meter, Reading, Tariff } from "@/lib/types";

const meters: Meter[] = [
  {
    id: "meter-1",
    meterNumber: "001",
    serviceType: "water",
    serviceName: "Вода",
    unit: "м³",
    lastReading: 150,
    lastReadingDate: "2026-08-15",
    submitDeadlineDay: 31,
    submitWindowStart: 25,
    color: "#0ea5e9",
    colorLight: "#e0f2fe",
    icon: "droplet",
  },
];

const tariffs: Tariff[] = [
  { id: "t1", serviceType: "water", value: 10, effectiveDate: "2026-01-01" } as Tariff,
];

describe("QA kill-test (d): computeMonthlyUsage clamps a decreasing reading pair", () => {
  it("a decreasing value (200 -> 150, i.e. a value that should have been rejected upstream but is fed in here to test the downstream guard) yields usage 0, not negative", () => {
    const readings: Reading[] = [
      {
        id: "r1",
        meterId: "meter-1",
        value: 200,
        date: "2026-07-31",
        ocrConfidence: 0.97,
        ocrEngine: "manual",
        submittedToEps: true,
        submittedAt: "2026-07-31T10:00:00Z",
      },
      {
        id: "r2",
        meterId: "meter-1",
        value: 150,
        date: "2026-08-15",
        ocrConfidence: 0.95,
        ocrEngine: "manual",
        submittedToEps: true,
        submittedAt: "2026-08-15T10:00:00Z",
      },
    ];

    const result = computeMonthlyUsage("meter-1", readings, meters, tariffs);
    expect(result).toHaveLength(1);
    console.log(`QA-OBSERVED killtest-d usage=${result[0].usage} cost=${result[0].cost}`);
    // Hard requirement: usage/cost must never go negative regardless of which commit
    // this runs against — this is the specific downstream-math assertion for AC-6.
    expect(result[0].usage).toBeGreaterThanOrEqual(0);
    expect(result[0].cost).toBeGreaterThanOrEqual(0);
  });

  it("a genuine rollover-shaped drop (99950 -> 12) also yields non-negative usage (clamped, not negative, per documented AC-6 simplification)", () => {
    const readings: Reading[] = [
      {
        id: "r3",
        meterId: "meter-1",
        value: 99950,
        date: "2026-07-31",
        ocrConfidence: 0.97,
        ocrEngine: "manual",
        submittedToEps: true,
        submittedAt: "2026-07-31T10:00:00Z",
      },
      {
        id: "r4",
        meterId: "meter-1",
        value: 12,
        date: "2026-08-15",
        ocrConfidence: 0.95,
        ocrEngine: "manual",
        submittedToEps: true,
        submittedAt: "2026-08-15T10:00:00Z",
      },
    ];

    const result = computeMonthlyUsage("meter-1", readings, meters, tariffs);
    expect(result).toHaveLength(1);
    console.log(`QA-OBSERVED killtest-d-rollover usage=${result[0].usage} cost=${result[0].cost}`);
    expect(result[0].usage).toBeGreaterThanOrEqual(0);
    expect(result[0].cost).toBeGreaterThanOrEqual(0);
  });
});
