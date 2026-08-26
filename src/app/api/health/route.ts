/**
 * GET /api/health
 * Production health smoke: verifies DB connectivity with a trivial query.
 *
 * Added per incident-2026-08-26-prod-down.md Prevention item 4
 * ("No production health check / alerting for DB connectivity"):
 * the 2026-08-26 Neon credential-rotation outage returned 500 on every
 * API route with no way to detect it other than user reports.
 * This endpoint gives uptime monitors a single URL that distinguishes
 * "app is up" (200) from "app is up but DB is unreachable" (503).
 */

import { getSql } from "@/lib/db/client";
import { apiSuccess, apiError } from "@/lib/api-utils";

// Never statically optimize a health check — it must hit the DB every call.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getSql();
    await sql`SELECT 1`;
    return apiSuccess({ status: "ok", db: "ok" });
  } catch (error) {
    console.error("GET /api/health — DB connectivity check failed:", error);
    return apiError("Сервіс недоступний: немає з'єднання з базою даних.", 503);
  }
}
