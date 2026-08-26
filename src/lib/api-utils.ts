/**
 * Shared API utilities for validation, error responses, and response formatting.
 *
 * Provides:
 * - Consistent JSON response envelope: { data: T } for success, { error: string } for errors
 * - Ukrainian error messages
 * - Input validation helpers (UUID, numeric, date, string sanitization)
 * - Standardized error response factory
 */

import { NextResponse } from "next/server";

// ============================================
// Security headers
// ============================================

const SECURITY_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

// ============================================
// Response helpers
// ============================================

/**
 * Success response — wraps payload in { data: ... } envelope.
 * Includes CORS and security headers.
 * @param data - The response payload
 * @param status - HTTP status code (default 200)
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status, headers: SECURITY_HEADERS });
}

/**
 * Error response — returns { error: "..." } with Ukrainian message.
 * Includes CORS and security headers.
 * @param message - Ukrainian error message
 * @param status - HTTP status code
 */
export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: SECURITY_HEADERS });
}

// ============================================
// Validation helpers
// ============================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a valid UUID (v4 format).
 * @returns true if valid UUID, false otherwise
 */
export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Validate that a value is a positive finite number.
 * Rejects empty strings, null, boolean, and NaN.
 * @returns true if valid positive number, false otherwise
 */
export function isValidPositiveNumber(value: unknown): value is number {
  if (typeof value === "boolean" || value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0;
}

/**
 * Validate that a string is a valid ISO date (YYYY-MM-DD).
 * @returns true if valid date format, false otherwise
 */
export function isValidDateString(value: string): boolean {
  if (typeof value !== "string" || value.trim() === "") return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  // Verify the date didn't roll over (e.g. Feb 30 → March 2)
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return false;
  return !isNaN(date.getTime());
}

/**
 * Sanitize a string input — trim whitespace, limit length, strip control chars.
 * @param value - The string to sanitize
 * @param maxLength - Maximum allowed length (default 1000)
 * @returns Sanitized string
 */
export function sanitizeString(value: unknown, maxLength = 1000): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value)
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, ""); // strip control characters
  if (str === "") return null;
  return str.slice(0, maxLength);
}

/**
 * Validate that a value is a boolean or can be coerced to one.
 * @returns The boolean value or null if not coercible
 */
export function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === 1) return true;
  if (value === 0) return false;
  return null;
}

/**
 * Validate that a value is a number or can be coerced to one within a range.
 * @returns The number value or null if not coercible / out of range
 */
export function coerceNumber(
  value: unknown,
  min = -Infinity,
  max = Infinity
): number | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

/**
 * Validate that a value is one of a set of allowed strings.
 * @returns The value if valid, null otherwise
 */
export function validateEnum<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | null {
  if (typeof value !== "string") return null;
  return allowed.includes(value as T) ? (value as T) : null;
}

// ============================================
// Reading-progression validation (ticket #1)
// ============================================

/**
 * Re-exported from the shared, dependency-free `src/lib/rollover.ts` module (ticket #1
 * follow-up per QA verdict `qa/ticket-1-verdict.md`, Finding F2). This used to be a local
 * definition duplicated byte-for-byte in `src/app/submit/page.tsx`; both call sites now
 * import the SAME implementation from `rollover.ts` instead of drifting independently.
 * See `rollover.ts` for the full rationale on the threshold value (Finding F1).
 */
export { ROLLOVER_MAX_RATIO, isPlausibleRollover } from "./rollover";

// ============================================
// Error message constants (Ukrainian)
// ============================================

export const ERRORS = {
  DB_NOT_CONFIGURED: "Базу даних не налаштовано. Зверніться до адміністратора.",
  INVALID_JSON: "Невірний формат запиту. Очікується JSON.",
  MISSING_FIELDS: "Відсутні обов'язкові поля.",
  INVALID_METER_ID: "Невірний ідентифікатор лічильника (очікується UUID).",
  INVALID_READING_VALUE: "Значення показника має бути додатним числом.",
  INVALID_DATE: "Невірний формат дати. Очікується YYYY-MM-DD.",
  INVALID_OCR_ENGINE: "Невірний тип OCR-движка.",
  INVALID_NOTIFICATION_VALUE: "Значення сповіщень має бути булевим типом.",
  READING_BELOW_LAST:
    "Показник менший за попередній. Перевірте значення. Якщо це перекручення лічильника (перехід через нуль), позначте це явно.",
  METER_NOT_FOUND: "Лічильник не знайдено.",
  FETCH_METERS_FAILED: "Не вдалося отримати список лічильників.",
  FETCH_READINGS_FAILED: "Не вдалося отримати показники.",
  CREATE_READING_FAILED: "Не вдалося створити показник.",
  FETCH_TARIFFS_FAILED: "Не вдалося отримати тарифи.",
  FETCH_SETTINGS_FAILED: "Не вдалося отримати налаштування.",
  UPDATE_SETTINGS_FAILED: "Не вдалося оновити налаштування.",
  INTERNAL_ERROR: "Внутрішня помилка сервера.",
} as const;

// Allowed OCR engine values (must match DB CHECK constraint)
export const ALLOWED_OCR_ENGINES = [
  "mlkit",
  "azure",
  "manual",
  "tesseract",
] as const;
