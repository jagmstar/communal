# APK auth decision — ticket queue-20260917-0455-senior-fullstack-dev step 3

**Decision: Option 3b.** Web auth (HMAC session cookie, `src/proxy.ts` +
`src/lib/session.ts` + `src/app/api/login/route.ts`, commits `8a719bf`/`46c8944`)
ships to production now. The Android APK (`communal-app-v3-2026-09-10.apk`,
built from a pre-auth checkout) is **knowingly dark**: it will get 401 from
every `/api/*` call because `src/lib/api.ts:22` sends `Origin: https://localhost`
cross-origin with no cookie, and `src/proxy.ts`'s CORS response still answers
`Access-Control-Allow-Origin: *` (incompatible with credentialed requests) —
this is D3 in `deliverables/qa/communal-auth-gate-2026-09-16.md` and confirmed
unresolved in `deliverables/qa/communal-auth-killtest.ps1`'s
`/api/meters(native)` probe (`acao='*' acac=''`, run 2026-09-17, see PR/report).

## Why 3b over 3a/3c (per the three options in communal-auth-gate-2026-09-16.md:45-47)

- **3a** (Bearer-token fallback) requires a follow-up ticket to actually embed
  a token in the APK build — not done here, so choosing 3a today would just be
  3b with extra unshipped code.
- **3c** (cookie auth for the APK) is a 4-part change per the gate doc:
  `credentials:"include"` in `src/lib/api.ts:35`, `SameSite=None; Secure`,
  an explicit `Access-Control-Allow-Origin: https://localhost` (never `*`),
  `Access-Control-Allow-Credentials: true`, plus an in-app login view. None of
  that exists in this repo today — a one-night change it is not.
- **3b** ships the P0 fix (Roman's data was public, unauthenticated, from any
  browser — `deliverables/qa/communal-auth-gate-2026-09-16.md` D1/D2) tonight
  without waiting on APK work. QA's own position (gate doc line 59): "Web-only
  cookie auth (option 3b) shipping tonight with the APK declared knowingly
  dark **is an acceptable risk** and better than leaving `/api/settings`
  public for another day."

## Known issue (owner + date, per the gate doc's requirement)

- **Issue:** Android APK cannot authenticate against the live API; every
  `/api/*` call returns 401 (page shells will render but show only error/empty
  states).
- **Owner:** senior-fullstack-dev (this role).
- **Follow-up:** implement 3c (or 3a with a real token flow) in a dedicated
  ticket — do not bundle into a future unrelated feature. Until then, the APK
  build should not be redistributed as functional; `communal-app-v3-2026-09-10.apk`
  predates this auth gate entirely and was never auth-aware to begin with.
- **Date recorded:** 2026-09-17.
