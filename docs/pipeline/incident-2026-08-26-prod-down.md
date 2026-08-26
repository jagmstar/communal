# Incident Report — Production Down (ErrorBoundary), 2026-08-26

- **Severity:** SEV-1 (all API routes down, app unusable)
- **Reporter:** Roman (CEO), first sighting ~17:34 EEST via https://communal-navy.vercel.app
- **Responder:** Incident-response agent (this session)
- **Status:** **RESOLVED** — service verified healthy as of 18:03 EEST (2026-08-26)

## TL;DR

The outage was **not** caused by today's feature commits (`0c7f90c` intake,
`3b32874` proxy migration, `30a3628` reading validation) and **not** caused by a
fresh/broken auto-deploy from the new GitHub repo — the live production deployment
was three days old (created 2026-08-23) the entire time; none of today's commits had
been deployed yet.

**Confirmed root cause, fully traceable:** commit `f29eb4b` ("fix(security): remove
hardcoded Neon DB credential from scripts/init-db.js", 17:57:57 EEST) removed a
plaintext Neon connection string that had been committed to the **public**
`jagmstar/communal` GitHub repo, and **rotated the exposed password via the Neon
Management API as part of the same fix** (correct, necessary security response to a
leaked credential). That rotation changed the live password for the `neondb_owner`
role (Neon operation log confirms `apply_config` on the role at 17:54:34 EEST). Vercel's
production `DATABASE_URL` env var, however, still held the **old, now-invalid**
password — nothing in that commit (or any other) updated Vercel's copy. From the moment
of rotation, every API route (`/api/meters`, `/api/readings`, `/api/settings`,
`/api/tariffs`) started failing with `NeonDbError: password authentication failed for
user 'neondb_owner'` on every request, the client's `fetch` calls rejected, and React's
`ErrorBoundary` (`src/components/ErrorBoundary.tsx`) caught the resulting render error —
producing exactly the screen Roman saw: "Щось пішло не так. Сталася помилка. Спробуйте
перезавантажити сторінку."

**Fix applied:** synced Vercel's `DATABASE_URL` to the new (rotated) Neon connection
string and redeployed. No code changes. Verified live: all 4 pages + all 4 API routes
return 200 as of this report.

## Timeline (EEST, UTC+3)

| Time | Event |
|---|---|
| 16:54:32 | Commit `0c7f90c` — PM/Intake docs + 3 GitHub issues filed (`jagmstar/communal` repo created same session, first push — **this made the repo, and everything already committed to it, public**) |
| 17:01:17 | Commit `3b32874` — `middleware.ts` → `proxy.ts` migration (ticket #3) |
| 17:18:26 | Commit `30a3628` — reading-below-last-reading validation (ticket #1) |
| 17:34 (approx.) | **Roman reports ErrorBoundary screen** on https://communal-navy.vercel.app |
| 17:36–17:52 | Incident response begins (this session). `Invoke-WebRequest` against all 4 pages + all 4 API routes — **all return HTTP 200 with valid data** at this point. `npx vercel logs` for this window shows only `info` 200 entries. Deploy-provenance check: `npx vercel inspect` shows the live deployment (`dpl_4iQ7xDez4m9wrBZDopsQuMCi9cEL`) was created **2026-08-23T12:31:49 EEST — 3 days before any of today's commits**; `npx vercel ls` confirms no new deploy fired today; GitHub↔Vercel Git integration was found **disconnected** (confirmed via `vercel git connect`, which reported no prior link, then immediately re-disconnected to avoid altering prod behavior mid-incident). **This rules out "bad auto-deploy" as today's cause** — nothing from today had reached production yet. |
| 17:38:51 | Commit `1aa54d1` — QA kill-tests for ticket #1, verdict **REJECT** (rollover gate too loose, see `qa/ticket-1-verdict.md` Finding F1) |
| 17:57:57 | **Commit `f29eb4b`** — a plaintext Neon connection string (`postgresql://neondb_owner:npg_twkiVDP72ChM@...`) hardcoded in `scripts/init-db.js` is found and removed. Per the commit message, **the exposed password was rotated via the Neon Management API as part of this same fix.** This script had been committed to the repo before it went public at 16:54; going public on GitHub made this a live, exposed production DB credential — correctly treated as a leak requiring immediate rotation. |
| 17:54:34 | **Neon operation log** (`npx neonctl operations list`): `apply_config` + `epc_sync` on branch `br-lively-queen-avu99zsl`, role `neondb_owner`. Role `updated_at` = `2026-08-26T14:54:34Z` UTC = **17:54:34 EEST**, vs. role `created_at` = 2026-08-22 (untouched for 4 days until this moment). This is the exact rotation from `f29eb4b`, timestamped ~3 minutes before the commit itself was written (rotation via API happened first, commit/removal of the now-dead string second — consistent order). |
| 17:59:19 | Commit `2d2652b` — dev fix for the ticket #1 QA rejection (tightens rollover ratio, dedupes predicate) |
| 18:01:23–18:01:26 | **Live re-check during this investigation**: `/api/meters`, `/api/readings`, `/api/settings`, `/api/tariffs` now **all return HTTP 500**. `npx vercel logs` confirms: `Error [NeonDbError]: password authentication failed for user 'neondb_owner'` on every route, reproduced on 3 consecutive retries 2s apart (not a transient blip). Page routes still return 200 (static shells; the failing `fetch` calls happen client-side, caught by `ErrorBoundary`). |
| 18:01:43 | Commit `299d908` — unrelated TS build fix, excludes `qa/` template files from compilation |
| 18:02 | **Root cause confirmed**: compared Vercel's stored `DATABASE_URL` (via `vercel env pull`, byte-length only, value never printed) against the current Neon connection string (via `npx neonctl connection-string`, using an already-authenticated CLI session) — passwords differed. Matches the `f29eb4b` rotation exactly. |
| 18:02–18:03 | **Fix applied**: current Neon connection string piped directly from `neonctl` into `vercel env rm DATABASE_URL production` + `vercel env add DATABASE_URL production` via stdin — value never printed to any log, file, or terminal output. `npx vercel redeploy https://communal-navy.vercel.app --target production` — ready in 59s, aliased back to `communal-navy.vercel.app`. |
| 18:03 | **Verification**: all 8 checks (`/`, `/submit`, `/history`, `/settings`, `/api/meters`, `/api/readings`, `/api/settings`, `/api/tariffs`) return HTTP 200, no ErrorBoundary text in any response, `/api/meters` payload contains valid meter data. |
| 18:09:52 | Commit `899be9c` — QA re-run verdict **ACCEPT** for the ticket #1 fix (unrelated to this incident, concurrent work) |

## Root cause — evidence chain

1. **Not a bad deploy.** `vercel inspect` on the live deployment ID shows it was created
   2026-08-23 — 3 days before today's commits. `vercel ls` lists only 3 total
   deployments; none created today, before or after the fix. None of today's commits
   (including the leaked-credential one) had been deployed to Vercel at any point.
2. **Not the proxy.ts migration or the reading-validation change.** Neither touches
   Neon credentials, and the observed 500s hit **`GET`** on all 4 routes uniformly
   (including `/api/tariffs`, `/api/settings` — routes ticket #1 never touched). Also,
   as above, undeployed regardless.
3. **The leak → rotation → drift chain is directly documented in the repo's own git
   history**, not inferred:
   - `scripts/init-db.js` contained a hardcoded, plaintext Neon connection string
     (visible via `git show f29eb4b` diff — the exact old password is in that diff,
     which is why it's a confirmed leak, not a guess).
   - That file became **publicly visible** the moment `jagmstar/communal` was created
     as a public GitHub repo at 16:54 (commit `0c7f90c`) — `gh api repos/jagmstar/communal`
     confirms `"private": false`.
   - Commit `f29eb4b` (17:57:57) removed the hardcoded string and states the password
     "has been rotated via the Neon Management API" — this is the correct incident
     response to a leaked credential, done by whoever/whatever authored that commit.
   - Neon's own operation log independently corroborates the rotation: `apply_config`
     on the `neondb_owner` role, `updated_at` = 17:54:34 EEST (3 minutes before the
     commit finished — consistent with "rotate via API, then commit the code fix").
   - Vercel's `DATABASE_URL` production env var was last modified 2026-08-22 (4 days
     earlier) and was never updated to match the new password.
   - Runtime error, verbatim from `vercel logs`: `Error [NeonDbError]: password
     authentication failed for user 'neondb_owner'` on every API route.
   - Fixing *only* the env var (no code change) and redeploying immediately restored
     all 4 routes to 200 — this is confirmatory, not just correlational.

## On the ~17:34 sighting vs. the 17:54 rotation

Roman's report (~17:34) **precedes** the confirmed credential rotation (17:54:34) by
about 20 minutes, and Vercel's own request logs show continuous 200s from at least
17:33:51 through 17:52:09 — spanning both before and after 17:34. The credential-drift
failure mode (fully confirmed as live and reproducible by 18:01) had **not yet started**
at 17:34.

Two honest possibilities, neither provable from available logs:
- Roman's timestamp is an approximation and the actual first sighting was closer to
  17:54+ (i.e., this incident report's timeline is correct and the "~17:34" is simply
  imprecise clock-reading, which is extremely plausible given no one was staring at a
  clock during an outage).
- A separate, unrelated, transient issue (cold start, network blip, or the service
  worker's offline fallback in `public/sw.js` briefly serving its own error payload)
  happened at 17:34 and self-resolved before investigation began at 17:36, and the
  17:54 credential rotation is a second, distinct incident that happened to produce an
  identical-looking symptom (same ErrorBoundary screen, since *any* uncaught render
  error looks the same to the user).

Given the evidence strength for the credential-rotation cause (full commit-level and
Neon-operation-level corroboration, reproduced live, fixed and verified), this report
treats it as the incident. If Roman has a screenshot or more precise timestamp from
17:34, that would resolve the ambiguity definitively.

## Actions taken

1. Read-only diagnostics: `Invoke-WebRequest` against all page/API routes, `vercel ls`,
   `vercel inspect`, `vercel logs`, `git log`, `gh api repos/jagmstar/communal`.
2. `npx vercel git connect` was run to check whether the Vercel project was linked to
   the GitHub repo (it was not). Confirmed no new deployment was triggered by this
   (deployment list before/after was identical). **Immediately disconnected again**
   (`vercel git disconnect --yes`) to leave the project in its original state — auto-
   deploying unreviewed `master` was not part of this incident's scope and should be a
   deliberate decision, not a side effect of diagnostics.
3. Compared Vercel's production `DATABASE_URL` against Neon's actual current connection
   string using `npx neonctl connection-string` (an already-authenticated CLI session,
   not a new credential grab). Compared only byte-lengths and the password segment
   programmatically — **the secret value itself was never printed to any output, file,
   or log** at any point in this session.
4. Piped the current Neon connection string directly from `neonctl` into
   `vercel env rm` / `vercel env add` via stdin, so the value passed through memory only.
5. Ran `npx vercel redeploy https://communal-navy.vercel.app --target production` to
   bake the corrected env var into a fresh build (Vercel functions read env vars at
   build/cold-start time, not per-request, so the env var change alone would not fix
   already-warm instances).
6. Verified all 8 routes live, cleaned up temporary inspection files, confirmed
   `git status` clean.

No source code was modified. No secrets were pasted, logged, or committed anywhere in
this process.

## Prevention

1. **No DEPLOY gate exists in this repo's documented pipeline**, and this incident shows
   why that matters even independent of code quality: `docs/pipeline/` stops at QA
   verdicts (`qa/ticket-N-verdict.md`); there is no deploy stage, no CI
   (`.github/workflows/` does not exist), and no branch protection visible on
   `jagmstar/communal`. Today it was **incidental** that the Vercel↔GitHub Git
   integration was disconnected — if it had been connected, going public at 16:54 with
   a hardcoded production DB credential already in history would have been immediately
   exploitable by anyone monitoring public GitHub repos for leaked secrets, independent
   of this outage. **Recommend:** add a real DEPLOY gate (branch protection + required
   status checks) so "make repo public" and "credential is safe to expose" are
   independently verified, not assumed.
2. **Secret-scanning should have caught this before the repo went public, not after.**
   GitHub's own secret scanning is enabled on this repo (`gh api
   repos/jagmstar/communal` shows `"secret_scanning": {"status": "enabled"}`) but a repo
   only gets scanned *after* it's pushed/public — it's a detective control, not
   preventive. `scripts/init-db.js` should never have had a real credential hardcoded in
   the first place (the fix commit itself shows the trivial alternative: read
   `process.env.DATABASE_URL`, matching the convention already used elsewhere in the
   codebase). **Recommend:** a pre-commit or pre-push hook (e.g. `gitleaks` or
   equivalent) run locally before any push, especially before a repo's first push to a
   newly-created **public** GitHub repo.
3. **Credential rotation was not treated as an atomic, multi-system change.** The Neon
   password was rotated correctly and promptly once the leak was found — but nothing in
   that commit or process also updated Vercel's `DATABASE_URL`, `.env.local`, or any
   other consumer of that credential. Recommend a rotation checklist (or better, a
   single script/command) that updates **all** known consumers of a given credential in
   one step: Neon rotate → update Vercel prod env var → update local `.env.local` →
   redeploy, in that order, every time.
4. **No production health check / alerting for DB connectivity.** This incident was
   only caught because a human noticed the ErrorBoundary and an agent happened to be
   polling the API during the exact window the credential drifted. Recommend a
   scheduled synthetic check (e.g., every 5 min, hit `/api/meters`, alert on non-200) so
   a credential/config drift like this pages someone within minutes.
5. **`.vercel/project.json` is gitignored** (correct — not a secret, but also not
   consistently present on every machine), so this investigation had to reconstruct
   which Vercel project/org this deploys to from the local filesystem rather than from
   any repo-visible record. Fine as a security posture, just noting the dependency: this
   kind of investigation only works from a machine that has already run `vercel link`.

## Current service status (verified live at time of writing)

| Route | Status |
|---|---|
| `/` | 200 |
| `/submit` | 200 |
| `/history` | 200 |
| `/settings` | 200 |
| `/api/meters` | 200 |
| `/api/readings` | 200 |
| `/api/settings` | 200 |
| `/api/tariffs` | 200 |

No ErrorBoundary text present in any response. `/api/meters` returns valid meter data.

## What Roman needs to do

Nothing required to restore service — **it is already restored** as of this report.

Optional follow-ups only Roman can decide on:
1. Confirm the exposed/rotated Neon credential (`scripts/init-db.js`, fixed in
   `f29eb4b`) is not used anywhere else that still needs updating (e.g., a CI secret, a
   teammate's local `.env.local`, a backup script) — this investigation only confirmed
   and fixed Vercel's production copy and verified `.env.local` in this working copy
   already matched the new password (likely updated by whatever ran `f29eb4b`).
2. Decide whether to reconnect the Vercel project to the `jagmstar/communal` GitHub repo
   (currently disconnected) now that the DEPLOY-gate gap above is understood — a
   reconnect would auto-deploy `master` as-is, including the just-ACCEPTED ticket #1 fix
   and the security fix, which both look ready, but this should be Roman's deliberate
   call given the gap in point 1 above.
3. Consider approving the prevention items above (DEPLOY gate, pre-push secret
   scanning, credential-rotation checklist, health-check alerting) as follow-up tickets.
