# Ticket #3 — QA Verdict (Adversarial Two-Run, Migration Variant)

**QA role:** Independent QA twin (same mechanism as family-expenses #85/#86/#87 —
Phase 1 BLIND kill-tests → Phase 2 Two-Run on both commits → Phase 3 dev-report
cross-check).

- **Patched commit:** `3b32874` — "fix(#3): migrate deprecated middleware.ts to proxy.ts"
- **Parent (unpatched) commit:** `3b32874~1` = `0c7f90c` — "docs(intake): PM/Intake survey
  and 3 tickets for communal pilot"
- **Environment:** Windows PowerShell, `PYTHONIOENCODING=utf-8`, Node v24.18.0, npm 11.16.0,
  Next.js 16.3.2 (Turbopack), Vitest v4.1.11.
- **Method:** Kill-tests were written BLIND from `docs/pipeline/ticket-3-intake.md` +
  `gh issue view 3` **issue body only** — the single existing comment on issue #3 was
  deliberately not read at Phase 1. Two isolated `git worktree`s were built
  (`F:\communal-qa-parent` @ `0c7f90c`, `F:\communal-qa-patched` @ `3b32874`), each with a
  fresh `npm install` (not the main repo's `node_modules` — a first attempt junction-linked
  `node_modules` from `F:\communal` and Turbopack's build correctly refused to run against a
  symlink pointing outside the worktree root, so both worktrees got their own real
  `node_modules`). Source of truth: `qa/ticket-3-killtests/PHASE1-NOTES.md` (blind attack
  plan) + `qa/ticket-3-killtests/qa-killtest-behavior.test.ts` (from-scratch behavior test,
  templated and run against both `middleware()` and `proxy()` — not a rerun/reuse of the
  dev's own `src/__tests__/proxy.test.ts`) + `qa/ticket-3-killtests/run-killtests.ps1`
  (the runner) + `qa/ticket-3-killtests/results/*.log` (raw captured output).

## Attack list (from blind Phase-1 plan) — all 3 defused

1. **`proxy()` exported but not picked up by Next → no "Proxy (Middleware)" line in the
   build's route manifest.** Defused: the patched build's route manifest explicitly prints
   `ƒ Proxy (Middleware)` (see `results/build-patched.log` line 32), proving Next.js 16.3.2
   actually registered `src/proxy.ts` as the live proxy layer, not just "warning gone because
   the old file is gone." (Interesting side-observation, not a defect: the **parent**'s build
   also prints the same `ƒ Proxy (Middleware)` label for the old `middleware.ts` — this
   version of Next.js uses that label for both conventions, so the label alone would not have
   distinguished old-from-new; the meaningful signal is that the label is present in **both**
   with the deprecation warning present only on the parent, exactly as it should be.)
2. **`matcher` config lost/narrowed/widened.** Defused: independent test
   `expect(config.matcher).toBe("/api/:path*")` passes exact-match (not just truthy) on the
   patched commit, and the non-API passthrough test (`/history` OPTIONS request stays a
   plain passthrough, no CORS override) confirms the matcher scope wasn't silently widened.
3. **Behavior verified only via unit mocks while real build routing is broken.** Defused on
   two independent axes: (a) my own kill-test file imports `proxy`/`middleware` directly from
   the real module path in each worktree (not the dev's test file, not a copy) — an
   export-name or path mistake would have failed this import; (b) the build-level check in
   attack #1 above is a second, non-unit-test signal that the real Next.js routing layer
   picked up the module, independent of any mocked test.

## (a) Build-warning check

| Check | Parent `0c7f90c` | Patched `3b32874` |
|---|---|---|
| `npm run build` exit code | 0 | 0 |
| "deprecated" in build output | **Present** — `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` | **Absent** (0 matches) |
| "middleware-to-proxy" in build output | **Present** (codemod hint + docs link, 2 occurrences) | **Absent** (0 matches) |
| Route manifest registration marker | `ƒ Proxy (Middleware)` present | `ƒ Proxy (Middleware)` present |
| Route manifest (app routes) | `/`, `/_not-found`, `/api/meters`, `/api/readings`, `/api/settings`, `/api/tariffs`, `/history`, `/settings`, `/submit` | **Identical**, same 9 routes, same static/dynamic markers |

Exactly the required discrimination: warning present on parent, absent on patched, with
positive proof (not just absence) that the proxy layer is registered in the real build.

## (b) BEHAVIOR PRESERVATION — the real attack (independent, from-scratch test)

Ran my own `qa-killtest-behavior.test.ts` (never seen/copied the dev's
`src/__tests__/proxy.test.ts` when writing it) against `middleware()` on the parent and
`proxy()` on the patched commit, importing each directly from its real file path:

| Behavior | Parent (`middleware()`) | Patched (`proxy()`) | Identical? |
|---|---|---|---|
| `config.matcher` exact value | `/api/:path*` | `/api/:path*` | ✅ |
| Non-`/api` path (`/history`, OPTIONS) | passthrough, no 204, no CORS header | passthrough, no 204, no CORS header | ✅ |
| CORS preflight `OPTIONS /api/readings` → status | 204 | 204 | ✅ |
| `Access-Control-Allow-Origin` | `*` | `*` | ✅ |
| `Access-Control-Allow-Methods` | `GET, POST, PUT, OPTIONS` | `GET, POST, PUT, OPTIONS` | ✅ |
| `Access-Control-Allow-Headers` | `Content-Type, Authorization` | `Content-Type, Authorization` | ✅ |
| `Access-Control-Max-Age` | `86400` | `86400` | ✅ |
| 30 POST writes (same IP) | all pass (200) | all pass (200) | ✅ |
| 31st POST write | 429 + `Retry-After: 60` + `Access-Control-Allow-Origin: *` | 429 + `Retry-After: 60` + `Access-Control-Allow-Origin: *` | ✅ |
| PUT shares budget with POST (31st PUT after 30 PUT) | 429 | 429 | ✅ |
| Per-IP independence (IP A blocked, IP B fresh) | A blocked / B ok | A blocked / B ok | ✅ |
| GET never rate-limited (after 35 writes) | 200 | 200 | ✅ |

**7/7 independent tests pass identically on both commits — zero behavioral divergence.**
Full logs: `qa/ticket-3-killtests/results/killtest-parent.log` (7 passed),
`qa/ticket-3-killtests/results/killtest-patched.log` (7 passed).

## (c) File-state check

| File | Parent `0c7f90c` | Patched `3b32874` |
|---|---|---|
| `src/middleware.ts` | **Present** | **Absent** |
| `src/proxy.ts` | Absent | **Present** |
| `src/__tests__/proxy.test.ts` (dev's own) | Absent | **Present** (10 tests) |

Exact reverse pattern as required. Confirmed via `Test-Path` in both worktrees.

## (d) Full vitest suite, both commits

| Commit | Test files | Tests | Failures |
|---|---|---|---|
| Parent `0c7f90c` | 6 passed | **94 passed** | 0 |
| Patched `3b32874` | 7 passed | **104 passed** | 0 |
| Patched, my QA test file also present | 8 passed | **111 passed** (104 + 7 QA) | 0 |

Baseline of 94 on the parent matches the ticket's own framing ("94 baseline"); patched
adds exactly the dev's 10 new tests (94 + 10 = 104), matching AC-5 (≥94, actually 104) and
the dev report's claimed count exactly. stderr noise in the logs (`Connection failed`,
`DATABASE_URL environment variable is not set`, etc.) is expected `console.error` output
from intentional error-path tests in `readings.test.ts`/`settings.test.ts`/`tariffs.test.ts`
— not failures, present identically on both commits.

## Phase 3 — Dev-report claims vs. independent verification

| Dev claim | QA verification | Match? |
|---|---|---|
| `src/proxy.ts` exists exporting `proxy`, `src/middleware.ts` deleted (AC-1) | Independently confirmed via `Test-Path` in both worktrees | ✅ |
| Zero "deprecated"/"middleware-to-proxy" in patched build output (AC-2) | Independently grepped patched build log — 0 matches; parent build log — matches present (2 occurrences) | ✅ |
| Route manifest shows `ƒ Proxy (Middleware)`, proving registration (dev's own AC-2 note) | Independently confirmed present in patched build log, line 32 | ✅ |
| CORS preflight unchanged, tested (AC-3) | Independently re-tested from scratch against the real module — identical 204 + 4 headers on both commits | ✅ |
| Rate limiting unchanged, tested (AC-4) | Independently re-tested from scratch — identical 30-allowed/31st-429/Retry-After:60/per-IP/PUT-shares-budget/GET-exempt behavior on both commits | ✅ |
| `npx vitest run` reports 104 passed, 0 failed (AC-5, "94 baseline + 10 new") | Independently reran: 104 passed exactly (94 baseline confirmed unchanged on parent + 10 new dev tests), 0 failed | ✅ |
| `npm run build` still succeeds, same route manifest (AC-6) | Independently rebuilt both commits: exit 0 on both, identical 9-route manifest, only the deprecation-warning-block differs | ✅ |
| "byte-for-byte identical logic... only the required rename" | Independently read `git diff 0c7f90c 3b32874 -- src/middleware.ts src/proxy.ts`: exactly 4 lines changed — 2 comment lines (header + section label) and the function declaration/export line (`middleware` → `proxy`). Every other line (rate-limit constants, `checkRateLimit`, `cleanupExpiredEntries`, the OPTIONS/204/CORS block, the 429/`Retry-After` block, `config.matcher`) is untouched. Claim verified true, not just asserted. | ✅ |
| "104 passed (94 baseline + 10 new)" | Independently confirmed both halves of the arithmetic: 94 on parent alone, 104 on patched alone | ✅ |
| Out-of-scope respected (no CORS/rate-limit algorithm change, no `next.config.ts` touch) | `git diff --stat 0c7f90c 3b32874` shows exactly 3 files touched: `docs/pipeline/ticket-3-dev-report.md` (new), `src/__tests__/proxy.test.ts` (new), `src/{middleware.ts => proxy.ts}` (renamed, 6 lines changed in diff stat — 3 add/3 del, matching the 2 comment-line + 1 function-line pairs). `next.config.ts` untouched. | ✅ |

**No dev claim was contradicted.** Every acceptance criterion (AC-1 through AC-6)
independently re-verified true from a from-scratch test and a from-scratch build/vitest
run, not merely trusted from the dev report.

## Findings

### F1 — Severity: None (verified, not a defect) — Next.js labels both conventions "Proxy (Middleware)"
The parent build (still using `src/middleware.ts`) also prints `ƒ Proxy (Middleware)` in its
route manifest, same label as the patched build. This means the manifest label alone cannot
distinguish "old convention, about to be removed" from "new convention" in this specific
Next.js version — the meaningful signal for AC-2/AC-6 is the *deprecation warning line*
(present only on parent) combined with the *file existing at all* (checked in (c)), not the
manifest label. Not a defect in the dev's work — noted for completeness since my own blind
Phase-1 attack list treated the manifest label as the primary attack-#1 signal, and it's
worth recording that it turned out to be a necessary-but-not-sufficient signal (the warning
absence + file-state check together are what actually discriminate).

### F2 — Severity: None (verified, not a defect) — junction-linked `node_modules` broke Turbopack, requiring fresh installs
An initial attempt to save time by directory-junctioning `node_modules` from the main repo
into both QA worktrees caused Turbopack to fail with `Symlink [project]/node_modules is
invalid, it points out of the filesystem root` on **both** commits identically (a QA
tooling artifact, not a code defect — confirmed by the fact that both parent and patched
worktrees hit the exact same class of failure before `node_modules` was replaced with a
real `npm install` in each). Not a REJECT-class finding; documented here only so the
methodology in `results/` is fully explained (two build-log pairs exist in the git history
of this investigation; the final logs described in table (a) are from the second, clean
run with real installs).

### F3 — Severity: None (verified, not a defect) — "1 comment" on the issue was correctly skipped
Per protocol, the single existing comment on issue #3 was not read during Phase 1. After
completing all blind checks, I confirmed via `gh issue view 3` that the comment thread does
not contradict anything in the issue body or intake doc used for the blind kill-test plan.

## Final Verdict: **ACCEPT**

Rationale:
- **Build-warning discrimination** — independently confirmed present-on-parent,
  absent-on-patched, plus a positive registration signal (route manifest shows the proxy
  layer live in the real build, not just the warning gone).
- **Behavior preservation (the real attack)** — the single highest-risk failure mode in a
  middleware→proxy migration (silent CORS/rate-limit breakage) was tested with a
  from-scratch, independently-written test file (not reused from the dev), importing the
  real module directly from each commit's actual file path. All 7 behavioral assertions
  (CORS 204 + 4 exact headers, 30-write allowance, 31st-write 429 + `Retry-After: 60`,
  PUT/POST shared budget, per-IP independence, GET exemption, matcher exact-match, non-API
  passthrough) are **byte/value-identical** across both commits. Zero divergence.
- **File-state** — exact reverse pattern confirmed (`middleware.ts` gone + `proxy.ts` present
  on patched; reverse on parent).
- **Full suite** — 94 passed on parent, 104 passed on patched (94 baseline + 10 new,
  arithmetic independently confirmed), 0 failures on either commit.
- **Diff minimality** — independently read the actual diff: exactly 4 lines of substantive
  change (2 comments + 1 function name/export), confirming the dev's "byte-for-byte
  identical logic, rename only" claim rather than merely trusting it.
- **Attack list** — all 3 identified failure modes (proxy not registered by Next; matcher
  lost/scoped wrong; behavior only unit-mocked while real routing broken) were specifically
  targeted and found **not present** in this migration.
- **Scope discipline** — `git diff --stat` confirms only 3 files touched (dev report, new
  test file, the renamed proxy/middleware file); `next.config.ts` untouched; no
  CORS-policy or rate-limit-algorithm change.

No REJECT-class finding was found. No corrective action is required before this ticket is
closed.
