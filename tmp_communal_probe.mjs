#!/usr/bin/env node
/**
 * Acceptance probe for fix-communal-impossible-bill-forecast (2026-09-20).
 *
 * Runs the REAL production calculation functions (src/lib/calculations.ts,
 * via tsx) against the CURRENT live Neon data, and asserts:
 *   1. No BillPrediction's usage exceeds its meter's own last reading.
 *   2. "Разом" (computeTotalPredictedBill) never contradicts any rendered
 *      "Деталі рахунку" position (dataSufficient rows only).
 *   3. The specific bad input that produced 39 186,72 ₴ is now rejected
 *      (dataSufficient=false), proven inline without touching the DB.
 *
 * Usage: node --import tsx tmp_communal_probe.mjs   (requires DATABASE_URL)
 */
import { neon } from "@neondatabase/serverless";
import { computeBillPredictions, computeTotalPredictedBill, isPlausibleUsage } from "./src/lib/calculations.ts";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const meterRows = await sql.query(
    "SELECT id, meter_number, service_type, service_name, unit, last_reading, last_reading_date FROM meters ORDER BY created_at"
  );
  const meters = meterRows.map((r) => ({
    id: r.id,
    meterNumber: r.meter_number,
    serviceType: r.service_type,
    serviceName: r.service_name,
    unit: r.unit,
    lastReading: r.last_reading !== null ? parseFloat(r.last_reading) : null,
    lastReadingDate: r.last_reading_date,
    submitDeadlineDay: 1,
    submitWindowStart: 1,
    color: "#000",
    colorLight: "#fff",
    icon: "receipt",
  }));

  const readingRows = await sql.query("SELECT id, meter_id, value, date FROM readings ORDER BY date");
  const readings = readingRows.map((r) => ({
    id: r.id,
    meterId: r.meter_id,
    value: parseFloat(r.value),
    date: r.date,
    ocrConfidence: 0,
    ocrEngine: "manual",
    submittedToEps: false,
    submittedAt: null,
  }));

  const tariffRows = await sql.query("SELECT id, service_type, service_name, value, unit, effective_from, source FROM tariffs");
  const tariffs = tariffRows.map((r) => ({
    id: r.id,
    serviceType: r.service_type,
    serviceName: r.service_name,
    value: parseFloat(r.value),
    unit: r.unit,
    effectiveFrom: r.effective_from,
    source: r.source,
  }));

  const predictions = computeBillPredictions(meters, readings, tariffs);
  const total = computeTotalPredictedBill(predictions);

  console.log("=== LIVE PREDICTIONS ===");
  for (const p of predictions) {
    const meter = meters.find((m) => m.id === p.meterId);
    console.log(
      `${p.serviceName}: dataSufficient=${p.dataSufficient} usage=${p.predictedUsage} amount=${p.predictedAmount} (meter.lastReading=${meter?.lastReading})`
    );
  }
  console.log(`Разом (computeTotalPredictedBill) = ${total.toFixed(2)} ₴`);

  // Check 1: no usage exceeds the meter's own last reading.
  let check1 = true;
  for (const p of predictions) {
    const meter = meters.find((m) => m.id === p.meterId);
    if (p.dataSufficient && p.predictedUsage !== null && meter?.lastReading != null) {
      if (p.predictedUsage > meter.lastReading) {
        console.error(`FAIL check1: ${p.serviceName} usage ${p.predictedUsage} > meter.lastReading ${meter.lastReading}`);
        check1 = false;
      }
    }
  }
  console.log(`Check 1 (usage <= meter's own reading): ${check1 ? "PASS" : "FAIL"}`);

  // Check 2: "Разом" equals the sum of exactly the dataSufficient rows —
  // no position silently contradicts the total.
  const expectedTotal = predictions
    .filter((p) => p.dataSufficient)
    .reduce((s, p) => s + (p.predictedAmount ?? 0), 0);
  const check2 = Math.abs(expectedTotal - total) < 0.01;
  console.log(`Check 2 (Разом matches sum of shown positions): ${check2 ? "PASS" : "FAIL"}`);

  // Check 3: reproduce the exact bad input (12600 vs 3529) and confirm it's rejected.
  const check3 = isPlausibleUsage(9071, 3529) === false && isPlausibleUsage(150, 12500) === true;
  console.log(`Check 3 (sanity gate rejects the 9071/3529 shape, accepts normal deltas): ${check3 ? "PASS" : "FAIL"}`);

  const allPass = check1 && check2 && check3;
  console.log(allPass ? "\nACCEPTANCE: PASS" : "\nACCEPTANCE: FAIL");
  return allPass;
}

main()
  .then((allPass) => {
    process.exitCode = allPass ? 0 : 1;
  })
  .catch((e) => {
    console.error("ERR", e.message);
    process.exitCode = 1;
  });
