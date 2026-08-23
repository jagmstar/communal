/**
 * GET /api/tariffs
 * Returns all tariffs.
 */

import { getTariffs } from "@/lib/db/queries";
import { apiSuccess, apiError, ERRORS } from "@/lib/api-utils";

export async function GET() {
  try {
    const tariffs = await getTariffs();
    return apiSuccess(tariffs);
  } catch (error) {
    console.error("GET /api/tariffs — error:", error);

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(ERRORS.DB_NOT_CONFIGURED, 503);
    }

    return apiError(ERRORS.FETCH_TARIFFS_FAILED, 500);
  }
}
