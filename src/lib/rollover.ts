/**
 * Shared meter-rollover plausibility predicate (ticket #1, AC-3; QA findings F1 + F2 on
 * `qa/ticket-1-verdict.md`, commit `1aa54d1`).
 *
 * This module is intentionally dependency-free (no `next/server`, no React) so it can be
 * imported UNMODIFIED by both:
 *   - the server-side enforcement point (`src/lib/api-utils.ts`, re-exported for the
 *     `/api/readings` route handler — this is the actual, authoritative boundary), and
 *   - the client-side UI gate (`src/app/submit/page.tsx`, a `"use client"` component that
 *     cannot safely bundle `next/server`).
 * Previously each side carried its own byte-for-byte copy of this logic. QA flagged that
 * as an R294-class drift risk (F2): nothing forced the two copies to stay in sync, so a
 * future fix to one could silently fail to reach the other. Extracting to a single shared
 * module removes the duplication entirely instead of just commenting the copies at each
 * other.
 *
 * --- Why the ratio is 0.05 (require a >95% drop), not the old 0.5 (>50% drop) ---
 *
 * A mechanical/digital meter rollover happens when the counter reaches the top of its
 * digit capacity and wraps back around near zero (e.g. a 5-digit dial: 99999 -> 00012).
 * The residual value left after a wraparound is essentially unrelated in magnitude to the
 * prior reading, so a GENUINE rollover produces a drop of ~99.9%+ — the new value is a
 * tiny remainder, not a large fraction of the old one.
 *
 * The failure mode this predicate must NOT wave through is an ordinary fat-finger or OCR
 * digit-loss error. The ticket's own headline motivating example is the worst realistic
 * case of that: `12453 -> 1453` (OCR drops/misreads the LEADING digit) is an 88.3% drop
 * (1 - 1453/12453 = 0.8833). The old `ROLLOVER_MAX_RATIO = 0.5` ("accept any drop bigger
 * than 50%") happily classifies an 88.3% drop as "plausible rollover", which is exactly
 * the gap QA's kill-tests demonstrated end-to-end through the real, unmocked route handler
 * (`qa/ticket-1-killtests/qa-finding-ac3-threshold.test.ts`, Finding F1).
 *
 * `0.05` (the new value must be LESS than 5% of the last reading, i.e. a drop of MORE
 * than 95%) sits well below every drop this class of typo/OCR bug realistically produces
 * — losing one leading digit off an N-digit reading tops out well under 95% for any
 * plausible meter value (e.g. even a 6-digit reading losing its leading '9' is at most
 * ~90%: 900000 -> ~90000) — while staying comfortably under the ~99.9%+ drop a genuine
 * dial wraparound produces, since the post-wrap residual is unrelated in magnitude to the
 * prior value. This remains a ratio-only heuristic (the schema has no per-meter digit
 * capacity to check against exactly — see the original AC-3 note), but the much wider
 * safety margin (0.05 vs. 0.5) closes the specific gap QA found without requiring a schema
 * change. If a future ticket adds a stored digit-capacity per meter, this predicate is the
 * single place to upgrade to an exact `newValue < lastReading - capacity` style check.
 */
export const ROLLOVER_MAX_RATIO = 0.05;

/**
 * Determine whether a new reading value below the meter's last known reading looks like a
 * plausible meter rollover (dial wrap-around) rather than an ordinary typo/OCR misread.
 * @param newValue - The newly submitted reading value
 * @param lastReading - The meter's current last known reading
 * @returns true only if the drop is large enough (>95%) to plausibly be a genuine rollover
 */
export function isPlausibleRollover(newValue: number, lastReading: number): boolean {
  if (lastReading <= 0) return false;
  return newValue < lastReading * ROLLOVER_MAX_RATIO;
}
