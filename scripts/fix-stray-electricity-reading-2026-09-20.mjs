#!/usr/bin/env node
/**
 * One-off data fix for ticket fix-communal-impossible-bill-forecast (2026-09-20).
 *
 * Root cause of the 39 186,72 ₴ / 9071 кВт·год bogus forecast:
 *
 *   commit fa4fc86 (2026-09-17, "switch web UI to real EPS data, remove fake
 *   seed") deleted the 12 fake-seed readings but deliberately KEPT one real
 *   row, id=5c1f5917-3f87-4b7a-8964-37cd2619b5ef, value=12600, date=2026-09-16
 *   — a reading QA submitted through the app's own /submit flow the day
 *   before. In the SAME commit, meters.last_reading for electricity
 *   (2400786276) was resynced DOWN to 3529 (the real EPS snapshot value,
 *   dated 2026-09-05 — earlier than the kept 12600 row). That resync updated
 *   `meters` but never touched the now-stale `readings` row: the table ended
 *   up with two electricity readings from incompatible sources/baselines
 *   (3529 EPS-snapshot, 12600 ad-hoc QA test value with no ocrEngine/photo
 *   and never itself reconciled against a real prior reading).
 *
 *   computeBillPredictions() then diffs the two most recent `readings` rows
 *   per meter: 12600 - 3529 = 9071 — a delta larger than the meter's own
 *   current cumulative value, which is physically impossible (usage cannot
 *   exceed what the dial shows). That is the exact number Roman saw.
 *
 * Fix: the code-level sanity gate (isPlausibleUsage() in
 * src/lib/calculations.ts) now refuses to render any prediction built from
 * an impossible delta — that alone stops the wrong number reaching the UI,
 * with no DB change required. This script additionally cleans up the
 * inconsistent row so the underlying data (not just the rendered output) is
 * correct: removing 5c1f5917 leaves electricity with exactly one reading
 * (3529, matching meters.last_reading), which correctly renders as "дані
 * уточнюються" until a second REAL reading is captured — rather than a
 * table permanently holding a value inconsistent with its own meter.
 *
 * Safe to re-run: DELETE ... WHERE id = <uuid> is idempotent (no-op on 2nd run).
 *
 * Usage:
 *   node scripts/fix-stray-electricity-reading-2026-09-20.mjs             # apply
 *   node scripts/fix-stray-electricity-reading-2026-09-20.mjs --dry-run   # inspect only
 */
import { neon } from "@neondatabase/serverless";

const STRAY_READING_ID = "5c1f5917-3f87-4b7a-8964-37cd2619b5ef";
const ELECTRICITY_METER_ID = "a1b2c3d4-0003-4000-8000-000000000003";

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const before = await sql.query(
    "SELECT id, meter_id, value, date FROM readings WHERE meter_id = $1 ORDER BY date",
    [ELECTRICITY_METER_ID]
  );
  console.log("Electricity readings BEFORE:", JSON.stringify(before));

  const target = before.find((r) => r.id === STRAY_READING_ID);
  if (!target) {
    console.log(`Row ${STRAY_READING_ID} not present — nothing to do (already fixed or never existed here).`);
    return;
  }

  if (isDryRun) {
    console.log(`DRY RUN: would DELETE readings WHERE id = ${STRAY_READING_ID} (value=${target.value}, date=${target.date})`);
    return;
  }

  const deleted = await sql.query("DELETE FROM readings WHERE id = $1 RETURNING id", [STRAY_READING_ID]);
  console.log("Deleted:", JSON.stringify(deleted));

  const after = await sql.query(
    "SELECT id, meter_id, value, date FROM readings WHERE meter_id = $1 ORDER BY date",
    [ELECTRICITY_METER_ID]
  );
  console.log("Electricity readings AFTER:", JSON.stringify(after));
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
