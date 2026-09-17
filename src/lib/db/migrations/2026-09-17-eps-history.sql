-- Communal — EPS real-data history migration
-- Ticket: komunalka-eps-real-data-20260917b (Roman, 17.09 09:55)
--
-- Adds durable history tables fed from TWO sources that will co-exist:
--   1. "snapshot"       — our own periodic scrape of the public read-only
--                         EPS view-link (https://www.eps.org.ua/ternopil/account/view/<token>).
--                         This link only ever shows a rolling ~2-month window
--                         (verified 2026-09-17, see docs/EPS-INTEGRATION-RECON-2026-09-17.md),
--                         so a snapshot taken today is the ONLY way to keep
--                         a month once it rolls out of that window. Runs via
--                         scripts/eps-snapshot.mjs on a schedule (1st + 15th).
--   2. "cabinet_export" — a one-time authenticated backfill of full history,
--                         pending EPS credentials from Roman (blocked as of
--                         this migration — see recon doc "Open question").
--   3. "manual"          — anything a human enters by hand as a stopgap.
--
-- Both new tables carry a `source` column so rows from different origins can
-- coexist without conflict, and a `fetched_at`/`written_at` timestamp so we
-- always know when WE captured the data (distinct from the period the data
-- describes) — required because the EPS site itself gives us no stable
-- "as of" timestamp for the account-charges table (only a "Місяць" label per
-- row, which we normalize into `period` below).

CREATE TABLE IF NOT EXISTS readings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_number TEXT NOT NULL,           -- EPS meter_id, e.g. '98040', '14091126' (matches meters.meter_number)
  service_name TEXT NOT NULL,           -- EPS service label, e.g. 'Газ розподіл', 'Вода'
  value NUMERIC NOT NULL,               -- 'organization_reading' — the reading EPS has on file for this meter
  reading_date DATE,                    -- EPS's own 'meter_date' hidden field when present (as-of date EPS attributes the value to); NULL if EPS didn't supply one
  source TEXT NOT NULL CHECK (source IN ('snapshot', 'cabinet_export', 'manual')),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- when WE captured this row (always known, unlike reading_date)
  raw_snapshot_path TEXT,               -- relative path to the raw HTML/JSON this row was parsed from, for audit (snapshot source only)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevents a repeated snapshot of the SAME EPS-reported value for the same
  -- meter+date from creating duplicate rows (Klara requirement 2026-09-17:
  -- "унікальний ключ (period+meter), щоб повторний снапшот не плодив дублі").
  -- reading_date can be NULL (EPS sometimes omits meter_date), so NULLS are
  -- allowed to repeat per Postgres's standard NULL != NULL semantics; dedup
  -- for undated rows is instead handled by the importer comparing
  -- (meter_number, value, source) before insert — see eps-snapshot.mjs.
  UNIQUE (meter_number, reading_date, source)
);

CREATE INDEX IF NOT EXISTS idx_readings_history_meter ON readings_history(meter_number, reading_date DESC);

CREATE TABLE IF NOT EXISTS payments_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,           -- EPS service label, e.g. 'Вода', 'Електропостач'
  payer_number TEXT NOT NULL,           -- EPS 'Номер платника' (account/subscriber number for this service)
  period TEXT NOT NULL,                 -- EPS 'Місяць' label as given, e.g. 'Серпня', 'Вересня' (Ukrainian genitive month name — EPS's own format, not normalized, to avoid guessing a year that EPS doesn't state)
  debt_before NUMERIC,                  -- 'Борг'
  paid_last_month NUMERIC,              -- 'Оплачено минулого місяця'
  charged NUMERIC,                      -- 'Нараховано'
  subsidy NUMERIC,                      -- 'Монетизована субсидія-пільга'
  due_amount NUMERIC,                   -- 'До оплати'
  paid_this_month NUMERIC,              -- 'Оплачено цього місяця'
  balance NUMERIC,                      -- 'Залишок'
  source TEXT NOT NULL CHECK (source IN ('snapshot', 'cabinet_export', 'manual')),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_snapshot_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Same dedup rationale as readings_history: a snapshot re-run within the
  -- rolling window will re-report the same (payer_number, period) row from
  -- EPS; without this constraint every 1st/15th cron run would double it.
  UNIQUE (payer_number, period, source)
);

CREATE INDEX IF NOT EXISTS idx_payments_history_payer ON payments_history(payer_number, period);
