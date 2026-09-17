#!/usr/bin/env node
/**
 * Config-driven CSV importer for an AUTHENTICATED EPS cabinet export
 * (source='cabinet_export' in readings_history / payments_history).
 *
 * Why config-driven: as of 2026-09-17 we do NOT have Roman's EPS cabinet
 * credentials (see docs/EPS-INTEGRATION-RECON-2026-09-17.md), so we do not
 * know the exact column layout the cabinet's "Історія"/"Показники"/"Оплати"
 * export will use. Rather than guess a fixed schema and rewrite this script
 * once real data arrives, the column→field mapping is supplied at import
 * time via a JSON config so this can absorb whatever the actual export
 * looks like.
 *
 * Usage:
 *   node scripts/eps-import-csv.mjs --type=readings --csv=path/to/export.csv --map=path/to/mapping.json
 *   node scripts/eps-import-csv.mjs --type=payments --csv=path/to/export.csv --map=path/to/mapping.json [--dry-run]
 *
 * Mapping config shape (readings):
 *   {
 *     "meterNumber": "Meter No",      // CSV header -> readings_history.meter_number
 *     "serviceName": "Service",
 *     "value": "Reading",
 *     "readingDate": "Date"           // optional; expects a value parseable by `new Date()` or already ISO
 *   }
 *
 * Mapping config shape (payments):
 *   {
 *     "serviceName": "Service",
 *     "payerNumber": "Account No",
 *     "period": "Month",
 *     "debtBefore": "Debt",           // any of the numeric fields below may be omitted from the mapping;
 *     "paidLastMonth": "Paid Last Month",   // omitted fields default to 0
 *     "charged": "Charged",
 *     "subsidy": "Subsidy",
 *     "dueAmount": "Due",
 *     "paidThisMonth": "Paid This Month",
 *     "balance": "Balance"
 *   }
 *
 * See docs/EPS-INTEGRATION-RECON-2026-09-17.md "Open question" for the
 * concrete unblock: this script is ready and waiting on real export data.
 */

import { Client } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const getArg = (name) => {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=").slice(1).join("=") : null;
};

const type = getArg("type"); // 'readings' | 'payments'
const csvPath = getArg("csv");
const mapPath = getArg("map");
const isDryRun = args.includes("--dry-run");

if (!type || !["readings", "payments"].includes(type)) {
  console.error("Usage: --type=readings|payments --csv=<path> --map=<path> [--dry-run]");
  process.exit(1);
}
if (!csvPath || !mapPath) {
  console.error("Both --csv and --map are required.");
  process.exit(1);
}

/** Minimal CSV parser: handles quoted fields with embedded commas, no embedded newlines in quotes. */
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const parseLine = (line) => {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (c === '"') {
          inQuotes = false;
        } else {
          cur += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        cells.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    cells.push(cur);
    return cells;
  };

  const header = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

function toIsoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function toNum(value) {
  const n = parseFloat(String(value).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

async function main() {
  const csvText = readFileSync(csvPath, "utf8");
  const mapping = JSON.parse(readFileSync(mapPath, "utf8"));
  const rows = parseCsv(csvText);

  console.log(`[eps-import-csv] parsed ${rows.length} rows from ${csvPath} using mapping ${mapPath}`);

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString && !isDryRun) {
    console.error("DATABASE_URL not set and --dry-run not passed. Aborting.");
    process.exit(1);
  }

  const client = isDryRun ? null : new Client({ connectionString });
  if (client) await client.connect();

  let written = 0;
  let skipped = 0;

  if (type === "readings") {
    for (const row of rows) {
      const meterNumber = row[mapping.meterNumber];
      const serviceName = row[mapping.serviceName];
      const value = toNum(row[mapping.value]);
      const readingDate = mapping.readingDate ? toIsoDate(row[mapping.readingDate]) : null;

      if (!meterNumber || !serviceName) {
        skipped++;
        continue;
      }

      if (isDryRun) {
        console.log(JSON.stringify({ meterNumber, serviceName, value, readingDate }));
        written++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO readings_history
           (meter_number, service_name, value, reading_date, source, fetched_at)
         VALUES ($1, $2, $3, $4, 'cabinet_export', NOW())
         ON CONFLICT (meter_number, reading_date, source) DO NOTHING
         RETURNING id`,
        [meterNumber, serviceName, value, readingDate]
      );
      if (result.rowCount > 0) written++;
      else skipped++;
    }
  } else {
    for (const row of rows) {
      const serviceName = row[mapping.serviceName];
      const payerNumber = row[mapping.payerNumber];
      const period = row[mapping.period];

      if (!serviceName || !payerNumber || !period) {
        skipped++;
        continue;
      }

      const record = {
        debtBefore: mapping.debtBefore ? toNum(row[mapping.debtBefore]) : 0,
        paidLastMonth: mapping.paidLastMonth ? toNum(row[mapping.paidLastMonth]) : 0,
        charged: mapping.charged ? toNum(row[mapping.charged]) : 0,
        subsidy: mapping.subsidy ? toNum(row[mapping.subsidy]) : 0,
        dueAmount: mapping.dueAmount ? toNum(row[mapping.dueAmount]) : 0,
        paidThisMonth: mapping.paidThisMonth ? toNum(row[mapping.paidThisMonth]) : 0,
        balance: mapping.balance ? toNum(row[mapping.balance]) : 0,
      };

      if (isDryRun) {
        console.log(JSON.stringify({ serviceName, payerNumber, period, ...record }));
        written++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO payments_history
           (service_name, payer_number, period, debt_before, paid_last_month, charged,
            subsidy, due_amount, paid_this_month, balance, source, fetched_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'cabinet_export', NOW())
         ON CONFLICT (payer_number, period, source) DO NOTHING
         RETURNING id`,
        [
          serviceName,
          payerNumber,
          period,
          record.debtBefore,
          record.paidLastMonth,
          record.charged,
          record.subsidy,
          record.dueAmount,
          record.paidThisMonth,
          record.balance,
        ]
      );
      if (result.rowCount > 0) written++;
      else skipped++;
    }
  }

  if (client) await client.end();
  console.log(`[eps-import-csv] done: ${written} written/dry-run-printed, ${skipped} skipped (missing fields or duplicate)`);
}

main().catch((e) => {
  console.error("[eps-import-csv] FATAL:", e.message);
  process.exit(1);
});
