/**
 * GET /api/readings-history
 *
 * Returns real EPS meter-reading full history (komunalka-eps-real-data-impl-20260922).
 * Backed by the `readings_history` table (see
 * src/lib/db/migrations/2026-09-17-eps-history.sql), populated by BOTH:
 *   - source='snapshot': eps-snapshot.mjs's rolling ~2-month current-state captures
 *   - source='cabinet_export': scripts/eps-history-sync.mjs's full-history pull
 *     from the public view-link's view_meters_history endpoint (verified live
 *     2026-09-22: 470 real rows, 2018-02-28 -> 2026-08-31, 81 distinct months)
 * Never generated from mock/seed data.
 */

import { getReadingsHistory } from "@/lib/db/queries";
import { apiSuccess, apiError, ERRORS } from "@/lib/api-utils";

export async function GET() {
  try {
    const readings = await getReadingsHistory();
    return apiSuccess(readings);
  } catch (error) {
    console.error("GET /api/readings-history — error:", error);

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(ERRORS.DB_NOT_CONFIGURED, 503);
    }

    return apiError(ERRORS.FETCH_READINGS_HISTORY_FAILED, 500);
  }
}
