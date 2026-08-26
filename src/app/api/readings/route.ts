/**
 * GET  /api/readings        — Returns all readings, or filtered by ?meterId=
 * POST /api/readings        — Creates a new reading
 */

import { NextRequest } from "next/server";
import { getReadings, createReading, getMeterById } from "@/lib/db/queries";
import {
  apiSuccess,
  apiError,
  ERRORS,
  isValidUUID,
  isValidPositiveNumber,
  isValidDateString,
  validateEnum,
  coerceBoolean,
  isPlausibleRollover,
  ALLOWED_OCR_ENGINES,
} from "@/lib/api-utils";
import type { Reading } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meterId = searchParams.get("meterId") ?? undefined;

    // Validate meterId format if provided
    if (meterId && !isValidUUID(meterId)) {
      return apiError(ERRORS.INVALID_METER_ID, 400);
    }

    const readings = await getReadings(meterId);
    return apiSuccess(readings);
  } catch (error) {
    console.error("GET /api/readings — error:", error);

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(ERRORS.DB_NOT_CONFIGURED, 503);
    }

    return apiError(ERRORS.FETCH_READINGS_FAILED, 500);
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError(ERRORS.INVALID_JSON, 400);
  }

  try {
    // Validate required fields
    if (!body.meterId || body.value === undefined || !body.date) {
      return apiError(ERRORS.MISSING_FIELDS + " Обов'язкові: meterId, value, date.", 400);
    }

    // Validate meterId is a UUID
    if (!isValidUUID(String(body.meterId))) {
      return apiError(ERRORS.INVALID_METER_ID, 400);
    }

    // Validate value is a positive number
    if (!isValidPositiveNumber(body.value)) {
      return apiError(ERRORS.INVALID_READING_VALUE, 400);
    }

    // Validate date format
    if (!isValidDateString(String(body.date))) {
      return apiError(ERRORS.INVALID_DATE, 400);
    }

    const newValue = Number(body.value);
    const newDate = String(body.date);

    // Optional explicit override for a meter rollover (dial wrap-around,
    // e.g. 99999 -> 00012). See ERRORS.READING_BELOW_LAST / isPlausibleRollover.
    const allowRollover = coerceBoolean(body.allowRollover) === true;

    // Reject a value lower than (or equal-date-but-lower-than) the meter's
    // last known reading — this is the regression check from ticket #1.
    // Only compared for same-or-later dates; a backfilled earlier-dated
    // reading is a different (out-of-scope) case.
    const meter = await getMeterById(String(body.meterId));
    if (
      meter &&
      meter.lastReading !== null &&
      (meter.lastReadingDate === null || meter.lastReadingDate <= newDate) &&
      newValue < meter.lastReading
    ) {
      const rolloverPlausible = isPlausibleRollover(newValue, meter.lastReading);
      if (!allowRollover || !rolloverPlausible) {
        return apiError(ERRORS.READING_BELOW_LAST, 400);
      }
    }

    // Validate ocrEngine if provided
    let ocrEngine: Reading["ocrEngine"] = "manual";
    if (body.ocrEngine) {
      const validated = validateEnum(body.ocrEngine, ALLOWED_OCR_ENGINES);
      if (!validated) {
        return apiError(ERRORS.INVALID_OCR_ENGINE, 400);
      }
      ocrEngine = validated;
    }

    // Build the reading object (omit 'id' — DB generates it)
    const reading: Omit<Reading, "id"> = {
      meterId: String(body.meterId),
      value: Number(body.value),
      date: String(body.date),
      photoUrl: body.photoUrl ? String(body.photoUrl).slice(0, 2048) : undefined,
      ocrConfidence: body.ocrConfidence !== undefined
        ? Math.min(Math.max(Number(body.ocrConfidence), 0), 1)
        : 0,
      ocrEngine,
      submittedToEps: Boolean(body.submittedToEps),
      submittedAt: body.submittedAt ? String(body.submittedAt).slice(0, 50) : null,
    };

    const created = await createReading(reading);
    return apiSuccess(created, 201);
  } catch (error) {
    console.error("POST /api/readings — error:", error);

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(ERRORS.DB_NOT_CONFIGURED, 503);
    }

    // Foreign key violation — meter doesn't exist
    if (error instanceof Error && error.message.includes("foreign key")) {
      return apiError(ERRORS.METER_NOT_FOUND, 404);
    }

    return apiError(ERRORS.CREATE_READING_FAILED, 500);
  }
}
