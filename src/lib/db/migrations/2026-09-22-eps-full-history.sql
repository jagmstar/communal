-- Communal — EPS full-history sync columns (payment_date, receipt_serial)
-- Ticket: komunalka-eps-real-data-impl-20260922 (Roman, 17.09, ADOPT 22.09)
--
-- The 2026-09-17 payments_history schema keyed rows on (payer_number,
-- period, source) where `period` is EPS's coarse "Місяць" label
-- (e.g. "Серпня") — fine for the rolling ~2-month snapshot
-- (scripts/eps-snapshot.mjs), where at most one row per service per month
-- exists. The full-history endpoint discovered 2026-09-22
-- (view_history/<token>, see scripts/eps-history-sync.mjs) returns one row
-- PER RECEIPT — multiple receipts can land in the same EPS "period", so a
-- per-receipt-unique key is required, not a schema-breaking rename. Two
-- additive columns close that gap without touching the 2026-09-17 columns
-- or its existing UNIQUE constraint (payer_number/period stay populated
-- with officeId/serial for cabinet_export rows — see eps-history-sync.mjs
-- comment — so old queries against those two columns keep working; this
-- migration only ADDS the exact real-world date and human-readable receipt
-- number the ticket's acceptance bar needs, so a report or UI can show a
-- real calendar date per payment, not just an EPS month label).

ALTER TABLE payments_history
  ADD COLUMN IF NOT EXISTS payment_date DATE,      -- exact date from the receipt (view_history's own 'Дата' column), NULL for pre-existing rolling-snapshot rows that never had one
  ADD COLUMN IF NOT EXISTS receipt_number TEXT;    -- EPS 'Номер квитанції' — human-readable receipt id, separate from the dedup key stored in `period` for cabinet_export rows

CREATE INDEX IF NOT EXISTS idx_payments_history_payment_date ON payments_history(payment_date DESC);
