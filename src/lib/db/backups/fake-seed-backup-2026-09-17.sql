-- BACKUP of fake seed data, taken 2026-09-17 before switching web/APK UI to
-- read from readings_history/payments_history (real EPS snapshot data)
-- instead of meters/readings (fake seed from src/lib/db/schema.sql).
--
-- Ticket: komunalka-eps-real-data-20260917b (Roman, 17.09 09:55).
-- Klara's ruling 2026-09-17: switch UI to real (rolling 2-month) data now,
-- backup fake seed first, empty-state for periods with no data yet.
--
-- Restore procedure if ever needed: run this file against Neon with psql or
-- @neondatabase/serverless — it re-inserts the original fake rows with
-- ON CONFLICT DO NOTHING (safe to re-run).

-- meters (4 rows, fake data from mockData.ts era)
INSERT INTO meters (id, meter_number, service_type, service_name, unit, last_reading, last_reading_date, submit_deadline_day, submit_window_start, color, color_light, icon) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', '14091126', 'water', 'Вода (гаряча)', 'м³', 182.34, '2026-07-31', 31, 25, '#0ea5e9', '#e0f2fe', 'droplet'),
  ('a1b2c3d4-0002-4000-8000-000000000002', '14097821', 'water', 'Вода (холодна)', 'м³', 345.67, '2026-07-31', 31, 25, '#0ea5e9', '#e0f2fe', 'droplet'),
  ('a1b2c3d4-0003-4000-8000-000000000003', '2400786276', 'electricity', 'Електроенергія', 'кВт·год', 12453, '2026-07-31', 3, 28, '#f59e0b', '#fef3c7', 'zap'),
  ('a1b2c3d4-0004-4000-8000-000000000004', '98040', 'gas', 'Газ', 'м³', 5678, '2026-07-31', 5, 1, '#f97316', '#ffedd5', 'flame')
ON CONFLICT (id) DO NOTHING;

-- readings (13 rows: 12 original fake seed + 1 real row QA submitted 2026-09-16
-- via the app's own submit flow — that one row is REAL user action, not fake
-- seed data, but is captured here too since it lived in the same table)
INSERT INTO readings (id, meter_id, value, date, ocr_confidence, ocr_engine, submitted_to_eps, submitted_at) VALUES
  ('b2c3d4e5-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 178.12, '2026-05-31', 0.98, 'mlkit', true, '2026-05-31T10:00:00'),
  ('b2c3d4e5-0002-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000001', 180.23, '2026-06-30', 0.95, 'mlkit', true, '2026-06-30T10:00:00'),
  ('b2c3d4e5-0003-4000-8000-000000000003', 'a1b2c3d4-0001-4000-8000-000000000001', 182.34, '2026-07-31', 0.97, 'mlkit', true, '2026-07-31T10:00:00'),
  ('b2c3d4e5-0004-4000-8000-000000000004', 'a1b2c3d4-0002-4000-8000-000000000002', 338.45, '2026-05-31', 0.96, 'mlkit', true, '2026-05-31T10:00:00'),
  ('b2c3d4e5-0005-4000-8000-000000000005', 'a1b2c3d4-0002-4000-8000-000000000002', 342.01, '2026-06-30', 0.99, 'mlkit', true, '2026-06-30T10:00:00'),
  ('b2c3d4e5-0006-4000-8000-000000000006', 'a1b2c3d4-0002-4000-8000-000000000002', 345.67, '2026-07-31', 0.94, 'mlkit', true, '2026-07-31T10:00:00'),
  ('b2c3d4e5-0007-4000-8000-000000000007', 'a1b2c3d4-0003-4000-8000-000000000003', 11890, '2026-05-31', 0.92, 'mlkit', true, '2026-05-31T10:00:00'),
  ('b2c3d4e5-0008-4000-8000-000000000008', 'a1b2c3d4-0003-4000-8000-000000000003', 12167, '2026-06-30', 0.96, 'mlkit', true, '2026-06-30T10:00:00'),
  ('b2c3d4e5-0009-4000-8000-000000000009', 'a1b2c3d4-0003-4000-8000-000000000003', 12453, '2026-07-31', 0.98, 'mlkit', true, '2026-07-31T10:00:00'),
  ('b2c3d4e5-0010-4000-8000-000000000010', 'a1b2c3d4-0004-4000-8000-000000000004', 5589, '2026-05-31', 0.91, 'mlkit', true, '2026-05-31T10:00:00'),
  ('b2c3d4e5-0011-4000-8000-000000000011', 'a1b2c3d4-0004-4000-8000-000000000004', 5634, '2026-06-30', 0.93, 'mlkit', true, '2026-06-30T10:00:00'),
  ('b2c3d4e5-0012-4000-8000-000000000012', 'a1b2c3d4-0004-4000-8000-000000000004', 5678, '2026-07-31', 0.97, 'mlkit', true, '2026-07-31T10:00:00'),
  ('5c1f5917-3f87-4b7a-8964-37cd2619b5ef', 'a1b2c3d4-0003-4000-8000-000000000003', 12600, '2026-09-16', NULL, NULL, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- tariffs (4 rows — KEPT LIVE, not fake: no EPS tariff API/history exists,
-- these are the real published NERC/EPS/Naftogaz rates as of 2026-01-01,
-- used only for cost estimates, not shown as "history"). Included here only
-- for completeness of the pre-migration snapshot.
INSERT INTO tariffs (id, service_type, service_name, value, unit, effective_from, source) VALUES
  ('c3d4e5f6-0001-4000-8000-000000000001', 'water', 'Вода', 35.20, '₴/м³', '2026-01-01', 'eps'),
  ('c3d4e5f6-0002-4000-8000-000000000002', 'electricity', 'Електроенергія', 4.32, '₴/кВт·год', '2026-01-01', 'nerc'),
  ('c3d4e5f6-0003-4000-8000-000000000003', 'gas', 'Газ (розподіл)', 7.99, '₴/м³', '2026-01-01', 'eps'),
  ('c3d4e5f6-0004-4000-8000-000000000004', 'gas', 'Нафтогаз (постачання)', 13.87, '₴/м³', '2026-01-01', 'naftogaz')
ON CONFLICT (id) DO NOTHING;
