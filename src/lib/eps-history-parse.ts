/**
 * Pure parsers for the EPS full-history HTML tables (public view-link
 * `view_meters_history` / `view_history` POST endpoints — found live
 * 2026-09-22, see docs/EPS-RECON-2026-09-18.md and
 * scripts/eps-history-sync.mjs for the fetch side). Split out from the
 * script into src/lib so vitest (scoped to src/**) can exercise the
 * parsing logic directly against saved fixture HTML, per the quality
 * gate's ≥80%-coverage-on-changed-code requirement — komunalka-eps-real-data-impl-20260922.
 */

export interface ParsedMeterReading {
  readingDate: string | null;
  meterNumber: string;
  serviceName: string;
  value: number;
}

export interface ParsedPaymentReceipt {
  serial: string;
  officeId: string | null;
  date: string;
  casaName: string | null;
  receiptNo: string | null;
  amount: number;
}

/** Decode the handful of HTML entities EPS emits in table cells (casaName carries `&#34;` for quotes). */
export function decodeEntities(s: string | null | undefined): string | null {
  if (!s) return s ?? null;
  return s
    .replace(/&#34;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");
}

/** Parse the meters-history table (Дата|Час|Назва каси|Номер квитанції|Послуга|Номер лічильника|Показник зі служби|Показник). */
export function parseMetersHistory(html: string): ParsedMeterReading[] {
  const tbodyStart = html.indexOf("<tbody>");
  const tbodyEnd = html.indexOf("</tbody>");
  if (tbodyStart === -1 || tbodyEnd === -1) return [];
  const tbody = html.substring(tbodyStart + "<tbody>".length, tbodyEnd);

  const rowMatches = [...tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  const rows: ParsedMeterReading[] = [];
  for (const [, rowHtml] of rowMatches) {
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1].trim());
    if (cells.length < 8) continue; // malformed/header row
    const [date, , , , serviceName, meterNumber, , orgReading] = cells;
    const value = parseFloat(orgReading);
    if (!meterNumber || !serviceName || isNaN(value)) continue;
    rows.push({ readingDate: date || null, meterNumber, serviceName, value });
  }
  return rows;
}

/** Parse the payments-history table (radio input, Дата|Час|Назва каси|Номер квитанції|Сума), keyed by hidden serial/office_id/commit_date inputs. */
export function parsePaymentsHistory(html: string): ParsedPaymentReceipt[] {
  const tbodyStart = html.indexOf("<tbody>");
  const tbodyEnd = html.indexOf("</tbody>");
  if (tbodyStart === -1 || tbodyEnd === -1) return [];
  const tbody = html.substring(tbodyStart + "<tbody>".length, tbodyEnd);

  const rowMatches = [...tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  const rows: ParsedPaymentReceipt[] = [];
  for (const [, rowHtml] of rowMatches) {
    const serialM = rowHtml.match(/id="serial"[^>]*value="([^"]*)"/);
    const officeIdM = rowHtml.match(/id="office_id"[^>]*value="([^"]*)"/);
    const cells = [...rowHtml.matchAll(/<td(?:\s+style="[^"]*")?>([\s\S]*?)<\/td>/g)].map((m) => m[1].trim());
    // cells[0] is the radio <input>, real cells start at index 1: date, time, casaName, receiptNo, amount
    const [, date, , casaName, receiptNo, amountRaw] = cells;
    const amount = parseFloat(amountRaw);
    const serial = serialM ? serialM[1] : receiptNo;
    if (!serial || !date || isNaN(amount)) continue;
    rows.push({
      serial,
      officeId: officeIdM ? officeIdM[1] : null,
      date,
      casaName: decodeEntities(casaName),
      receiptNo: receiptNo || null,
      amount,
    });
  }
  return rows;
}
