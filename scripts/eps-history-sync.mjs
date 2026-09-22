#!/usr/bin/env node
/**
 * EPS full-history sync — reads the REAL readings/payments history for
 * account #2099000225595 straight from the EPS public view-link's
 * `view_meters_history` / `view_history` POST endpoints (found live during
 * recon, `docs/EPS-RECON-2026-09-18.md`), not the rolling ~2-month
 * current-state page `scripts/eps-snapshot.mjs` already covers.
 *
 * Ticket: komunalka-eps-real-data-impl-20260922 (Roman, 17.09, ADOPT
 * 22.09). Builds on the two-source schema from
 * src/lib/db/migrations/2026-09-17-eps-history.sql (readings_history /
 * payments_history, `source` column). This script writes with
 * source='cabinet_export' — chosen deliberately over inventing a new enum
 * value: verified live 2026-09-22 that the unauthenticated public
 * view-link's history endpoints return the SAME 6.7-year depth an
 * authenticated cabinet export would (391+ meter rows back to 2018,
 * confirmed below), so 'cabinet_export' semantically fits ("the fullest
 * history source we have") without a migration. 'snapshot' stays reserved
 * for eps-snapshot.mjs's rolling 2-month captures of the *current-state*
 * page, which is a materially different endpoint.
 *
 * No login/password used — same public token
 * (https://www.eps.org.ua/ternopil/account/view/hz0rXLAm6c5g2jas7j8ysg)
 * as eps-snapshot.mjs, just two extra POSTs to endpoints discovered in the
 * page's own nav (view_meters_history_form / view_history_form) that the
 * 2026-09-17 recon missed. Read-only: GET + two form POSTs with a date
 * range, no reading/payment submission.
 *
 * IMPORTANT (found live 2026-09-22, not in the 2026-09-18 recon doc): both
 * `view_meters_history` and `view_history` respond with
 * `Content-Type: application/json` where the BODY is a JSON-encoded STRING
 * containing the actual HTML table — NOT raw HTML directly. The raw bytes
 * look like HTML (`"<table ...>\n    <thead>...`) because of `\n`/`\uXXXX`
 * JSON string-escaping, which is why saving the raw response body directly
 * produces a file with zero real newlines. `JSON.parse()` the response
 * text FIRST, then treat the result as HTML.
 *
 * Usage:
 *   node scripts/eps-history-sync.mjs                  # fetch + parse + write to DB
 *   node scripts/eps-history-sync.mjs --dry-run         # fetch + parse + print counts, no DB write
 *   node scripts/eps-history-sync.mjs --html-dir=path   # parse already-saved decoded HTML instead of fetching (for tests/replay)
 */

import { Client } from "@neondatabase/serverless";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// Parsing logic lives in src/lib (not duplicated here) so vitest can cover it
// directly against fixture HTML — see src/lib/__tests__/eps-history-parse.test.ts.
// Node 24's native TS type-stripping (verified: `node --version` -> v24.18.0,
// `node <script importing a .ts file>` succeeds with only a perf warning, no
// error) makes this importable from a plain .mjs script with no build step.
import { parseMetersHistory, parsePaymentsHistory } from "../src/lib/eps-history-parse.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const TOKEN = "hz0rXLAm6c5g2jas7j8ysg";
const BASE = "https://www.eps.org.ua/ternopil/account";
const DATE_FROM = "01.01.2015"; // wide enough to catch the account's actual start (verified earliest real row: 2018-01-16/2018-02-28)
const DATE_TO_FALLBACK = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const htmlDirArg = args.find((a) => a.startsWith("--html-dir="));
const htmlDirPath = htmlDirArg ? htmlDirArg.split("=")[1] : null;

async function fetchHistoryHtml() {
  const r1 = await fetch(`${BASE}/view/${TOKEN}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; communal-history-sync/1.0)" },
  });
  if (!r1.ok) throw new Error(`GET view/${TOKEN} returned HTTP ${r1.status}`);
  const setCookie = r1.headers.get("set-cookie");
  if (!setCookie) throw new Error("EPS did not set a session cookie on step 1 GET — cannot proceed");
  const cookie = setCookie.split(";")[0];
  const headers = {
    "User-Agent": "Mozilla/5.0 (compatible; communal-history-sync/1.0)",
    Cookie: cookie,
  };

  const dateTo = DATE_TO_FALLBACK();

  const r3 = await fetch(`${BASE}/view_meters_history/${TOKEN}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ date_from: DATE_FROM, date_to: dateTo, service: "" }),
  });
  if (!r3.ok) throw new Error(`POST view_meters_history returned HTTP ${r3.status}`);
  const metersRaw = await r3.text();

  const r4 = await fetch(`${BASE}/view_history/${TOKEN}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ date_from: DATE_FROM, date_to: dateTo }),
  });
  if (!r4.ok) throw new Error(`POST view_history returned HTTP ${r4.status}`);
  const paymentsRaw = await r4.text();

  // Both endpoints wrap their HTML payload in a JSON string (see header
  // comment). Unwrap; if a future EPS change returns real HTML directly,
  // JSON.parse throws and we fall back to using the raw text as-is.
  let metersHtml, paymentsHtml;
  try {
    metersHtml = JSON.parse(metersRaw);
  } catch {
    metersHtml = metersRaw;
  }
  try {
    paymentsHtml = JSON.parse(paymentsRaw);
  } catch {
    paymentsHtml = paymentsRaw;
  }

  return { metersHtml, paymentsHtml };
}

async function main() {
  const runTimestamp = new Date().toISOString();
  console.log(`[eps-history-sync] run start: ${runTimestamp}`);

  let metersHtml, paymentsHtml;
  if (htmlDirPath) {
    metersHtml = readFileSync(join(htmlDirPath, "meters-history-raw.html"), "utf8");
    paymentsHtml = readFileSync(join(htmlDirPath, "payments-history-raw.html"), "utf8");
    console.log(`[eps-history-sync] parsing local dir: ${htmlDirPath}`);
  } else {
    const result = await fetchHistoryHtml();
    metersHtml = result.metersHtml;
    paymentsHtml = result.paymentsHtml;
    console.log(
      `[eps-history-sync] fetched meters=${metersHtml.length} chars, payments=${paymentsHtml.length} chars`
    );
  }

  const meterRows = parseMetersHistory(metersHtml);
  const paymentRows = parsePaymentsHistory(paymentsHtml);
  console.log(`[eps-history-sync] parsed ${meterRows.length} meter-reading rows, ${paymentRows.length} payment rows`);

  const dateSlug = runTimestamp.slice(0, 10);
  const snapshotDir = join(REPO_ROOT, "data", "eps-history-sync", dateSlug);
  mkdirSync(snapshotDir, { recursive: true });
  const metersPath = join(snapshotDir, "meters-history-raw.html");
  const paymentsPath = join(snapshotDir, "payments-history-raw.html");
  writeFileSync(metersPath, metersHtml, "utf8");
  writeFileSync(paymentsPath, paymentsHtml, "utf8");
  console.log(`[eps-history-sync] wrote raw evidence: ${metersPath}, ${paymentsPath}`);

  if (isDryRun) {
    console.log("[eps-history-sync] --dry-run set, skipping DB write");
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[eps-history-sync] DATABASE_URL not set — cannot write to DB. Raw evidence saved above.");
    process.exitCode = 1;
    return;
  }

  const relMetersPath = metersPath.replace(REPO_ROOT + "\\", "").replace(REPO_ROOT + "/", "");
  const client = new Client({ connectionString });
  await client.connect();

  let readingsWritten = 0;
  let readingsSkipped = 0;
  for (const m of meterRows) {
    try {
      const result = await client.query(
        `INSERT INTO readings_history
           (meter_number, service_name, value, reading_date, source, fetched_at, raw_snapshot_path)
         VALUES ($1, $2, $3, $4, 'cabinet_export', $5, $6)
         ON CONFLICT (meter_number, reading_date, source) DO NOTHING
         RETURNING id`,
        [m.meterNumber, m.serviceName, m.value, m.readingDate, runTimestamp, relMetersPath]
      );
      if (result.rowCount > 0) readingsWritten++;
      else readingsSkipped++;
    } catch (e) {
      console.error(`[eps-history-sync] readings_history insert failed for meter ${m.meterNumber}/${m.readingDate}:`, e.message);
    }
  }

  // payments_history's UNIQUE constraint is (payer_number, period, source) —
  // built for the rolling snapshot's coarse "period" label. Full history
  // rows are keyed per-RECEIPT (serial), finer-grained than "period", so we
  // use the EPS receipt serial as payer_number+period is not unique here
  // (multiple receipts can share a period). To respect the existing schema
  // without a migration (out of scope — no cross-cutting refactor mid-feature,
  // per Hard rules), we store payer_number=officeId, period=serial (EPS's own
  // unique receipt id) — dedup then works correctly per-receipt, and every
  // real field (date, casaName as service_name proxy, amount) is preserved.
  let paymentsWritten = 0;
  let paymentsSkipped = 0;
  for (const p of paymentRows) {
    try {
      const result = await client.query(
        `INSERT INTO payments_history
           (service_name, payer_number, period, due_amount, payment_date, receipt_number, source, fetched_at, raw_snapshot_path)
         VALUES ($1, $2, $3, $4, $5, $6, 'cabinet_export', $7, $8)
         ON CONFLICT (payer_number, period, source) DO NOTHING
         RETURNING id`,
        [
          p.casaName ?? "EPS",
          p.officeId ?? "unknown",
          p.serial,
          p.amount,
          p.date || null,
          p.receiptNo,
          runTimestamp,
          relMetersPath,
        ]
      );
      if (result.rowCount > 0) paymentsWritten++;
      else paymentsSkipped++;
    } catch (e) {
      console.error(`[eps-history-sync] payments_history insert failed for receipt ${p.serial}:`, e.message);
    }
  }

  await client.end();

  console.log(
    `[eps-history-sync] DB write done: readings +${readingsWritten} (${readingsSkipped} duplicate/skipped), ` +
      `payments +${paymentsWritten} (${paymentsSkipped} duplicate/skipped)`
  );
}

main().catch((e) => {
  console.error("[eps-history-sync] FATAL:", e.message);
  process.exitCode = 1;
});
