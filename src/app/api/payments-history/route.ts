/**
 * GET /api/payments-history
 *
 * Returns real EPS payment/charge history (komunalka-eps-real-data-20260917b).
 * Backed by the `payments_history` table (see
 * src/lib/db/migrations/2026-09-17-eps-history.sql), currently populated by
 * a periodic snapshot of the public EPS view-link (source='snapshot'). This
 * is a rolling ~2-month window as of 2026-09-17 — see
 * docs/EPS-INTEGRATION-RECON-2026-09-17.md for why a wider window requires
 * an authenticated cabinet export (source='cabinet_export'), not yet
 * available. Unlike the legacy readings/settings tables, nothing in this
 * response was ever generated from mock/seed data.
 */

import { getPaymentsHistory } from "@/lib/db/queries";
import { apiSuccess, apiError, ERRORS } from "@/lib/api-utils";

export async function GET() {
  try {
    const payments = await getPaymentsHistory();
    return apiSuccess(payments);
  } catch (error) {
    console.error("GET /api/payments-history — error:", error);

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(ERRORS.DB_NOT_CONFIGURED, 503);
    }

    return apiError(ERRORS.FETCH_PAYMENTS_HISTORY_FAILED, 500);
  }
}
