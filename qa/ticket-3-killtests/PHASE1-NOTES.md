# Ticket #3 — Phase 1 BLIND kill-test plan (Independent QA twin)

**Read before writing this plan:** ONLY `docs/pipeline/ticket-3-intake.md` and
`gh issue view 3` (issue body only — the 1 existing comment on the issue was
deliberately NOT read at this stage, per protocol). Diff, dev report, and any
comment thread were not opened until Phase 3.

## What the ticket claims (from the two blind sources)

- `src/middleware.ts` (102 lines) → `src/proxy.ts`, rename-only migration,
  Next.js 16.3.2 convention change. "Functionality remains the same" per
  Next.js's own bundled docs.
- Old file: CORS preflight (`OPTIONS` → 204 + `Access-Control-Allow-Origin: *`
  + `Access-Control-Allow-Methods` + `Access-Control-Allow-Headers` +
  `Access-Control-Max-Age`) and in-memory per-IP rate limiter (30 writes/min,
  31st `POST`/`PUT` → 429 + `Retry-After: 60`), `config.matcher = "/api/:path*"`.
- 6 numbered AC (see intake doc), most importantly:
  1. `src/proxy.ts` exists w/ identical logic, `src/middleware.ts` deleted.
  2. `npm run build` — zero "deprecated"/"middleware-to-proxy" occurrences.
  3. CORS preflight unchanged, verified by test.
  4. Rate limiting unchanged, verified by test.
  5. `npx vitest run` ≥94 passed, 0 failed.
  6. `npm run build` still succeeds, same route manifest.

## Attack list — 3 ways this could look done but be broken

1. **`proxy()` exported but not actually picked up by Next's build/router.**
   Next's proxy convention is filename + export-name sensitive. If the dev
   renamed the file but Next silently falls back to treating it as a random
   module (e.g. wrong export name, wrong location, or Next 16.3.2 actually
   still expects a default export / a different name than `proxy`), the
   build could still "succeed" and even lose the deprecation warning (because
   there's no `middleware.ts` triggering it) while **the proxy layer is never
   registered at all** — meaning CORS + rate limiting silently vanish from
   the real HTTP path, and only unit tests that import `proxy` directly and
   call it as a plain function would still pass, masking total prod breakage.
   → Kill-test: grep the build output for a positive marker line that Next
   actually registered a proxy/middleware layer (e.g. "Proxy (Middleware)" or
   equivalent — NOT just absence of the warning), on both commits, and diff.
   Also directly `import` from the actual `src/proxy.ts` path (not a copy) in
   my own from-scratch test file, so an export-name/path mistake would fail
   my import, independent of whatever the dev's own test file imports.

2. **`config.matcher` lost, renamed, or scoped wrong** — e.g. dropped
   entirely (proxy runs on every route including static pages, wasting
   compute or breaking something else), or narrowed/widened so it stops
   matching `/api/readings` specifically (the ticket calls this route out
   by name as depending on this behavior) while still "matching something."
   A build could succeed and generic tests could still pass if the test
   suite doesn't check the exact matcher string.
   → Kill-test: assert `config.matcher === "/api/:path*"` exactly (not just
   truthy) on the patched commit, independently. Also functionally verify
   CORS/rate-limit behavior fires specifically for `/api/readings` (the
   route named in the ticket) and does NOT fire for a non-API path like `/`
   or `/history`, on both commits.

3. **Behavior only verified via unit-level mocks calling the exported
   function directly, while the real Next.js build routing is never
   exercised** — i.e. the dev's own test file imports `proxy()` and calls it
   in isolation (bypassing Next's routing/registration entirely), which
   would pass even if bug #1 above were true (wrong export name/location
   relative to what Next actually loads at build/runtime). A migration can
   "look done" (tests green, build green, warning gone) while the live
   HTTP proxy is dead.
   → Kill-test: (a) don't trust the dev's test file — write my own
   independent test file importing directly from the real `src/proxy.ts`
   (patched) / `src/middleware.ts` (parent) module path, testing CORS +
   rate-limit behavior myself from scratch; (b) cross-check the build output
   positively shows the proxy/middleware layer registered (see #1) as a
   second, build-level (not just unit-level) signal that routing actually
   picked it up.

## Kill-tests to write now (before opening diff/dev report)

- **(a) Build-warning check** — `npm run build` on both commits (parent
  `0c7f90c`, patched `3b32874`), capture full stdout+stderr, grep case-
  insensitive for "deprecated" and "middleware-to-proxy".
  Expected: PRESENT on parent, ABSENT on patched.
  Also (attack #1 defense): grep for the positive registration marker line
  in the route manifest (whatever Next 16.3.2 actually prints — expect
  something naming Proxy/Middleware in the route table) on BOTH commits —
  must be present on both (parent as "Middleware", patched as some
  Proxy-labeled equivalent), proving the layer is actually registered in
  the real build on the patched commit, not just "warning gone because file
  is gone."

- **(b) Behavior preservation — the real attack.** Two independent,
  from-scratch tests (not reusing/copying the dev's test file), run against
  BOTH commits (against `middleware()` on parent, `proxy()` on patched, both
  imported directly from their real file paths):
  - CORS preflight: `OPTIONS` request to `/api/readings` → assert status
    204 and all 4 headers (`Access-Control-Allow-Origin`,
    `-Methods`, `-Headers`, `-Max-Age`) present with exact values.
  - Rate limiting: fire 30 `POST` writes from the same IP, assert allowed;
    fire a 31st → assert 429 + `Retry-After: 60` header.
  - Non-API passthrough: assert a non-`/api` path is NOT touched (no rate
    limit, no CORS override) — this also indirectly checks the matcher
    scope isn't wrong (attack #2).
  - Compare results across commits: must be byte/value-identical (status
    codes, header values) — any divergence is a REJECT-class finding.

- **(c) File-state check** — `Test-Path src/middleware.ts` and
  `Test-Path src/proxy.ts` on both commits; expect the reverse pattern
  (parent has middleware.ts only, patched has proxy.ts only).

- **(d) Full vitest suite** — `npx vitest run` on both commits, capture
  pass/fail counts. Expect ticket's own baseline (94 on parent per AC-5's
  "94 baseline" framing) and ≥94 on patched with 0 failures on both.

## Explicitly NOT trusted at this stage

- The dev's own `src/__tests__/proxy.test.ts` file — not read, not reused,
  not assumed correct. My own kill-test file is written independently
  against the real module paths.
- Any comment on issue #3 (1 comment exists, deliberately skipped).
- The dev report (not yet written/read at this stage).
