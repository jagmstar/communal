# Ticket #1 — QA Verdict (Adversarial Two-Run)

**QA role:** Independent QA twin (same mechanism as `qa/ticket-3-verdict.md` — Phase 1
BLIND kill-tests → Phase 2 Two-Run on both commits → Phase 3 dev-report cross-check).

- **Patched commit:** `30a3628` — "fix(#1): reject reading values below meter last known reading"
- **Parent (unpatched) commit:** `30a3628~1` = `4a530da` — "qa(#3): add adversarial two-run
  kill-tests and verdict for middleware-to-proxy migration"
- **Environment:** Windows PowerShell, `PYTHONIOENCODING=utf-8`, Node v24.18.0, npm 11.16.0,
  Vitest v4.1.11.
- **Method:** Kill-tests written BLIND from `docs/pipeline/ticket-1-intake.md` +
  `gh issue view 1` **issue body only** — the single dev-completion comment on issue #1
  was deliberately not read until Phase 3. Two isolated `git worktree`s were built
  (`F:\communal-qa-parent` @ `4a530da`, `F:\communal-qa-patched` @ `30a3628`), each with a
  fresh `npm install` (following the #3 QA precedent, since junction-linked `node_modules`
  broke Turbopack/build tooling there). Source of truth: `qa/ticket-1-killtests/PHASE1-NOTES.md`
  (blind attack plan) + `qa/ticket-1-killtests/qa-killtest-behavior.test.ts` +
  `qa/ticket-1-killtests/qa-killtest-calculations.test.ts` + `qa/ticket-1-killtests/qa-finding-ac3-threshold.test.ts`
  (all from-scratch, never copied from the dev's own `readings.test.ts`/`calculations.test.ts`)
  + `qa/ticket-1-killtests/results/*.log` (raw captured output).

## Attack list (from blind Phase-1 plan) — 2 of 3 defused, 1 CONFIRMED AS A REAL GAP (see F1)

1. **Client-side-only fake fix** (validation only in `submit/page.tsx`, API still accepts
   below-last values). **Defused**: direct route-handler invocation (bypassing any browser)
   confirms the server-side check is real — `value < lastReading` → 400 on patched via
   `POST` handler called directly, not through the UI.
2. **Validated against the wrong meter** (comparison ignores `meterId`, uses a global/stale/
   other-meter value). **Defused**: two-meter test — meter A (`lastReading=100`) correctly
   gates its own submission (50 → 400) independent of meter B (`lastReading=5000`, a legit
   5500 submission → 201). The comparison correctly tracks each meter's own record.
3. **Rollover flag as an unconditional bypass** (any value passes once `allowRollover: true`
   is set). **Partially defused, but with a real gap found (see Finding F1 below)**: a
   simple `200 → 150` typo is correctly still rejected (400) even with the flag set — so the
   flag is *not* a blanket bypass in the trivial case. However, independently re-testing the
   **ticket's own headline motivating example** (`12453 → 1453`, an OCR-dropped leading
   digit) through the real route handler with `allowRollover: true` set produces **201
   (accepted)**, not 400 as both the dev report and the issue-comment claim. The `50%` ratio
   gate is real and does discriminate *some* typos from *some* rollovers, but it is not as
   narrow as the dev report describes — see F1.

## (a) API rejection — direct route-handler invocation

| Check | Parent `4a530da` | Patched `30a3628` |
|---|---|---|
| `POST /api/readings`, `value=150 < lastReading=200`, no flag | **201** (bug present — silently accepted, honestly reproduced) | **400** |
| `value=250 >= lastReading=200` (legit increase) | 201 | 201 |
| `value=200 == lastReading=200` (boundary, no false-positive) | 201 | 201 |

## (b) Legit submission still succeeds on BOTH commits

| Check | Parent | Patched |
|---|---|---|
| Increasing value (250 ≥ 200) → 201 | ✅ | ✅ |
| Equal value (200 == 200) → 201 | ✅ | ✅ |

## Attack #2 — two-meter cross-check

| Check | Parent | Patched |
|---|---|---|
| Meter A (`lastReading=100`), submit 50 (regression) | 201 (bug present) | 400 |
| Meter B (`lastReading=5000`, unrelated), submit 5500 (legit) | 201 | 201 — correctly unaffected by meter A's state |

## (c) Rollover — genuine vs typo, WITH the flag set

| Check | Parent | Patched |
|---|---|---|
| Genuine rollover 99950→12, `allowRollover:true` | 201 | **201** ✅ |
| Genuine-rollover-shaped drop 99950→12, **no** flag | 201 (bug present — no guard at all) | **400** ✅ (flag required, not automatic) |
| Typo-shaped drop 200→150, `allowRollover:true` | 201 (bug present) | **400** ✅ (flag is not a blanket bypass for *this* shape) |
| **Ticket's own headline example** 12453→1453, `allowRollover:true` | 201 (bug present) | **201 — ACCEPTED, not rejected** ⚠️ see F1 |

## (d) Bills math — negative delta clamping

| Check | Parent `4a530da` | Patched `30a3628` |
|---|---|---|
| Decreasing pair 200→150, `computeMonthlyUsage` | usage=**-50**, cost=**-500** (bug present, confirmed) | usage=**0**, cost=**0** ✅ |
| Rollover-shaped pair 99950→12, `computeMonthlyUsage` | usage=**-99938**, cost=**-999380** (bug present, confirmed) | usage=**0**, cost=**0** ✅ |

## (e) Full vitest suite, both commits

| Scope | Parent `4a530da` | Patched `30a3628` |
|---|---|---|
| `npx vitest run src` (dev's own scoping, matches dev-report claim) | 104 passed, 0 failed (7 files) | **115 passed, 0 failed** (7 files) — matches dev report's 104→115 (+11) claim exactly |
| `npx vitest run` (whole repo, excluding the known pre-existing broken `qa/ticket-3-killtests/qa-killtest-behavior.test.ts` template artifact — confirmed via `git log` to predate this ticket, committed in `4a530da` itself, untouched by 30a3628) | 109 passed / 4 failed (my own kill-tests correctly show the bug present) | 124 passed, 0 failed (115 dev + 9 my kill-tests) |
| My own kill-tests only (`qa/ticket-1-killtests/`) | 5 passed / 4 failed (honestly reproduces the bug — see (a)/(c)/(d) above) | **9 passed, 0 failed** |

Note on the pre-existing `qa/ticket-3-killtests/qa-killtest-behavior.test.ts` template
file: independently confirmed via `git show 4a530da:...` that this file (with unsubstituted
`__QA_IMPORT_LINE__` placeholder tokens) was committed as part of ticket #3's QA artifacts
and fails to parse standalone on **both** commits identically — a QA-tooling leftover from
the previous ticket, not something introduced or left broken by this ticket's dev. The dev
report's own AC-5 section pre-emptively flags and correctly explains this exact issue.

## Phase 3 — Dev-report claims vs. independent verification

| Dev claim | QA verification | Match? |
|---|---|---|
| AC-1: 400 on `value < lastReading` for same/later date | Independently confirmed via direct route-handler call | ✅ |
| AC-2: `ERRORS.READING_BELOW_LAST` exists with Ukrainian message | Independently read `src/lib/api-utils.ts` — key present with the exact quoted message | ✅ |
| AC-3: genuine rollover (99950→12) accepted with flag; typo (200→150) rejected even with flag | Independently re-tested both — **both hold true** | ✅ |
| AC-3 worked example: "`12453 → 1453` is only a ~9% drop... still rejected even with the flag set" | **FALSE.** Independently computed: 1453/12453 = 0.1167, i.e. the *ratio* is ~11.7% — the **drop** is (1 − 0.1167) = **88.3%**, not ~9%. The dev report inverted/mislabeled the arithmetic. Re-running the real route handler on this exact example with `allowRollover:true` set returns **201 (accepted)**, not 400 as claimed. See **Finding F1** below — this is a real behavioral gap, not just a report-wording error, because 88.3% < 50% actually makes it satisfy `isPlausibleRollover`. | ❌ **CONTRADICTED** |
| AC-4: submit button actually disabled, not just warned | Read `submit/page.tsx` diff — `disabled={!ocrValue \|\| (isBelowLastReading && !(rolloverPlausible && rolloverAcknowledged))}` confirmed present, replacing the old cosmetic-only `disabled={!ocrValue}`. No automated component test exists (repo has no `@testing-library`/`jsdom`, confirmed via `package.json`) — pre-authorized by the ticket itself; dev's manual QA script not independently executed (would require a running dev server + browser, out of scope for this Vitest-based two-run) | ✅ (static/code-level), not independently re-run live |
| AC-5: "104 → 115 passed, 0 failed" (`npx vitest run src`) | Independently reran on both worktrees: parent 104/104, patched 115/115. Exact match. | ✅ |
| AC-5: pre-existing unrelated `qa/ticket-3-killtests` template failure, untouched by this ticket | Independently confirmed via `git show 4a530da:...` — file committed in the *parent* commit itself, unchanged in `30a3628` | ✅ |
| AC-6: negative delta clamped to 0, not surfaced as negative usage/cost | Independently re-tested `computeMonthlyUsage` with a decreasing pair AND a rollover-shaped pair on patched — both clamp to usage=0/cost=0. Parent (no guard) independently confirmed to actually go negative (-50/-500 and -99938/-999380) — the bug is real, not hypothetical. | ✅ |
| "`isPlausibleRollover` is duplicated... small (4 lines) and commented to point at each other" | Independently diffed both copies (`src/lib/api-utils.ts` vs `src/app/submit/page.tsx`) — byte-for-byte identical function bodies and identical `ROLLOVER_MAX_RATIO = 0.5` constant, confirmed by direct read of both files. Duplication is real and exactly as described. | ✅ (see **Finding F2** for the risk this creates going forward) |
| Diff scope: 9 files changed (`route.ts`, `queries.ts`, `api-utils.ts`, `calculations.ts`, `submit/page.tsx`, `api.ts`, 2 test files, dev report) | `git diff --stat 4a530da 30a3628` confirms exactly these 9 files, no unrelated files touched | ✅ |

## Findings

### F1 — Severity: **HIGH (behavioral defect, not just a report-wording error)** — `ROLLOVER_MAX_RATIO=0.5` waves through the ticket's own canonical OCR-misread example once `allowRollover` is set

**Is 50% a sane threshold for water/gas/electric meters in general?** For the *actual*
rollover use case it's targeting (a mechanical dial wrapping from near its max digit-count
back near 0, e.g. `99999 → 00012`), yes — that's a ~99.99% drop, nowhere close to the 50%
boundary, so genuine rollovers are correctly always accepted.

**The absurd case it lets through:** the threshold is a *pure ratio of magnitudes*, with no
sense of "is this shape actually consistent with a wraparound" beyond "more than half was
lost." This means **any submission that loses more than half its digits/magnitude** —
which includes ordinary OCR/fat-finger failure modes that have nothing to do with a
mechanical rollover — passes the plausibility gate:
- The ticket's **own headline motivating example**, `12453 → 1453` (OCR drops a leading
  digit), is an 88.3% drop — comfortably under the 50% ratio, so `isPlausibleRollover`
  returns `true`. Independently verified end-to-end: `POST` with `value:1453,
  allowRollover:true` against a meter with `lastReading:12453` returns **201**, not the 400
  both the dev report and the issue-comment claim.
- Confirmed the dev report's own written justification (in `docs/pipeline/ticket-1-dev-report.md`,
  AC-3 section) is internally inconsistent: it states "`12453 → 1453` is only a ~9% drop,
  well above the 50% threshold" — but 1453/12453 ≈ 11.7% is the *ratio*, not the drop; the
  actual drop is 88.3%, which is *below* the 50% ratio threshold, i.e. exactly the opposite
  of what's claimed. The dev's own math for the example that's supposed to demonstrate the
  fix works is backwards.
- Practical impact: the `allowRollover` flag is client-controlled (`submit/page.tsx` only
  shows the checkbox and sets the flag when its own **duplicated** `isPlausibleRollover`
  copy also says a drop is plausible — see F2 for why that duplication matters here too),
  but the **API is the actual enforcement boundary** per the dev's own AC-4 comment ("the
  API's own check (AC-1/AC-3) is the actual enforcement point"). Since the server-side gate
  accepts an 88%-magnitude OCR misread once the flag is set, a user (or a replay/curl call,
  or a client bug in the duplicated frontend copy — see F2) can push the exact class of bad
  data (a misread leading digit) into the system that this entire ticket exists to prevent,
  provided the checkbox/flag gets set. This does not fully defeat AC-1 (a below-last value
  *without* the flag is still correctly rejected), but it meaningfully narrows the
  protection AC-3 was supposed to carve out only for genuine dial wraparounds.
- **Not a fabricated edge case** — this is the exact numeric example the issue itself gives
  as the motivating scenario for the entire ticket ("OCR misreads a digit (e.g. `12453`
  becomes `1453`)"), independently re-run through the real, unmocked route handler logic.

**Recommendation:** either (a) tighten `ROLLOVER_MAX_RATIO` well below 0.5 (e.g. ~0.05–0.1,
matching "the new value is a tiny fraction of the old one, consistent with wrapping near
zero") rather than "less than half," or (b) add a floor condition requiring the new value
to land near zero / near a plausible small residual (e.g. `newValue < someAbsoluteFloor` in
addition to the ratio), since a genuine rollover's defining shape is "lands close to 0,"
not merely "lost more than half its magnitude." This is a judgment call worth revisiting
before the mechanism is trusted in production, but does not, by itself, reopen the core
AC-1 regression (values below `lastReading` **without** the flag are still correctly and
unconditionally rejected on the patched commit).

### F2 — Severity: **MEDIUM (drift risk, R294 class)** — `isPlausibleRollover`/`ROLLOVER_MAX_RATIO` duplicated verbatim in two files with no shared import and no test coupling them

`src/lib/api-utils.ts` (server, exported) and `src/app/submit/page.tsx` (client, local/
unexported) each define **byte-for-byte identical** copies of:
```
const ROLLOVER_MAX_RATIO = 0.5;
function isPlausibleRollover(newValue, lastReading) {
  if (lastReading <= 0) return false;
  return newValue < lastReading * ROLLOVER_MAX_RATIO;
}
```
The dev report documents this as a deliberate, reasoned tradeoff (`api-utils.ts` imports
`next/server`, unsafe to bundle into a `"use client"` component) and each copy carries a
comment pointing at the other — this is a real constraint, not carelessness, and the
report is upfront about it as a "Limitation," which is the correct way to disclose it.

However, this is precisely the **R294 class of risk** ("two copies of one predicate WILL
diverge"): nothing in the codebase — no shared constant module, no lint rule, no test —
enforces that the two copies stay in sync. Independently searched the repo
(`Select-String -Pattern isPlausibleRollover` across all `*.test.ts`/`*.test.tsx`) and
confirmed **zero tests exist that assert the two copies agree** on any input, including
the two boundary/edge cases exercised in this verdict (the 50%-boundary case and the
88%-drop OCR example in F1). If a future change to `ROLLOVER_MAX_RATIO` (or the shape of
`isPlausibleRollover`, e.g. adding the F1 floor-condition fix) is made in only one file —
which is trivially easy to do by accident since they are textually identical and not
co-located — the client-side checkbox-gating logic and the server-side actual enforcement
would silently disagree: e.g. the UI could show/hide the rollover-acknowledgment checkbox
based on a stale threshold while the API enforces a different (newer) one, producing either
a confusing "checkbox never appears but the API would have accepted it anyway" UX dead-end,
or worse, a UI that offers the checkbox and lets the user submit while the (unmodified)
server-side copy silently accepts a shape the developer intended to have tightened.

**Recommendation:** extract `ROLLOVER_MAX_RATIO`/`isPlausibleRollover` into a small,
dependency-free shared module (e.g. `src/lib/rollover.ts`, importing nothing from
`next/server`) that both `api-utils.ts` and `submit/page.tsx` import, eliminating the
duplication entirely rather than just commenting the two copies at each other. At minimum,
add a single shared-fixture test asserting both copies produce identical output across a
table of inputs, so any future divergence fails CI immediately instead of silently. Not a
blocking defect today (both copies are currently identical, verified byte-for-byte), but a
structural landmine per the R294 pattern.

### F3 — Severity: None (verified, not a defect) — the single existing dev-completion comment on issue #1 was correctly skipped during Phase 1 and does not contradict anything found afterward
Per protocol, the one dev-completion comment on issue #1 was not read until Phase 3. It
restates the same AC-3 example/claim found (and independently disproven) in the dev report
itself — no new information that would have changed the blind attack list.

### F4 — Severity: None (verified, not a defect) — pre-existing `qa/ticket-3-killtests` template artifact correctly identified and pre-disclosed by the dev
The dev report proactively flags and correctly diagnoses the unrelated, pre-existing
`qa/ticket-3-killtests/qa-killtest-behavior.test.ts` parse failure (unsubstituted template
placeholders from ticket #3's QA tooling) when running whole-repo `vitest run` without a
path filter. Independently confirmed via `git show 4a530da:...` that this file was already
committed and already broken in the parent commit, untouched by `30a3628`. Correctly out of
scope for this ticket; not counted against AC-5.

## Final Verdict: **REJECT**

Rationale:
- **AC-1 (the ticket's primary, named acceptance criterion) is solid** — independently
  verified server-side enforcement, correct meter-scoping (attack #2 defused), correct
  boundary behavior, and correct downstream bill-math clamping (AC-6). This is real,
  working, well-tested code, not a fake fix on any of the three originally-suspected attack
  patterns (client-only validation, wrong-meter comparison, unconditional-bypass flag).
- **However, Finding F1 is a genuine behavioral gap, not a documentation nitpick**: the
  rollover-override mechanism required by AC-3 — specifically built to distinguish "genuine
  dial wraparound" from "ordinary typo/OCR misread" — independently and reproducibly fails
  to reject the **exact motivating example from the issue itself** (`12453 → 1453`) once
  `allowRollover` is set, contradicting both the dev report's explicit claim ("still
  rejected even with the flag set") and the issue-comment's restatement of that claim. This
  is exactly the class of regression this ticket exists to close — a value that both the
  intake and the issue single out by name as the paradigm case the OCR/fat-finger bug
  produces — being waved through by the very override mechanism meant to have a narrow,
  audited exception. AC-3's own text requires the override to admit rollovers "not blocked
  by this new check" while implicitly (via the whole ticket's purpose) not re-opening the
  fat-finger/OCR-misread hole AC-1 was built to close; this exact hole is what F1
  demonstrates it does not fully close once the flag is available.
- **F2 (R294-class duplication)** is a real structural risk worth fixing before this
  mechanism is trusted further, though not independently blocking on its own — it compounds
  F1's risk by making a future divergence between the client gate and server gate likely
  rather than merely theoretical.
- Per Adversarial Two-Run protocol: a REJECT-class finding (F1 — reproducible, tied
  directly to the ticket's own canonical example, contradicts an explicit dev-report claim)
  means this ticket is not yet ready to close, even though the majority of the surface
  (AC-1, AC-2, AC-4, AC-5, AC-6, and 2 of 3 originally-suspected attack patterns) verifies
  cleanly.

**Requested before re-submission:** tighten the rollover-plausibility gate per the F1
recommendation (ratio well below 0.5 and/or an absolute near-zero floor condition) so that
the ticket's own worked example is actually rejected as claimed, and extract the shared
predicate per F2 to prevent the two copies from silently diverging once F1 is fixed only
in one location.
