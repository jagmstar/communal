# Ticket 3 — Dev Report: Migrate deprecated middleware.ts to proxy.ts

- **GitHub issue:** [jagmstar/communal#3](https://github.com/jagmstar/communal/issues/3)
- **Dev twin:** DEV twin (Windows)
- **Base commit:** `0c7f90c` (origin/master at start of work; no parallel #1 changes had
  landed on origin/master by the time this work started, confirmed via `git fetch` +
  `git log origin/master --oneline`)
- **Approach:** Manual rename per official Next.js 16 docs (bundled
  `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`), not the
  `npx @next/codemod` CLI — manual edit was faster for a 102-line file and let me verify
  every line against the original by inspection rather than trusting an automated diff.
  Per issue "Out of scope" note, codemod-vs-manual is a legitimate choice as long as all 6 AC
  are independently verified, which is done below.

## What changed

- **Deleted:** `src/middleware.ts` (102 lines: CORS preflight + in-memory per-IP rate limiter).
- **Added:** `src/proxy.ts` — byte-for-byte identical logic to the old `middleware.ts`, with
  only the required rename: `export function middleware(...)` → `export function proxy(...)`,
  file header comment updated from "Middleware" to "Proxy" terminology. `checkRateLimit`,
  `cleanupExpiredEntries`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_WRITES`,
  `rateLimitMap`, the OPTIONS/204/CORS-header block, the POST/PUT rate-limit block, the 429
  JSON body + `Retry-After: 60` header, and `export const config = { matcher: "/api/:path*" }`
  are all unchanged verbatim.
- **Added:** `src/__tests__/proxy.test.ts` — 10 new vitest tests exercising the exported
  `proxy()` function directly (following the existing pattern in
  `src/app/api/__tests__/*.test.ts`, using `NextRequest` from `next/server` since `proxy`
  reads `request.nextUrl`, unlike the plain `Request` mocks used by the route-handler tests):
  - config.matcher shape
  - non-`/api` passthrough
  - OPTIONS → 204 + all 4 CORS headers, on `/api/readings` and `/api/meters`
  - GET passthrough (not rate-limited)
  - 30 POST writes allowed, 31st → 429 + `Retry-After: 60` + CORS origin header present
  - PUT tracked against the same per-IP write budget as POST (429 on 31st PUT)
  - rate limit tracked independently per IP (IP A hitting limit doesn't block IP B)
  - `x-real-ip` fallback used when `x-forwarded-for` absent

## Acceptance criteria — verification

**AC-1** — `src/proxy.ts` exists exporting `proxy`, identical logic; `src/middleware.ts` deleted.
**ЗРОБИВ.**
```
PS> Test-Path src/middleware.ts
False
PS> Test-Path src/proxy.ts
True
```

**AC-2** — `npm run build` output contains zero occurrences of "deprecated" /
"middleware-to-proxy". **ЗРОБИВ.**
```
PS> npm run build 2>&1 | Tee-Object -FilePath build-output-ticket3.log
> communal@0.1.0 build
> next build

▲ Next.js 16.3.2 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 31ms

  Creating an optimized production build ...
✓ Compiled successfully in 13.8s
  Running TypeScript ...
  Finished TypeScript in 2.9s ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (11/11) in 509ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/meters
├ ƒ /api/readings
├ ƒ /api/settings
├ ƒ /api/tariffs
├ ○ /history
├ ○ /settings
└ ○ /submit

ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

PS> Select-String -Path build-output-ticket3.log -Pattern "deprecated","middleware-to-proxy"
(no matches — zero occurrences)
```
Note the route manifest itself now prints `ƒ Proxy (Middleware)` instead of the old
`ƒ Middleware` label — direct confirmation Next.js picked up `proxy.ts` as the registered
proxy layer, not a leftover/duplicate registration.

**AC-3** — CORS preflight unchanged (OPTIONS → 204, `Access-Control-Allow-Origin: *`, same
methods/headers). **ЗРОБИВ.** Verified by 3 tests in `src/__tests__/proxy.test.ts`
("CORS preflight" describe block: 204 + all 4 headers on `/api/readings`, plus a second
`/api/meters` subpath check) — all passing.

**AC-4** — Rate limiting unchanged (31st write/min → 429, `Retry-After: 60`). **ЗРОБИВ.**
Verified by 4 tests in `src/__tests__/proxy.test.ts` ("rate limiting" describe block):
30 allowed writes, 31st POST → 429 + `Retry-After: 60`, PUT tracked against the same budget,
per-IP independence — all passing.

**AC-5** — `npx vitest run` reports 94+ passed, 0 failed. **ЗРОБИВ.**
```
 Test Files  7 passed (7)
      Tests  104 passed (104)
   Start at  16:59:10
   Duration  809ms
```
104 = 94 baseline (unchanged, all pre-existing test files still pass byte-for-byte) + 10 new
`src/__tests__/proxy.test.ts` tests. 0 failed. (stderr lines visible during the run are
pre-existing `console.error` calls from intentional error-path tests in
`readings.test.ts`/`settings.test.ts`/`tariffs.test.ts` — not failures, same as baseline.)

**AC-6** — `npm run build` still succeeds (exit 0), same route manifest. **ЗРОБИВ.**
Exit code confirmed separately:
```
PS> npm run build > $null 2>&1; Write-Output "build exit code: $LASTEXITCODE"
build exit code: 0
```
Route manifest (`/`, `/_not-found`, `/api/meters`, `/api/readings`, `/api/settings`,
`/api/tariffs`, `/history`, `/settings`, `/submit`) is identical to the pre-migration build —
only the trailing `ƒ Proxy (Middleware)` label changed (expected, and evidence of success).

## Summary

| AC | Status |
|----|--------|
| 1. proxy.ts exists, middleware.ts deleted | ЗРОБИВ |
| 2. Zero "deprecated"/"middleware-to-proxy" in build output | ЗРОБИВ |
| 3. CORS preflight behavior unchanged (tested) | ЗРОБИВ |
| 4. Rate limiting behavior unchanged (tested) | ЗРОБИВ |
| 5. `npx vitest run` 94+ passed, 0 failed | ЗРОБИВ (104 passed, 0 failed) |
| 6. `npm run build` succeeds, same route manifest | ЗРОБИВ |

## Out-of-scope items respected

- No change to the rate-limiting algorithm or CORS policy (still wildcard origin, still
  30 writes/min in-memory) — rename only, per ticket scope.
- Did not treat "codemod would have worked" as sufficient evidence — every AC verified
  manually via command output and a dedicated test file, per ticket's explicit instruction.
- `next.config.ts` (`MOBILE_BUILD` toggle) untouched.

## Coordination with parallel Dev (#1)

`git fetch origin` + `git log origin/master --oneline` at both start and end of this work
showed no new commits from #1's Dev twin landed on `origin/master` (HEAD remained
`0c7f90c` throughout) — no rebase was required. This ticket only touches
`src/middleware.ts` → `src/proxy.ts`, `src/__tests__/proxy.test.ts` (new file), and this
report; no overlap expected with #1's file set regardless.
