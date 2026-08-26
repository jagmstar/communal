# Ticket 1 — Dev Report: Reading-below-last-value validation

- **GitHub issue:** [jagmstar/communal#1](https://github.com/jagmstar/communal/issues/1)
- **Implemented by:** Dev twin
- **Dev date:** 2026-08-26
- **Baseline:** `npx vitest run src` — 104/104 passed (2026-08-26, pre-change), `npm run build` — clean

> Note on the 104 vs the intake's "94" baseline: the intake doc's 94/94 count was
> taken before ticket #3 (`fix(#3): migrate deprecated middleware.ts to proxy.ts`,
> commit `3b32874`) merged `src/__tests__/proxy.test.ts` (+10 tests). At the moment
> this ticket started, `HEAD` was already `3b32874`, so the true local baseline is
> **104/104**, not 94/94. This is a repo-state fact, not a regression — verified by
> `git stash` (removing all this ticket's changes) → `npx vitest run src` → 104/104.

## Acceptance criteria — status

### AC-1 — `POST /api/readings` → HTTP 400 when `value < meter.last_reading` for same/later date
**ЗРОБИВ.**
- `src/app/api/readings/route.ts`: after existing field/format validation, the route now
  calls `getMeterById(meterId)` and, if the meter has a `lastReading` and the submitted
  `date` is the same as or later than `lastReadingDate`, rejects `value < lastReading`
  with `ERRORS.READING_BELOW_LAST` (400) — unless the rollover override applies (AC-3).
- New query function `getMeterById()` added to `src/lib/db/queries.ts` (the route needs
  the *current* last reading, and no existing query fetched a single meter by ID).
- Tests (in `src/app/api/__tests__/readings.test.ts`):
  - `"returns 400 when value is below the meter's last known reading (AC-1)"`
  - `"returns 400 when value equals a regression on the same date"`
  - `"accepts a value equal to the last reading (no usage, not a regression)"`
  - `"accepts a value increasing above the last reading"`
  - `"skips the regression check when the meter has no prior reading yet"`

### AC-2 — New `ERRORS.READING_BELOW_LAST` Ukrainian message in `src/lib/api-utils.ts`
**ЗРОБИВ.**
- Added to the `ERRORS` const in `src/lib/api-utils.ts`:
  `"Показник менший за попередній. Перевірте значення. Якщо це перекручення лічильника
  (перехід через нуль), позначте це явно."`
- Verified: `grep -r "READING_BELOW_LAST" src/lib/api-utils.ts` → 1 match (the const key
  itself; the file also defines `isPlausibleRollover`/`ROLLOVER_MAX_RATIO` next to it).

### AC-3 — Meter rollover is not blocked, via an explicit documented override
**ЗРОБИВ**, with a documented, scoped mechanism (Dev decision per the ticket's own note
that AC-3 mechanism/threshold is a Dev call):
- `POST /api/readings` accepts an optional boolean `allowRollover` field in the request
  body.
- The override is honored **only if the drop is "plausible" as a real dial rollover**,
  not just any drop: `isPlausibleRollover(newValue, lastReading)` in
  `src/lib/api-utils.ts` requires `newValue < lastReading * ROLLOVER_MAX_RATIO`
  (`ROLLOVER_MAX_RATIO = 0.5`, i.e. the new value must be less than half the last
  reading). This prevents `allowRollover: true` from being used to wave through an
  ordinary typo (e.g. `12453 → 1453` is only a ~9% drop, well above the 50% threshold,
  so it is still rejected even with the flag set).
- **Why a ratio threshold and not exact dial-capacity math:** the `meters` table/schema
  has no per-meter "dial capacity" (max digits before wraparound) column, and adding one
  is a migration — explicitly out of scope per the ticket ("no schema migration required
  for the core fix", rollover "may push this to M" but a full wizard is explicitly
  out-of-scope). A ratio-based plausibility gate is the smallest correct mechanism that
  satisfies the AC's literal requirement ("a rollover test case MUST exist and pass").
- Tests:
  - `"accepts a meter rollover when allowRollover is set and the drop is large (AC-3)"`
    (99950 → 12, `allowRollover: true` → 201)
  - `"rejects a small drop even when allowRollover is set (typo, not a real rollover)"`
    (200 → 150 with `allowRollover: true` → still 400)
  - `"rejects a large drop without the allowRollover flag"` (99950 → 12, no flag → 400)

### AC-4 — `src/app/submit/page.tsx` submit button is actually disabled, not just warned
**ЗРОБИВ** (client-side nicety, as scoped — the real enforcement is AC-1/AC-3 server-side).
- Added local (duplicated, not imported — see limitation below) `ROLLOVER_MAX_RATIO` /
  `isPlausibleRollover` helpers in `submit/page.tsx`.
- New derived state: `isBelowLastReading`, `rolloverPlausible`.
- New state: `rolloverAcknowledged` (checkbox), reset on meter re-select, on any edit to
  the reading value, and on full form reset.
- Submit button `disabled` now includes:
  `!ocrValue || (isBelowLastReading && !(rolloverPlausible && rolloverAcknowledged))`
  — i.e. below-last-reading blocks submission unless the drop is plausible AND the user
  has explicitly checked the rollover-acknowledgment checkbox (new UI element, only
  rendered when `rolloverPlausible` is true).
- `handleConfirm` also re-checks this guard defensively before calling the API (belt and
  suspenders — the UI could theoretically be bypassed by directly calling `postReading`),
  and passes `allowRollover: rolloverAcknowledged` through to the API call.
- `src/lib/api.ts` — `postReading()` signature extended with an optional `allowRollover`
  field.
- **No automated component/E2E test** — the ticket itself pre-authorizes this
  ("see ticket #2/#3 for component/E2E test infra... or a manual QA script if that infra
  is not yet wired at merge time"). Confirmed no `@testing-library/*` or `jsdom`/
  `happy-dom` dependency exists in `package.json` / `node_modules` at merge time, and no
  `.test.tsx` file exists anywhere in the repo — component test infra is not wired.
  **Manual QA script** (for the QA twin or a human):
  1. Seed/select a meter with a known `lastReading` (e.g. 200).
  2. Go to `/submit`, select that meter, use manual entry, type `150`.
  3. Expect: red warning banner shown, **no rollover checkbox**, submit button disabled
     (grey, not clickable).
  4. Change value to `95` (< 50% of 200 → plausible rollover).
  5. Expect: warning banner **and** a rollover-acknowledgment checkbox appear; submit
     button still disabled until the checkbox is checked.
  6. Check the checkbox → submit button becomes enabled → submit succeeds
     (`allowRollover: true` sent to the API).
  7. Reload/reset and type `95` again without checking the box → submit stays disabled.

### AC-5 — `npx vitest run` reports 94+ passed, 0 failed
**ЗРОБИВ** (numbers below; see baseline note above for the 94→104 repo-state discrepancy).
- True local baseline at ticket start (`git stash`, `npx vitest run src`): **104 passed,
  0 failed** (7 files).
- After this ticket's changes (`npx vitest run src`): **115 passed, 0 failed** (7 files)
  — net **+11 new tests** (8 in `readings.test.ts` for AC-1/AC-3, 3 in
  `calculations.test.ts` for AC-6).
- `npx vitest run` (no path filter, whole repo) also picks up an **unrelated,
  pre-existing, untracked** file at `qa/ticket-3-killtests/qa-killtest-behavior.test.ts`
  that fails to even parse (`ReferenceError: __QA_IMPORT_LINE__ is not defined`) — this is
  a template file from ticket #3's QA kill-test tooling (per its own header comment, it's
  meant to have placeholder tokens substituted per-worktree by
  `qa/ticket-3-killtests/run-killtests.ps1`, and is not meant to run standalone).
  **Verified this predates this ticket and is untouched by it**: `git stash` (removing
  every change from this ticket) still shows the same failure, and the file is untracked
  (`git status` shows it under `?? qa/`, never `git add`ed by this ticket or any prior
  commit). Not fixed here — out of scope (belongs to ticket #3's QA artifacts, not
  ticket #1's `src/` code). `npx vitest run src` (scoping to the actual `src/`
  application code, matching this ticket's own test-file convention) is unaffected by it
  and is 0 failed.

### AC-6 — `computeMonthlyUsage`/`computeBillChangeFactors`/`computeBillPredictions` guard the non-decreasing assumption
**ЗРОБИВ**, with an explicit documented choice (clamp, not reject/pass-through):
- Added `nonNegativeDelta(currValue, prevValue)` helper to `src/lib/calculations.ts`,
  documented with a comment explaining the decision:
  - After AC-1 ships, ordinary regressive readings can no longer reach the DB, so
    `curr.value >= prev.value` holds for the common case.
  - The one case that can still legitimately produce a negative delta is an
    **acknowledged rollover** (`allowRollover: true`) — which the schema has no
    "dial capacity" field to compute true wrapped usage for (see AC-3 rationale).
  - Rather than surface a negative (nonsensical) usage/cost — the exact symptom the
    ticket reports — the delta is **clamped to 0** for that interval. This under-counts
    usage for the rollover month instead of showing a negative or wildly wrong bill.
    A follow-up ticket to store dial capacity and compute true rollover usage
    (`(capacity - prev.value) + curr.value`) is explicitly out of scope here, per the
    ticket's own "Out of scope" list (no "polished meter-rollover UI/UX" work required).
  - This is a documented simplification, not silently "the behavior is fine as-is" —
    flagged in the docstring so a future ticket has the exact pointer to fix it properly.
- Applied `nonNegativeDelta()` at the three call sites named in the AC:
  `computeMonthlyUsage`, `computeBillChangeFactors` (both `lastUsage` and `prevUsage`),
  `computeBillPredictions`.
- Tests (in `src/lib/__tests__/calculations.test.ts`):
  - `"clamps a negative delta (rollover/regressive value) to zero usage"` (computeMonthlyUsage)
  - `"clamps a negative delta to zero predicted usage/amount"` (computeBillPredictions)
  - `"clamps a negative delta to zero usage instead of a negative bill"` (computeBillChangeFactors)

## Files modified

| File | Change |
|---|---|
| `src/lib/api-utils.ts` | New `ERRORS.READING_BELOW_LAST`; new `ROLLOVER_MAX_RATIO` const + `isPlausibleRollover()` helper |
| `src/lib/db/queries.ts` | New `getMeterById(meterId)` query function |
| `src/app/api/readings/route.ts` | POST handler: fetch meter, reject regressive value unless plausible-rollover override given |
| `src/app/api/__tests__/readings.test.ts` | Mock `getMeterById`; 8 new tests for AC-1/AC-3 |
| `src/lib/calculations.ts` | New `nonNegativeDelta()` guard, applied in 3 functions per AC-6 |
| `src/lib/__tests__/calculations.test.ts` | 3 new tests for AC-6 |
| `src/app/submit/page.tsx` | Local rollover-plausibility check, `rolloverAcknowledged` state, submit button actually disabled, checkbox UI for rollover ack, `handleConfirm` guard + `allowRollover` passthrough |
| `src/lib/api.ts` | `postReading()` accepts optional `allowRollover` field |

## Test numbers

| | Before | After |
|---|---|---|
| `npx vitest run src` (7 files) | 104 passed, 0 failed | **115 passed, 0 failed** |
| New tests added | — | +11 (8 readings.test.ts, 3 calculations.test.ts) |
| `npm run build` (with pre-existing unrelated `qa/` scaffold present) | fails (pre-existing, unrelated TS error in untracked `qa/ticket-3-killtests/qa-killtest-behavior.test.ts`) | same pre-existing failure, unchanged by this ticket |
| `npm run build` (scaffold temporarily removed to isolate) | clean | **clean** (verified identical clean result before and after this ticket's changes) |

## Limitations / scope decisions

1. **Rollover threshold (`ROLLOVER_MAX_RATIO = 0.5`) is a judgment call**, not derived
   from any real meter's dial capacity (the schema doesn't store one). Documented inline
   in `api-utils.ts`. A meter that drops by, say, exactly 51% due to a genuine typo would
   still be rejected (correct — that's not plausible as a 5-digit rollover), but a meter
   that drops by 49% due to a rollover on a very-low-capacity dial would need a different
   mechanism. Out of scope per the ticket ("polished meter-rollover UI wizard" excluded).
2. **`isPlausibleRollover` is duplicated** in `src/app/submit/page.tsx` instead of
   imported from `src/lib/api-utils.ts`, because `api-utils.ts` imports `next/server`
   (`NextResponse`), which cannot be bundled into a `"use client"` component. Both copies
   are small (4 lines) and commented to point at each other; a shared client-safe utils
   module would be a reasonable follow-up refactor but is not required by any AC.
3. **No component/E2E test for AC-4** — pre-authorized by the ticket itself; a manual QA
   script is provided above. Confirmed no test infra (`@testing-library`, `jsdom`) exists
   in the repo at merge time.
4. **AC-1/AC-3 comparison is date-aware but not "the strictly latest reading"-aware**:
   the check compares against `meter.lastReading`/`meter.lastReadingDate` (the meter's
   current denormalized cache, updated transactionally on every `createReading()` call),
   not against a full history scan. This matches the existing `createReading()` design
   (`src/lib/db/queries.ts`, `UPDATE meters ... WHERE last_reading_date IS NULL OR
   last_reading_date <= date`) — it was already the source of truth for "last reading"
   before this ticket, so the new check is consistent with existing invariants rather
   than introducing a new data model.
5. **Backfilled/earlier-dated readings** (`date < meter.lastReadingDate`) are NOT
   compared against `lastReading` by this check — that's a different scenario (submitting
   a reading for a past month after a later one already exists) which the ticket's AC-1
   text scopes to "same or later date" only. Explicitly out of scope, consistent with the
   ticket text.
6. **OCR accuracy tuning, production data backfill, and a polished rollover UI wizard**
   remain out of scope, per the ticket's own "Out of scope" section — untouched.

## Commit / push

- Commit message references `#1`.
- Pushed to `origin/master`.
- Commit hash: see final report message (recorded after `git commit`).
