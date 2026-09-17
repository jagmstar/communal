#!/usr/bin/env node
/**
 * EPS public view-link snapshot scraper.
 *
 * Ticket: komunalka-eps-real-data-20260917b (Roman, 17.09 09:55).
 * Background: the authenticated EPS cabinet (eps.org.ua/ternopil) is the only
 * place with FULL history of readings/payments, but we do not have Roman's
 * EPS login credentials (confirmed absent from F:\dt-home\secrets\, grepped
 * 2026-09-17 — see docs/EPS-INTEGRATION-RECON-2026-09-17.md). What we DO have
 * is a public, unauthenticated, READ-ONLY view-link for his account:
 *
 *   https://www.eps.org.ua/ternopil/account/view/hz0rXLAm6c5g2jas7j8ysg
 *
 * This link only ever shows a ROLLING ~2-month window (verified by fetching
 * it twice a few minutes apart on 2026-09-17: the "Місяць" column shifted
 * from Липня/Серпня to Серпня/Вересня with no query param able to pin an
 * older month — ?month=/?year=/?date= are all silently ignored). That means
 * every month we do NOT snapshot is a month of history permanently lost once
 * it rolls out of the window. This script exists to snapshot it on a
 * schedule (1st + 15th of the month, per Klara's directive 2026-09-17) so we
 * build our OWN history going forward, independent of ever getting cabinet
 * credentials.
 *
 * READ-ONLY: this script performs a single unauthenticated GET request. It
 * submits no forms, logs in nowhere, and never touches meters-form/
 * set_meter_readings (the page's own reading-submission endpoint). It cannot
 * modify Roman's account or trigger any payment action.
 *
 * Two-source design (see src/lib/db/migrations/2026-09-17-eps-history.sql):
 * rows written here use source='snapshot'. A future authenticated cabinet
 * export (source='cabinet_export') can backfill full history without
 * conflicting with these rows — both tables key on (identifier, period/date,
 * source), not on source alone.
 *
 * Usage:
 *   node scripts/eps-snapshot.mjs                  # fetch + parse + write to DB
 *   node scripts/eps-snapshot.mjs --dry-run         # fetch + parse + print, no DB write
 *   node scripts/eps-snapshot.mjs --html-file=path  # parse an already-saved HTML file instead of fetching (for tests)
 */

import { Client } from "@neondatabase/serverless";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const EPS_VIEW_URL =
  "https://www.eps.org.ua/ternopil/account/view/hz0rXLAm6c5g2jas7j8ysg";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const htmlFileArg = args.find((a) => a.startsWith("--html-file="));
const htmlFilePath = htmlFileArg ? htmlFileArg.split("=")[1] : null;

/** Strip HTML tags from a cell's inner content, collapsing whitespace. */
function textOf(cellHtml) {
  return cellHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse the "account-table" (charges/payments per service) into row objects.
 * Skips the header row and the trailing "sum" row (class="sum" has no useful
 * per-service data, it's a total).
 */
function parsePaymentsTable(html) {
  const tableMatch = html.match(
    /<table class="account-table[^"]*">([\s\S]*?)<\/table>/
  );
  if (!tableMatch) return [];

  const tableHtml = tableMatch[1];
  const rowMatches = [
    ...tableHtml.matchAll(/<tr(?:\s+class="([^"]*)")?>([\s\S]*?)<\/tr>/g),
  ];

  const rows = [];
  for (const [, rowClass, rowHtml] of rowMatches) {
    if (rowClass === "sum") continue; // totals row, not a per-service record
    const cellMatches = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
    if (cellMatches.length < 10) continue; // header row (th, not td) or malformed

    const cells = cellMatches.map((m) => textOf(m[1]));
    const [
      serviceName,
      payerNumber,
      period,
      debtBefore,
      paidLastMonth,
      charged,
      subsidy,
      dueAmount,
      paidThisMonth,
      balance,
    ] = cells;

    if (!serviceName || !payerNumber) continue;

    rows.push({
      serviceName,
      payerNumber,
      period,
      debtBefore: parseFloat(debtBefore) || 0,
      paidLastMonth: parseFloat(paidLastMonth) || 0,
      charged: parseFloat(charged) || 0,
      subsidy: parseFloat(subsidy) || 0,
      dueAmount: parseFloat(dueAmount) || 0,
      paidThisMonth: parseFloat(paidThisMonth) || 0,
      balance: parseFloat(balance) || 0,
    });
  }
  return rows;
}

/**
 * Parse the "meters-table" into row objects. Each meter's hidden
 * <input id="meter_date"> (emitted just BEFORE that meter's <tr>) gives the
 * as-of date EPS attributes the "organization_reading" value to, when EPS
 * supplies one — some meters (see 2026-09-17 sample) share the same
 * meter_date across multiple rows because EPS emits it once per service
 * group, not strictly once per meter, so this is treated as best-effort,
 * not a hard guarantee.
 */
function parseMetersTable(html) {
  const tableMatch = html.match(
    /<table class="meters-table">([\s\S]*?)<\/table>/
  );
  if (!tableMatch) return [];
  const tableHtml = tableMatch[1];

  // Split on each meter block: a run of hidden <input>s immediately followed
  // by a <tr>...</tr> containing the visible cells for that meter.
  const blockMatches = [
    ...tableHtml.matchAll(
      /<input id="meter_date"[^>]*value="([^"]*)"[^>]*\/>[\s\S]*?<input id="meter_id"[^>]*value="([^"]*)"[^>]*\/>[\s\S]*?<tr>([\s\S]*?)<\/tr>/g
    ),
  ];

  const rows = [];
  for (const [, meterDate, meterId, rowHtml] of blockMatches) {
    const cellMatches = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
    if (cellMatches.length < 5) continue;

    const serviceName = textOf(cellMatches[0][1]);
    const meterNumberCell = textOf(cellMatches[1][1]);
    const orgReadingMatch = cellMatches[3][1].match(
      /organization_reading[^>]*value="([^"]*)"/
    );
    const orgReading = orgReadingMatch ? parseFloat(orgReadingMatch[1]) : null;

    if (!serviceName || orgReading === null) continue;

    rows.push({
      meterNumber: meterId || meterNumberCell,
      serviceName,
      value: orgReading,
      readingDate: meterDate || null,
    });
  }
  return rows;
}

async function fetchHtml() {
  const res = await fetch(EPS_VIEW_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; communal-snapshot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`EPS view-link returned HTTP ${res.status}`);
  }
  return res.text();
}

async function main() {
  const runTimestamp = new Date().toISOString();
  console.log(`[eps-snapshot] run start: ${runTimestamp}`);

  let html;
  if (htmlFilePath) {
    html = (await import("node:fs")).readFileSync(htmlFilePath, "utf8");
    console.log(`[eps-snapshot] parsing local file: ${htmlFilePath}`);
  } else {
    html = await fetchHtml();
    console.log(`[eps-snapshot] fetched ${html.length} bytes from EPS view-link`);
  }

  const payments = parsePaymentsTable(html);
  const meters = parseMetersTable(html);

  console.log(
    `[eps-snapshot] parsed ${payments.length} payment rows, ${meters.length} meter rows`
  );

  // Persist raw HTML + parsed JSON for audit, one snapshot dir per run.
  const dateSlug = runTimestamp.slice(0, 10); // YYYY-MM-DD
  const snapshotDir = join(REPO_ROOT, "data", "eps-snapshots", dateSlug);
  mkdirSync(snapshotDir, { recursive: true });

  const rawPath = join(snapshotDir, "raw.html");
  const jsonPath = join(snapshotDir, "parsed.json");
  writeFileSync(rawPath, html, "utf8");
  writeFileSync(
    jsonPath,
    JSON.stringify({ fetchedAt: runTimestamp, payments, meters }, null, 2),
    "utf8"
  );

  console.log(`[eps-snapshot] wrote raw HTML: ${rawPath}`);
  console.log(`[eps-snapshot] wrote parsed JSON: ${jsonPath}`);

  if (isDryRun) {
    console.log("[eps-snapshot] --dry-run set, skipping DB write");
    console.log(JSON.stringify({ payments, meters }, null, 2));
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "[eps-snapshot] DATABASE_URL not set — cannot write to DB. " +
        "Raw/parsed files were still saved above; re-run once DATABASE_URL is available."
    );
    process.exitCode = 1;
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  const relRawPath = rawPath.replace(REPO_ROOT + "\\", "").replace(REPO_ROOT + "/", "");

  let readingsWritten = 0;
  let readingsSkipped = 0;
  for (const m of meters) {
    try {
      const result = await client.query(
        `INSERT INTO readings_history
           (meter_number, service_name, value, reading_date, source, fetched_at, raw_snapshot_path)
         VALUES ($1, $2, $3, $4, 'snapshot', $5, $6)
         ON CONFLICT (meter_number, reading_date, source) DO NOTHING
         RETURNING id`,
        [m.meterNumber, m.serviceName, m.value, m.readingDate, runTimestamp, relRawPath]
      );
      if (result.rowCount > 0) readingsWritten++;
      else readingsSkipped++;
    } catch (e) {
      console.error(`[eps-snapshot] readings_history insert failed for meter ${m.meterNumber}:`, e.message);
    }
  }

  let paymentsWritten = 0;
  let paymentsSkipped = 0;
  for (const p of payments) {
    try {
      const result = await client.query(
        `INSERT INTO payments_history
           (service_name, payer_number, period, debt_before, paid_last_month, charged,
            subsidy, due_amount, paid_this_month, balance, source, fetched_at, raw_snapshot_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'snapshot', $11, $12)
         ON CONFLICT (payer_number, period, source) DO NOTHING
         RETURNING id`,
        [
          p.serviceName,
          p.payerNumber,
          p.period,
          p.debtBefore,
          p.paidLastMonth,
          p.charged,
          p.subsidy,
          p.dueAmount,
          p.paidThisMonth,
          p.balance,
          runTimestamp,
          relRawPath,
        ]
      );
      if (result.rowCount > 0) paymentsWritten++;
      else paymentsSkipped++;
    } catch (e) {
      console.error(`[eps-snapshot] payments_history insert failed for payer ${p.payerNumber}/${p.period}:`, e.message);
    }
  }

  await client.end();

  console.log(
    `[eps-snapshot] DB write done: readings +${readingsWritten} (${readingsSkipped} duplicate/skipped), ` +
      `payments +${paymentsWritten} (${paymentsSkipped} duplicate/skipped)`
  );
}

main().catch((e) => {
  console.error("[eps-snapshot] FATAL:", e.message);
  process.exitCode = 1;
});
