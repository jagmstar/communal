/**
 * Unit tests for the shared `src/lib/rollover.ts` module (ticket #1 follow-up per QA
 * verdict `qa/ticket-1-verdict.md`, Findings F1 + F2, commit 1aa54d1).
 *
 * F1: ROLLOVER_MAX_RATIO tightened from 0.5 to 0.05 (require a >95% drop) so the
 *     ticket's own headline OCR-misread example (12453 -> 1453, an 88.3% drop) is
 *     rejected, while a genuine dial-wrap rollover (>99% drop) is still accepted.
 * F2: this module is the SINGLE shared source of truth, imported by both
 *     `src/lib/api-utils.ts` (server, re-exported) and `src/app/submit/page.tsx`
 *     (client) — no more duplicated copies to drift apart.
 */
import { describe, it, expect } from "vitest";
import { isPlausibleRollover, ROLLOVER_MAX_RATIO } from "../rollover";
import { isPlausibleRollover as apiUtilsIsPlausibleRollover, ROLLOVER_MAX_RATIO as apiUtilsRatio } from "../api-utils";

describe("ROLLOVER_MAX_RATIO", () => {
  it("is tightened to 0.05 (require a >95% drop), not the old 0.5", () => {
    expect(ROLLOVER_MAX_RATIO).toBe(0.05);
  });
});

describe("isPlausibleRollover", () => {
  it("F1: rejects the ticket's own headline OCR-misread example (12453 -> 1453, an 88.3% drop)", () => {
    // 1453 / 12453 = 0.1167 -> drop = 88.33%. Under the OLD ratio (0.5) this passed
    // (1453 < 12453*0.5 = 6226.5). Under the NEW ratio (0.05) it must fail
    // (1453 is NOT < 12453*0.05 = 622.65).
    expect(isPlausibleRollover(1453, 12453)).toBe(false);
  });

  it("F1: accepts a genuine rollover on a 5-digit meter (99998 -> 5, a >99.99% drop)", () => {
    expect(isPlausibleRollover(5, 99998)).toBe(true);
  });

  it("F1: accepts a genuine rollover shape (99950 -> 12)", () => {
    expect(isPlausibleRollover(12, 99950)).toBe(true);
  });

  it("rejects a typo-shaped drop (200 -> 150, a 25% drop)", () => {
    expect(isPlausibleRollover(150, 200)).toBe(false);
  });

  it("rejects lastReading <= 0 (no meaningful ratio)", () => {
    expect(isPlausibleRollover(5, 0)).toBe(false);
    expect(isPlausibleRollover(5, -10)).toBe(false);
  });

  it("boundary: exactly at the ratio threshold is rejected (strict <)", () => {
    // newValue must be strictly LESS than lastReading * ROLLOVER_MAX_RATIO
    expect(isPlausibleRollover(500, 10000)).toBe(false); // 500 == 10000*0.05, not <
    expect(isPlausibleRollover(499, 10000)).toBe(true); // 499 < 500
  });

  it("F2: the re-exported copy in api-utils.ts is the SAME function/values as the shared module (no drift possible)", () => {
    expect(apiUtilsRatio).toBe(ROLLOVER_MAX_RATIO);
    expect(apiUtilsIsPlausibleRollover).toBe(isPlausibleRollover);
    // Sanity-check across a table of inputs (belt-and-suspenders given they're the
    // same function reference, this also documents the expected behavior table).
    const cases: Array<[number, number, boolean]> = [
      [1453, 12453, false], // ticket's headline OCR-misread example
      [5, 99998, true], // genuine 5-digit rollover
      [12, 99950, true], // genuine rollover
      [150, 200, false], // typo
      [5, 0, false], // no prior reading
    ];
    for (const [newValue, lastReading, expected] of cases) {
      expect(apiUtilsIsPlausibleRollover(newValue, lastReading)).toBe(expected);
      expect(isPlausibleRollover(newValue, lastReading)).toBe(expected);
    }
  });
});
