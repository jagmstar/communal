# Ticket #1 — Phase 1 BLIND kill-test plan

Written from `docs/pipeline/ticket-1-intake.md` + `gh issue view 1` **issue body only**
(post-intake comments on issue #1 deliberately NOT read at this stage, per protocol).

- **Patched commit:** `30a3628` — "fix(#1): reject reading values below meter last known reading"
- **Parent (unpatched) commit:** `30a3628~1` = `4a530da` — "qa(#3): add adversarial two-run
  kill-tests and verdict for middleware-to-proxy migration"

## What the bug is (from intake + issue body)

`POST /api/readings` validates `meterId` (UUID), `value` (positive number), `date` (valid
calendar date) but never compares `value` against the meter's current `last_reading`.
`createReading()` in `src/lib/db/queries.ts` runs `UPDATE meters SET last_reading = ...
WHERE last_reading_date IS NULL OR last_reading_date <= date` — guards date order only,
never value order. A lower value on a later/same date silently overwrites `last_reading`,
producing a negative usage delta downstream in `computeMonthlyUsage`/`computeBillPredictions`
(`src/lib/calculations.ts`). The UI (`src/app/submit/page.tsx` ~line 502) shows a cosmetic
warning banner but does not disable the submit button.

## Acceptance criteria under test (from issue #1 body)

1. `POST /api/readings` → 400 when `value < meter.last_reading` for same/later date.
2. New `ERRORS.READING_BELOW_LAST` Ukrainian message in `src/lib/api-utils.ts`.
3. Meter rollover (e.g. `99999`→`00012`) NOT blocked, via an explicit documented override
   mechanism (e.g. `allowRollover` flag) — but the mechanism must not become a blanket
   bypass (see attack #3 below).
4. `submit/page.tsx` submit button actually `disabled` (not just warned) in the
   below-last-reading state unless rollover override acknowledged.
5. `npx vitest run` reports 94+ passed, 0 failed.
6. `src/lib/calculations.ts` non-decreasing assumption gets an explicit guard/test
   (negative-delta clamped or documented).

## Attack list (3 fake-fix patterns to specifically hunt for)

### Attack 1 — "Client-side only" fake fix
Hypothesis: the dev disables the submit button in `submit/page.tsx` (satisfies AC-4
superficially) and/or adds a warning, but the API route (`route.ts`) itself still accepts
`value < last_reading` — i.e., validation exists only in the browser, trivially bypassed by
curl/Postman/a compromised client/replay. This is the single most dangerous fake-fix because
it looks complete in the UI demo but leaves the real invariant unenforced server-side.
**Test:** invoke the POST route handler directly (bypassing the browser entirely, per repo
convention seen in `src/app/api/__tests__/readings.test.ts`) with `value < last_reading` and
assert 400. Must fail (i.e., correctly reject) on **patched**, and — to prove the bug is
real and the test is meaningful — the equivalent invocation must succeed with 201 (bug
present) on **parent**.

### Attack 2 — Validated against the wrong meter
Hypothesis: the new comparison logic fetches/compares against the wrong meter record — e.g.
compares against a stale in-memory value, a default/first meter, or ignores `meterId` and
checks some global "last reading across all meters," or compares against a cached value
that's off-by-one-request stale under concurrent submissions. This would let bad values
through for meter B while validation only actually works for meter A (whichever meter was
used in the dev's own single test).
**Test:** create/mock at least TWO distinct meters with different `last_reading` values.
Submit a legitimately-low value for meter A while meter B's last_reading is different (e.g.
meter A last_reading=100, meter B last_reading=5000); confirm the reject/accept decision
tracks meter A's own last_reading, not meter B's or a hardcoded/global value. Also verify
the correct meter's `last_reading` is what gets checked (not e.g. an initial/creation-time
snapshot from a different reading).

### Attack 3 — Rollover flag as a validation backdoor
Hypothesis: the `allowRollover` (or equivalent) override, required by AC-3 to permit genuine
dial-wraparound, is implemented as an unconditional bypass — i.e., setting the flag skips
ALL validation (including trivial fat-finger typos), not just the specific rollover-shaped
drop. E.g. submitting `200` → `150` (an obvious typo, not a rollover — the drop is small and
implausible as a wraparound of any real meter) with `allowRollover: true` gets accepted when
it should still be rejected, because a genuine rollover has a distinctive shape (huge drop,
landing near a small number close to 0, roughly consistent with the meter's digit-width
maximum) that a plain typo does not have.
**Test:** (a) genuine rollover — e.g. `99950` → `12` — WITH the rollover flag: must be
accepted (201). (b) typo-shaped drop — e.g. `200` → `150` (drop of 50, ~25%, lands at 150,
not near a rollover-plausible ceiling) — WITH the rollover flag still set: must still be
REJECTED (400), proving the flag is not a blanket bypass but is gated by an actual
plausibility check on the shape of the drop.

## Kill-tests to write (`qa/ticket-1-killtests/`)

- (a) API rejection: direct route-handler/test-client invocation, `value < lastReading` →
  400 on patched; confirm (for the record, honestly) that the same call was silently
  accepted (201) on parent.
- (b) Legit submission: `value >= lastReading` → 201 on BOTH commits (fix must not
  overcorrect into a false-positive that blocks normal increasing readings).
- (c) Rollover: genuine rollover accepted WITH flag; typo-shaped drop rejected EVEN WITH
  flag (attack #3).
- (d) Bills math: negative delta clamped to 0 (or otherwise made non-negative/sane) in
  `computeMonthlyUsage` on patched, per AC-6.
- (e) Full `npx vitest run` on both commits — confirm 94 baseline on parent, ≥94 (with new
  tests) and 0 failures on patched.

Two-meter attack (Attack #2) will be folded into the (a)/(b) test file as an additional
independent case, not a separate top-level letter, since it's a variant of the same
API-rejection test surface.
