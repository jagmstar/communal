/**
 * GET /api/meters
 * Returns all configured meters.
 */

import { getMeters } from "@/lib/db/queries";
import { apiSuccess, apiError, ERRORS } from "@/lib/api-utils";

export async function GET() {
  try {
    const meters = await getMeters();
    return apiSuccess(meters);
  } catch (error) {
    console.error("GET /api/meters — error:", error);

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(ERRORS.DB_NOT_CONFIGURED, 503);
    }

    return apiError(ERRORS.FETCH_METERS_FAILED, 500);
  }
}
