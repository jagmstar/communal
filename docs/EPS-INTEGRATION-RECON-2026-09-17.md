# EPS integration recon — real data instead of fake

- **Ticket:** `komunalka-eps-real-data-20260917b` (Roman, 17.09 09:55, verbatim in
  `.sdlc-state/cycle-queue/in-flight/20260917-200941-komunalka-eps-real-data-20260917b.md`)
- **Role:** senior-fullstack-dev
- **Date:** 2026-09-17

## What Roman asked for

> «ти ж мала раз витягнути всі показники що я подавав і всі оплати. Потім це в
> базі зберігати. Регулярно дивитись чи є нове — раз в місяць.»

Three parts: (1) import ALL history of readings + payments from EPS, (2) store
in DB, replace fake data, (3) monthly sync job.

## Recon: how does EPS actually give us data? (done BEFORE writing import code, per instruction)

### What exists, unauthenticated

A public read-only view-link for Roman's account is already referenced in the
codebase (`src/app/settings/page.tsx:278`):

```
https://www.eps.org.ua/ternopil/account/view/hz0rXLAm6c5g2jas7j8ysg
```

Fetched live twice, ~30s apart, 2026-09-17T17:36Z:

- **Payments table** (`class="account-table account-table-readonly"`): 7 rows
  — Вода, ОСББ, Електропостач, Газ розподіл, Нафтогаз, Газ техобсл.,
  КолумбусТ. Columns: Борг, Оплачено минулого місяця, Нараховано, Монетизована
  субсидія-пільга, До оплати, Оплачено цього місяця, Залишок. Each row is
  labeled with a "Місяць" (e.g. "Серпня"/"Вересня") but **no year**.
- **Meters table** (`class="meters-table"`): 4 meters (98040 gas, 14091126
  water, 14097821 water, 2400786276 electricity) with a hidden
  `<input id="meter_date">` giving EPS's own as-of date for the
  `organization_reading` value.

**Confirmed the window is rolling, not fixed history**: the two fetches 30s
apart returned DIFFERENT "Місяць" values (Липня/Серпня → Серпня/Вересня) with
no query parameter (`?month=`, `?year=`, `?date=`) able to pin an older
period — they're silently ignored. There is no `/history`, `/payments`, or
`/api/*` path on this host; everything else 404s or returns the same page.

**Conclusion**: this view-link is a live "current state" snapshot with an
effective ~2-month lookback, NOT an archive. Every month it is not captured
is a month of history **permanently lost** once it rolls out of the window.

### What does NOT exist (yet)

- **EPS cabinet credentials.** Grepped `F:\dt-home\secrets\` for
  `eps|комунал|2099000225595|krepych` (2026-09-17) — no EPS-specific config
  file exists. Confirmed with Клара (COO twin, `agent-3f8d3ae3-...`) via
  `SendAgentMessage`, who independently confirmed no `eps-config.json` is
  recorded in her memory either.
- **Full history export.** Only reachable via the authenticated cabinet's
  own "Історія"/"Показники"/"Оплати" sections — format unknown until we can
  actually log in and look, or Roman exports it himself.

### Decision (Клара, COO twin, escalation authority per contract "money/external = Roman only")

Per company rule, a twin does not receive/use live payment-account
credentials — Клара's explicit ruling. Two-track plan instead of blocking:

1. **Start capturing NOW** via the public view-link on a schedule — builds
   our own history going forward, independent of ever getting cabinet
   access. Implemented this session (see below).
2. **Backfill full history LATER** once Roman either hands over credentials
   for a one-time authenticated export, or does the export himself and
   drops a CSV. Import tooling for that is built and tested this session,
   waiting on real data (see below).

## What was built and RUN this session (not just written)

| Artifact | Path | Verified |
|---|---|---|
| History schema (2 tables) | `src/lib/db/migrations/2026-09-17-eps-history.sql` | Applied to live Neon DB — `to_regclass` confirms both tables exist |
| Snapshot scraper | `scripts/eps-snapshot.mjs` | Run for real (not dry-run) against the live EPS view-link — see run log below |
| CSV import scaffold (for future cabinet_export) | `scripts/eps-import-csv.mjs` | Dry-run tested against a synthetic 2-row CSV + mapping — parsed and printed correctly |
| Recurring cron (1st + 15th monthly) | `letta cron` id `3eb31b82-bc91-4984-b0dd-5d8105b27e4f` | Re-read via `letta cron get` after creation — prompt/description Cyrillic intact, `conversation_id: conv-aa1cb587-5a5d-44e5-a68d-9f3948f3082f` explicit (not default "new") |

### First real snapshot run

```
[eps-snapshot] run start: 2026-09-17T17:36:41.216Z
[eps-snapshot] fetched 13922 bytes from EPS view-link
[eps-snapshot] parsed 7 payment rows, 4 meter rows
[eps-snapshot] wrote raw HTML: F:\communal\data\eps-snapshots\2026-09-17\raw.html
[eps-snapshot] wrote parsed JSON: F:\communal\data\eps-snapshots\2026-09-17\parsed.json
[eps-snapshot] DB write done: readings +4 (0 duplicate/skipped), payments +7 (0 duplicate/skipped)
```

Verified by querying Neon directly afterward: `readings_history` has 4 rows,
`payments_history` has 7 rows, all `source='snapshot'`.

## Two-source schema design

`readings_history` / `payments_history` both carry a `source` column
(`snapshot | cabinet_export | manual`) and a unique constraint on
`(identifier, period_or_date, source)` — so today's snapshot rows and a
future authenticated cabinet backfill can coexist without conflicting or
double-counting, and a re-run of the same snapshot period is a no-op
(`ON CONFLICT DO NOTHING`), not a duplicate.

## What is explicitly NOT done yet (open, blocking full "вся історія")

- **No full historical backfill.** Only what the rolling 2-month view-link
  showed today is captured. Roman's actual full submission/payment history
  (potentially years) is NOT in the DB yet — this requires either his
  credentials for a one-time authenticated export, or him doing the export
  himself.
- **Web/APK UI still reads the OLD `meters`/`readings`/`tariffs` tables**
  (with the fake seed data from `src/lib/db/schema.sql`), not the new
  `readings_history`/`payments_history` tables. Wiring the UI to the new
  history tables and removing the fake seed rows is the next task — not
  done in this dispatch, which was scoped to "recon + start capturing +
  don't touch fake data destructively without a plan" per the ticket's own
  phrasing ("Дослідити... recon без запису" as step 1).
- **No READ-only guardrail test** proving the scraper can never write to EPS
  (it only ever issues a GET to a `/view/` path; there is no code path to
  any POST/form-submit endpoint — but no automated test asserts this).

## Open question (blocks full acceptance criterion)

Roman's acceptance is "Роман відкриває веб → бачить СВОЇ реальні показники й
оплати за всю історію" — the ~2-month rolling window we can now capture is
real data (not fake), but it is not "вся історія" yet. Escalated to Клара
(COO), her call: ask Roman this evening (21:00 report) for EPS login/password
OR a self-service export from Історія/Показники/Оплати sections. Until one of
those arrives, `cabinet_export` rows stay empty and web/APK cannot yet show
full history — only the growing snapshot history from today forward.
