# Ticket 3 — Intake: Migrate deprecated middleware.ts to proxy.ts

- **GitHub issue:** [jagmstar/communal#3](https://github.com/jagmstar/communal/issues/3)
- **Type:** Technical debt / framework deprecation (Known Gap from company memory, confirmed
  live via build)
- **Size estimate:** S
- **Intake date:** 2026-08-26
- **Surveyed by:** PM/Intake twin

## Why this ticket (user-value statement)

This is infrastructure risk rather than a feature a person feels today — but it becomes a very
real outage if ignored. `src/middleware.ts` runs CORS preflight handling and a per-IP rate
limiter (30 writes/min) for every `/api/*` call, including the endpoint the submit-a-reading
flow depends on (`POST /api/readings`). Next.js 16.3.2 (the version this repo runs) has
renamed this file convention from `middleware.ts` to `proxy.ts` and already prints a
deprecation warning on every build. If this is deferred until a future Next.js major version
removes the old convention, the rate limiter and CORS handling silently stop being registered
in production — the person submitting a reading gets a broken app with no changelog warning to
explain why.

## Survey correction / confirmation to known-gaps list

Company memory listed "middleware deprecation warning (migrate to proxy)" as a known gap.
Confirmed **exactly as stated**, reproduced live:

```
npm run build
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .
  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
✓ Compiled successfully in 26.1s
```

The bundled Next.js docs (`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`)
confirm this is a rename with "functionality remains the same" — lowering migration risk, and
an official codemod exists.

## Evidence gathered during survey (file/command-backed)

- `npm run build` — run in full, deprecation warning captured verbatim above, build otherwise
  succeeds (exit 0, "Compiled successfully").
- `src/middleware.ts` — read in full (102 lines): exports `middleware(request)` with CORS
  preflight (OPTIONS → 204) and in-memory rate limiting (429 after 30 writes/min per IP),
  `export const config = { matcher: "/api/:path*" }`.
- `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` — read in full; confirms
  rename-only nature and the `proxy.ts` convention (default or named `proxy` export, same
  `config.matcher` shape).
- `package.json` — confirms `"next": "16.3.2"`.

## Acceptance criteria (numbered, verifiable by command)

See full text in GitHub issue #3. Summary:
1. `src/proxy.ts` exists with identical logic; `src/middleware.ts` deleted.
2. `npm run build` output contains zero occurrences of "deprecated"/"middleware-to-proxy".
3. CORS preflight (OPTIONS → 204, headers) behavior unchanged — verified by test.
4. Rate limiting (31st write/min → 429, Retry-After: 60) behavior unchanged — verified by test.
5. `npx vitest run` reports 94+ passed, 0 failed.
6. `npm run build` still succeeds with the same route manifest.

## Out of scope

- Changing the rate-limit algorithm or loosening/tightening CORS policy — rename only.
- Treating "codemod ran" as sufficient evidence — Dev must verify against all 6 AC manually.
- Any change to `next.config.ts` (`MOBILE_BUILD` toggle is unrelated).

## INTAKE gate self-check

- [x] Not a one-sentence ticket — 6 numbered AC, each independently verifiable.
- [x] Every AC has a concrete verification command (build output check, test assertions).
- [x] Every state-of-repo claim is backed by a command actually run during this survey
  (`npm run build` output quoted verbatim above) — not assumed from company memory alone.
- [x] User-value statement connects the deprecation to a concrete failure mode for the
  person using the app, not just "framework hygiene."
