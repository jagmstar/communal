# Ticket 2 — Intake: Component tests for the readings-entry flow

- **GitHub issue:** [jagmstar/communal#2](https://github.com/jagmstar/communal/issues/2)
- **Type:** Test infrastructure + coverage (Known Gap from company memory, confirmed)
- **Size estimate:** M (one-time test-infra setup + 3 files covered; follow-ups are S each)
- **Intake date:** 2026-08-26
- **Surveyed by:** PM/Intake twin

## Why this ticket (user-value statement)

The submit-a-reading screen (`src/app/submit/page.tsx`, 586 lines, 6 UI states) is the single
screen where a real person turns a photo of their meter into the number that becomes their
utility bill. It has the OCR pipeline, the manual-entry fallback, the camera-error fallback,
and the (currently non-blocking — see ticket #1) low-reading warning. None of this is covered
by an automated test today. If a refactor or dependency bump silently breaks the submit button,
the OCR fallback, or the warning banner, nothing catches it in CI — the family relying on this
app to avoid a wrong bill only discovers a problem when their bill is already wrong.

## Survey correction to known-gaps list

Company memory stated "14 TSX untested." Direct count during this survey
(`Get-ChildItem -Recurse -Filter *.tsx src`) found **15** TSX files with zero test coverage:
5 app pages (`layout.tsx`, `page.tsx`, `history/page.tsx`, `settings/page.tsx`,
`submit/page.tsx`) + 10 components (`BillExplanation.tsx`, `BottomNav.tsx`,
`DeadlineAlert.tsx`, `ErrorBoundary.tsx`, `ErrorState.tsx`, `LoadingState.tsx`,
`MeterCard.tsx`, `ServiceWorkerRegister.tsx`, `SmartInsights.tsx`, `UsageChart.tsx`).
Zero `.test.tsx`/`.spec.tsx` files exist anywhere in `src/` (confirmed via file search).

Also confirmed: no component-test infrastructure exists at all. `node_modules/@testing-library`
and `node_modules/jsdom` do not exist; `package.json` devDependencies has none of them;
`vitest.config.ts` uses `environment: "node"` (cannot render React components as-is).

## Evidence gathered during survey (file/command-backed)

- `Get-ChildItem -Recurse -Filter "*.tsx" src` — 15 files listed, confirmed above.
- `Get-ChildItem -Recurse -File -Include "*.test.tsx","*.spec.tsx" src` — 0 results.
- `Test-Path node_modules\@testing-library` / `node_modules\jsdom` / `node_modules\happy-dom`
  — all `False`.
- `node -e "require('./package.json').devDependencies"` — confirmed no testing-library/jsdom
  entries.
- `F:\communal\vitest.config.ts` read in full — `environment: "node"`.
- `npx vitest run` baseline: **94/94 tests pass** (2026-08-26).

## Acceptance criteria (numbered, verifiable by command)

See full text in GitHub issue #2. Summary:
1. Component-test infra added (`@testing-library/react`, `@testing-library/jest-dom`,
   `jsdom`/`happy-dom`) and `vitest.config.ts` updated to support `.test.tsx` rendering.
2. `submit/page.tsx` gets ≥3 tests: manual-entry input, low-reading warning render, disabled
   submit button when empty.
3. `MeterCard.tsx` gets ≥2 tests: compact/full render + onClick.
4. `ErrorBoundary.tsx` gets a test proving it catches a child error and renders fallback.
5. `npx vitest run` reports 0 failed (94 baseline + new).
6. `npm run test:coverage` produces non-zero coverage for these 3 files.

## Out of scope

- 100% coverage of all 15 TSX files — this ticket covers infra + 3 highest-risk files as a
  template; remaining 12 are follow-up tickets (S each).
- E2E/Playwright — separate concern (this ticket is unit/integration-level).
- Visual regression / screenshot testing.

## INTAKE gate self-check

- [x] Not a one-sentence ticket — 6 numbered AC, each independently verifiable.
- [x] Every AC has a concrete verification command or file/test-count check.
- [x] Every state-of-repo claim (15 vs 14 TSX, zero test infra) is backed by a command run
  during this survey, listed above.
- [x] User-value statement written for the person submitting a reading.
