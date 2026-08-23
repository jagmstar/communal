/**
 * GET /api/settings  — Returns the singleton settings row
 * PUT /api/settings  — Updates the settings with partial data
 */

import { NextRequest } from "next/server";
import { getSettings, updateSettings } from "@/lib/db/queries";
import { apiSuccess, apiError, ERRORS, coerceBoolean, sanitizeString } from "@/lib/api-utils";
import type { Settings } from "@/lib/types";

export async function GET() {
  try {
    const settings = await getSettings();
    return apiSuccess(settings);
  } catch (error) {
    console.error("GET /api/settings — error:", error);

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(ERRORS.DB_NOT_CONFIGURED, 503);
    }

    return apiError(ERRORS.FETCH_SETTINGS_FAILED, 500);
  }
}

export async function PUT(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError(ERRORS.INVALID_JSON, 400);
  }

  try {
    // Build partial settings from request body with validation
    const partial: Partial<Settings> = {};

    // Reject empty body — nothing to update
    if (Object.keys(body).length === 0) {
      return apiError(ERRORS.MISSING_FIELDS, 400);
    }

    if (body.epsUsername !== undefined) {
      partial.epsUsername = sanitizeString(body.epsUsername, 255);
    }
    if (body.epsAccountNumber !== undefined) {
      partial.epsAccountNumber = sanitizeString(body.epsAccountNumber, 255);
    }
    if (body.notificationReading !== undefined) {
      const val = coerceBoolean(body.notificationReading);
      if (val === null) return apiError(ERRORS.INVALID_NOTIFICATION_VALUE, 400);
      partial.notificationReading = val;
    }
    if (body.notificationPayment !== undefined) {
      const val = coerceBoolean(body.notificationPayment);
      if (val === null) return apiError(ERRORS.INVALID_NOTIFICATION_VALUE, 400);
      partial.notificationPayment = val;
    }
    if (body.notificationTariff !== undefined) {
      const val = coerceBoolean(body.notificationTariff);
      if (val === null) return apiError(ERRORS.INVALID_NOTIFICATION_VALUE, 400);
      partial.notificationTariff = val;
    }
    if (body.notificationAnomaly !== undefined) {
      const val = coerceBoolean(body.notificationAnomaly);
      if (val === null) return apiError(ERRORS.INVALID_NOTIFICATION_VALUE, 400);
      partial.notificationAnomaly = val;
    }
    if (body.userName !== undefined) {
      partial.userName = sanitizeString(body.userName, 255);
    }
    if (body.userAddress !== undefined) {
      partial.userAddress = sanitizeString(body.userAddress, 500);
    }

    const updated = await updateSettings(partial);
    return apiSuccess(updated);
  } catch (error) {
    console.error("PUT /api/settings — error:", error);

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(ERRORS.DB_NOT_CONFIGURED, 503);
    }

    return apiError(ERRORS.UPDATE_SETTINGS_FAILED, 500);
  }
}
