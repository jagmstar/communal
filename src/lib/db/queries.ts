/**
 * Data Access Layer — Typed Query Functions
 *
 * All database operations for the Communal app.
 * Uses the Neon serverless client and maps snake_case DB rows
 * to camelCase TypeScript interfaces.
 */

import type { Meter, Reading, Tariff, Settings, ServiceType } from "../types";
import { getSql } from "./client";

// ============================================
// Row type mappings (snake_case from DB)
// ============================================

interface MeterRow {
  id: string;
  meter_number: string;
  service_type: ServiceType;
  service_name: string;
  unit: string;
  last_reading: string | null;
  last_reading_date: string | null;
  submit_deadline_day: number;
  submit_window_start: number;
  color: string;
  color_light: string;
  icon: string;
}

interface ReadingRow {
  id: string;
  meter_id: string;
  value: string;
  date: string;
  photo_url: string | null;
  ocr_confidence: number | null;
  ocr_engine: "mlkit" | "azure" | "manual" | "tesseract" | null;
  submitted_to_eps: boolean;
  submitted_at: string | null;
}

interface TariffRow {
  id: string;
  service_type: ServiceType;
  service_name: string;
  value: string;
  unit: string;
  effective_from: string;
  source: string;
}

interface SettingsRow {
  id: number;
  eps_username: string | null;
  eps_account_number: string | null;
  eps_password_encrypted: string | null;
  notification_reading: boolean;
  notification_payment: boolean;
  notification_tariff: boolean;
  notification_anomaly: boolean;
  user_name: string | null;
  user_address: string | null;
}

// ============================================
// Mappers (snake_case → camelCase)
// ============================================

function mapMeter(row: MeterRow): Meter {
  return {
    id: row.id,
    meterNumber: row.meter_number,
    serviceType: row.service_type,
    serviceName: row.service_name,
    unit: row.unit,
    lastReading: row.last_reading !== null ? parseFloat(row.last_reading) : null,
    lastReadingDate: row.last_reading_date,
    submitDeadlineDay: row.submit_deadline_day,
    submitWindowStart: row.submit_window_start,
    color: row.color,
    colorLight: row.color_light,
    icon: row.icon,
  };
}

function mapReading(row: ReadingRow): Reading {
  return {
    id: row.id,
    meterId: row.meter_id,
    value: parseFloat(row.value),
    date: row.date,
    photoUrl: row.photo_url ?? undefined,
    ocrConfidence: row.ocr_confidence ?? 0,
    ocrEngine: row.ocr_engine ?? "manual",
    submittedToEps: row.submitted_to_eps,
    submittedAt: row.submitted_at,
  };
}

function mapTariff(row: TariffRow): Tariff {
  return {
    id: row.id,
    serviceType: row.service_type,
    serviceName: row.service_name,
    value: parseFloat(row.value),
    unit: row.unit,
    effectiveFrom: row.effective_from,
    source: row.source,
  };
}

function mapSettings(row: SettingsRow): Settings {
  return {
    epsUsername: row.eps_username,
    epsAccountNumber: row.eps_account_number,
    notificationReading: row.notification_reading,
    notificationPayment: row.notification_payment,
    notificationTariff: row.notification_tariff,
    notificationAnomaly: row.notification_anomaly,
    userName: row.user_name,
    userAddress: row.user_address,
  };
}

// ============================================
// Query Functions
// ============================================

/**
 * Get all meters from the database.
 * @returns Array of Meter objects
 */
export async function getMeters(): Promise<Meter[]> {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM meters ORDER BY created_at`) as MeterRow[];
  return rows.map((row) => mapMeter(row));
}

/**
 * Get a single meter by ID.
 * @param meterId - The meter UUID
 * @returns The Meter object, or null if not found
 */
export async function getMeterById(meterId: string): Promise<Meter | null> {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM meters WHERE id = ${meterId}`) as MeterRow[];
  return rows.length > 0 ? mapMeter(rows[0]) : null;
}

/**
 * Get readings, optionally filtered by meter ID.
 * @param meterId - Optional meter UUID to filter by
 * @returns Array of Reading objects sorted by date ascending
 */
export async function getReadings(meterId?: string): Promise<Reading[]> {
  const sql = getSql();
  const MAX_READINGS = 500;

  if (meterId) {
    const rows = (await sql`
      SELECT * FROM readings
      WHERE meter_id = ${meterId}
      ORDER BY date DESC
      LIMIT ${MAX_READINGS}
    `) as ReadingRow[];
    return rows.map((row) => mapReading(row)).reverse();
  }

  const rows = (await sql`
    SELECT * FROM readings
    ORDER BY date DESC
    LIMIT ${MAX_READINGS}
  `) as ReadingRow[];
  return rows.map((row) => mapReading(row)).reverse();
}

/**
 * Create a new reading in the database.
 * Also updates the corresponding meter's last_reading and last_reading_date.
 * @param reading - Reading data without the 'id' field (DB generates UUID)
 * @returns The created Reading object with generated ID
 */
export async function createReading(
  reading: Omit<Reading, "id">
): Promise<Reading> {
  const sql = getSql();

  // Use a transaction so reading insert + meter update are atomic
  const results = (await sql.transaction([
    sql`
      INSERT INTO readings (
        meter_id, value, date, photo_url, ocr_confidence,
        ocr_engine, submitted_to_eps, submitted_at
      ) VALUES (
        ${reading.meterId},
        ${reading.value},
        ${reading.date},
        ${reading.photoUrl ?? null},
        ${reading.ocrConfidence},
        ${reading.ocrEngine},
        ${reading.submittedToEps},
        ${reading.submittedAt}
      )
      RETURNING *
    `,
    sql`
      UPDATE meters SET
        last_reading = ${reading.value},
        last_reading_date = ${reading.date}
      WHERE id = ${reading.meterId}
        AND (last_reading_date IS NULL OR last_reading_date <= ${reading.date})
    `,
  ])) as ReadingRow[][];

  const created = mapReading(results[0][0]);

  return created;
}

/**
 * Get all tariffs from the database.
 * @returns Array of Tariff objects
 */
export async function getTariffs(): Promise<Tariff[]> {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM tariffs ORDER BY effective_from DESC`) as TariffRow[];
  return rows.map((row) => mapTariff(row));
}

/**
 * Get the singleton settings row.
 * If no settings row exists, creates one with defaults.
 * @returns Settings object
 */
export async function getSettings(): Promise<Settings> {
  const sql = getSql();

  // Upsert + select in a single query using CTE
  const rows = (await sql`
    WITH upsert AS (
      INSERT INTO settings (id) VALUES (1)
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    )
    SELECT * FROM settings WHERE id = 1
  `) as SettingsRow[];
  return mapSettings(rows[0]);
}

/**
 * Update the singleton settings row with partial data.
 * Only updates provided fields; others remain unchanged.
 * @param settings - Partial settings object with fields to update
 * @returns The updated Settings object
 */
export async function updateSettings(
  settings: Partial<Settings>
): Promise<Settings> {
  const sql = getSql();

  // Ensure the singleton row exists
  await sql`
    INSERT INTO settings (id) VALUES (1)
    ON CONFLICT (id) DO NOTHING
  `;

  // Build a filtered updates object — only include fields that were provided.
  // NOTE: COALESCE prevents setting a field to NULL (clearing it).
  // To clear a field, a dedicated endpoint or different query approach would be needed.
  const updates: Record<string, unknown> = {};
  if (settings.epsUsername !== undefined) updates.eps_username = settings.epsUsername;
  if (settings.epsAccountNumber !== undefined) updates.eps_account_number = settings.epsAccountNumber;
  if (settings.notificationReading !== undefined) updates.notification_reading = settings.notificationReading;
  if (settings.notificationPayment !== undefined) updates.notification_payment = settings.notificationPayment;
  if (settings.notificationTariff !== undefined) updates.notification_tariff = settings.notificationTariff;
  if (settings.notificationAnomaly !== undefined) updates.notification_anomaly = settings.notificationAnomaly;
  if (settings.userName !== undefined) updates.user_name = settings.userName;
  if (settings.userAddress !== undefined) updates.user_address = settings.userAddress;

  const rows = (await sql`
    UPDATE settings SET
      eps_username = COALESCE(${updates.eps_username ?? null}::text, eps_username),
      eps_account_number = COALESCE(${updates.eps_account_number ?? null}::text, eps_account_number),
      notification_reading = COALESCE(${updates.notification_reading ?? null}::boolean, notification_reading),
      notification_payment = COALESCE(${updates.notification_payment ?? null}::boolean, notification_payment),
      notification_tariff = COALESCE(${updates.notification_tariff ?? null}::boolean, notification_tariff),
      notification_anomaly = COALESCE(${updates.notification_anomaly ?? null}::boolean, notification_anomaly),
      user_name = COALESCE(${updates.user_name ?? null}::text, user_name),
      user_address = COALESCE(${updates.user_address ?? null}::text, user_address),
      updated_at = NOW()
    WHERE id = 1
    RETURNING *
  `) as SettingsRow[];

  return mapSettings(rows[0]);
}
