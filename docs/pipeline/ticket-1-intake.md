# Ticket 1 — Intake: Reading-below-last-value validation bug

- **GitHub issue:** [jagmstar/communal#1](https://github.com/jagmstar/communal/issues/1)
- **Type:** Bug fix (real, unfixed defect found during INTAKE survey — not a planned improvement)
- **Size estimate:** S (may push to M if rollover handling, AC-3/AC-6, is nontrivial)
- **Intake date:** 2026-08-26
- **Surveyed by:** PM/Intake twin

## Why this ticket (user-value statement)

Someone reading a water/gas/electricity meter can fat-finger a digit, or the built-in OCR
(Tesseract.js) can misread a digit — e.g. `12453` becomes `1453`. Today `POST /api/readings`
accepts this silently: it validates that `value` is a positive number and that `date` is a
real calendar date, but never checks the new value against the meter's last known reading.
The database transaction in `createReading()` (`src/lib/db/queries.ts`) then overwrites
`last_reading` unconditionally. The next bill calculation
(`computeMonthlyUsage`/`computeBillPredictions` in `src/lib/calculations.ts`) computes a
negative usage delta for that month — the person gets a bill that makes no sense, with no way
to know why. This is the same class of defect as the already-fixed Feb-30 date bug
(`isValidDateString`, `src/lib/api-utils.ts`) — "an invalid value silently entered the system
because nobody checked the invariant" — except this one is still live in production.

The UI already half-recognizes the problem: `src/app/submit/page.tsx` (~line 502) shows a
warning banner when the typed value is below `selectedMeter.lastReading`, but the submit
button (`disabled={!ocrValue}`) does not actually block submission — the warning is cosmetic.

## Evidence gathered during survey (file/command-backed)

- `src/app/api/readings/route.ts` — read in full; POST handler validation logic confirmed to
  have zero comparison against `last_reading`.
- `src/lib/db/queries.ts` — read in full; `createReading()` transaction's `UPDATE meters`
  WHERE clause (`last_reading_date IS NULL OR last_reading_date <= date`) only guards date
  order, never value order.
- `src/app/submit/page.tsx` — read in full; confirmed submit button `disabled` prop does not
  reference the lower-than-last-reading condition.
- `src/app/api/__tests__/readings.test.ts` — read in full (14 tests); no test exercises this
  path.
- `src/lib/__tests__/calculations.test.ts` — read in full; no test exercises negative-delta
  usage from a decreasing reading.
- `npx vitest run` — baseline confirmed: **94/94 tests pass** (2026-08-26, 1.75s).

## Acceptance criteria (numbered, verifiable by command)

See full text in GitHub issue #1. Summary:
1. `POST /api/readings` → HTTP 400 when `value < meter.last_reading` for same/later date.
   Verify: new test in `src/app/api/__tests__/readings.test.ts`.
2. New `ERRORS.READING_BELOW_LAST` Ukrainian message added to `src/lib/api-utils.ts`.
   Verify: `grep -r "READING_BELOW_LAST" src/lib/api-utils.ts`.
3. Meter rollover case (dial wraps e.g. 99999→00012) is NOT blocked, via an explicit
   documented override mechanism. Verify: passing rollover test exists.
4. `src/app/submit/page.tsx` submit button is actually `disabled` (not just warned) in the
   below-last-reading state, unless rollover override is acknowledged.
5. `npx vitest run` reports 94+ passed, 0 failed.
6. `src/lib/calculations.ts` functions get an explicit guard/test for the non-decreasing
   assumption.

## Out of scope

- OCR accuracy tuning (Tesseract.js).
- Backfill/cleanup of any already-bad rows in the Neon production database.
- A polished meter-rollover UI wizard (only a passing test + documented mechanism required).

## INTAKE gate self-check

- [x] Not a one-sentence ticket — 6 numbered AC, each independently verifiable.
- [x] Every AC has a concrete verification command or test file path.
- [x] Every state-of-repo claim is backed by a specific file read or command run (listed above).
- [x] User-value statement written for the person submitting a reading, not for the codebase.
