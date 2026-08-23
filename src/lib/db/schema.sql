-- Communal — Database Schema & Seed Migration
-- Neon PostgreSQL (serverless)
-- Created: 2026-08-22
-- Based on AD-3 (Architecture Decisions) and US-12 (PRD)

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Table: meters
-- ============================================
CREATE TABLE IF NOT EXISTS meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_number TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('water', 'electricity', 'gas', 'heating', 'osbb', 'other')),
  service_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  last_reading NUMERIC,
  last_reading_date DATE,
  submit_deadline_day INTEGER NOT NULL,
  submit_window_start INTEGER NOT NULL,
  color TEXT NOT NULL,
  color_light TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: readings
-- ============================================
CREATE TABLE IF NOT EXISTS readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID REFERENCES meters(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  date DATE NOT NULL,
  photo_url TEXT,
  ocr_confidence REAL,
  ocr_engine TEXT CHECK (ocr_engine IN ('mlkit', 'azure', 'manual', 'tesseract')),
  submitted_to_eps BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying by meter and date
CREATE INDEX IF NOT EXISTS idx_readings_meter_id_date ON readings(meter_id, date);

-- Index for querying all readings sorted by date (no meter filter)
CREATE INDEX IF NOT EXISTS idx_readings_date ON readings(date DESC);

-- Index for tariff lookups by service type
CREATE INDEX IF NOT EXISTS idx_tariffs_service_type ON tariffs(service_type);

-- ============================================
-- Table: tariffs
-- ============================================
CREATE TABLE IF NOT EXISTS tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  effective_from DATE NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: settings (singleton pattern — single row, id=1)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  eps_username TEXT,
  eps_account_number TEXT,
  eps_password_encrypted TEXT,
  notification_reading BOOLEAN DEFAULT TRUE,
  notification_payment BOOLEAN DEFAULT TRUE,
  notification_tariff BOOLEAN DEFAULT FALSE,
  notification_anomaly BOOLEAN DEFAULT TRUE,
  user_name TEXT,
  user_address TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEED DATA
-- ============================================

-- Seed meters (from mockData.ts)
INSERT INTO meters (id, meter_number, service_type, service_name, unit, last_reading, last_reading_date, submit_deadline_day, submit_window_start, color, color_light, icon) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', '14091126', 'water', 'Вода (гаряча)', 'м³', 182.34, '2026-07-31', 31, 25, '#0ea5e9', '#e0f2fe', 'droplet'),
  ('a1b2c3d4-0002-4000-8000-000000000002', '14097821', 'water', 'Вода (холодна)', 'м³', 345.67, '2026-07-31', 31, 25, '#0ea5e9', '#e0f2fe', 'droplet'),
  ('a1b2c3d4-0003-4000-8000-000000000003', '2400786276', 'electricity', 'Електроенергія', 'кВт·год', 12453, '2026-07-31', 3, 28, '#f59e0b', '#fef3c7', 'zap'),
  ('a1b2c3d4-0004-4000-8000-000000000004', '98040', 'gas', 'Газ', 'м³', 5678, '2026-07-31', 5, 1, '#f97316', '#ffedd5', 'flame')
ON CONFLICT (id) DO NOTHING;

-- Seed readings (from mockData.ts — 12 readings, 3 per meter)
INSERT INTO readings (id, meter_id, value, date, ocr_confidence, ocr_engine, submitted_to_eps, submitted_at) VALUES
  -- Water hot (meter 1)
  ('b2c3d4e5-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 178.12, '2026-05-31', 0.98, 'mlkit', true, '2026-05-31T10:00:00'),
  ('b2c3d4e5-0002-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000001', 180.23, '2026-06-30', 0.95, 'mlkit', true, '2026-06-30T10:00:00'),
  ('b2c3d4e5-0003-4000-8000-000000000003', 'a1b2c3d4-0001-4000-8000-000000000001', 182.34, '2026-07-31', 0.97, 'mlkit', true, '2026-07-31T10:00:00'),
  -- Water cold (meter 2)
  ('b2c3d4e5-0004-4000-8000-000000000004', 'a1b2c3d4-0002-4000-8000-000000000002', 338.45, '2026-05-31', 0.96, 'mlkit', true, '2026-05-31T10:00:00'),
  ('b2c3d4e5-0005-4000-8000-000000000005', 'a1b2c3d4-0002-4000-8000-000000000002', 342.01, '2026-06-30', 0.99, 'mlkit', true, '2026-06-30T10:00:00'),
  ('b2c3d4e5-0006-4000-8000-000000000006', 'a1b2c3d4-0002-4000-8000-000000000002', 345.67, '2026-07-31', 0.94, 'mlkit', true, '2026-07-31T10:00:00'),
  -- Electricity (meter 3)
  ('b2c3d4e5-0007-4000-8000-000000000007', 'a1b2c3d4-0003-4000-8000-000000000003', 11890, '2026-05-31', 0.92, 'mlkit', true, '2026-05-31T10:00:00'),
  ('b2c3d4e5-0008-4000-8000-000000000008', 'a1b2c3d4-0003-4000-8000-000000000003', 12167, '2026-06-30', 0.96, 'mlkit', true, '2026-06-30T10:00:00'),
  ('b2c3d4e5-0009-4000-8000-000000000009', 'a1b2c3d4-0003-4000-8000-000000000003', 12453, '2026-07-31', 0.98, 'mlkit', true, '2026-07-31T10:00:00'),
  -- Gas (meter 4)
  ('b2c3d4e5-0010-4000-8000-000000000010', 'a1b2c3d4-0004-4000-8000-000000000004', 5589, '2026-05-31', 0.91, 'mlkit', true, '2026-05-31T10:00:00'),
  ('b2c3d4e5-0011-4000-8000-000000000011', 'a1b2c3d4-0004-4000-8000-000000000004', 5634, '2026-06-30', 0.93, 'mlkit', true, '2026-06-30T10:00:00'),
  ('b2c3d4e5-0012-4000-8000-000000000012', 'a1b2c3d4-0004-4000-8000-000000000004', 5678, '2026-07-31', 0.97, 'mlkit', true, '2026-07-31T10:00:00')
ON CONFLICT (id) DO NOTHING;

-- Seed tariffs (from mockData.ts — 4 tariffs)
INSERT INTO tariffs (id, service_type, service_name, value, unit, effective_from, source) VALUES
  ('c3d4e5f6-0001-4000-8000-000000000001', 'water', 'Вода', 35.20, '₴/м³', '2026-01-01', 'eps'),
  ('c3d4e5f6-0002-4000-8000-000000000002', 'electricity', 'Електроенергія', 4.32, '₴/кВт·год', '2026-01-01', 'nerc'),
  ('c3d4e5f6-0003-4000-8000-000000000003', 'gas', 'Газ (розподіл)', 7.99, '₴/м³', '2026-01-01', 'eps'),
  ('c3d4e5f6-0004-4000-8000-000000000004', 'gas', 'Нафтогаз (постачання)', 13.87, '₴/м³', '2026-01-01', 'naftogaz')
ON CONFLICT (id) DO NOTHING;

-- Seed settings (singleton row)
INSERT INTO settings (id, eps_username, eps_account_number, notification_reading, notification_payment, notification_tariff, notification_anomaly, user_name, user_address) VALUES
  (1, 'roman.krepych', '2099000225595', true, true, false, true, 'Роман Кречих', 'м. Тернопіль')
ON CONFLICT (id) DO NOTHING;
