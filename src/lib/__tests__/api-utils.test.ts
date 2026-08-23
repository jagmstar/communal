import { describe, it, expect } from "vitest";
import {
  isValidUUID,
  isValidPositiveNumber,
  isValidDateString,
  sanitizeString,
  coerceBoolean,
  coerceNumber,
  validateEnum,
  ALLOWED_OCR_ENGINES,
  ERRORS,
} from "../api-utils";

// ============================================
// isValidUUID
// ============================================

describe("isValidUUID", () => {
  it("validates correct UUID v4", () => {
    expect(isValidUUID("a1b2c3d4-0001-4000-8000-000000000001")).toBe(true);
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("validates uppercase UUID", () => {
    expect(isValidUUID("A1B2C3D4-0001-4000-8000-000000000001")).toBe(true);
  });

  it("rejects non-UUID strings", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false);
    expect(isValidUUID("12345")).toBe(false);
    expect(isValidUUID("")).toBe(false);
  });

  it("rejects malformed UUIDs", () => {
    expect(isValidUUID("a1b2c3d4-0001-4000-8000-0000000000")).toBe(false); // too short
    expect(isValidUUID("a1b2c3d4-0001-4000-8000-000000000001-extra")).toBe(false); // too long
    expect(isValidUUID("g1b2c3d4-0001-4000-8000-000000000001")).toBe(false); // invalid hex
  });
});

// ============================================
// isValidPositiveNumber
// ============================================

describe("isValidPositiveNumber", () => {
  it("validates positive numbers", () => {
    expect(isValidPositiveNumber(42)).toBe(true);
    expect(isValidPositiveNumber(0)).toBe(true);
    expect(isValidPositiveNumber(3.14)).toBe(true);
    expect(isValidPositiveNumber("100")).toBe(true);
    expect(isValidPositiveNumber("3.14")).toBe(true);
  });

  it("rejects negative numbers", () => {
    expect(isValidPositiveNumber(-1)).toBe(false);
    expect(isValidPositiveNumber("-5")).toBe(false);
  });

  it("rejects NaN and Infinity", () => {
    expect(isValidPositiveNumber(NaN)).toBe(false);
    expect(isValidPositiveNumber(Infinity)).toBe(false);
    expect(isValidPositiveNumber(-Infinity)).toBe(false);
  });

  it("rejects booleans", () => {
    expect(isValidPositiveNumber(true)).toBe(false);
    expect(isValidPositiveNumber(false)).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(isValidPositiveNumber(null)).toBe(false);
    expect(isValidPositiveNumber(undefined)).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(isValidPositiveNumber("")).toBe(false);
    expect(isValidPositiveNumber("   ")).toBe(false);
  });
});

// ============================================
// isValidDateString
// ============================================

describe("isValidDateString", () => {
  it("validates correct ISO date format", () => {
    expect(isValidDateString("2026-01-31")).toBe(true);
    expect(isValidDateString("2026-12-01")).toBe(true);
    expect(isValidDateString("2025-02-28")).toBe(true);
  });

  it("validates leap year dates", () => {
    expect(isValidDateString("2024-02-29")).toBe(true); // 2024 is a leap year
  });

  it("rejects invalid dates", () => {
    expect(isValidDateString("2026-02-30")).toBe(false); // Feb 30 doesn't exist
    expect(isValidDateString("2026-13-01")).toBe(false); // month 13
    expect(isValidDateString("2026-00-15")).toBe(false); // month 0
  });

  it("rejects wrong formats", () => {
    expect(isValidDateString("2026/01/31")).toBe(false);
    expect(isValidDateString("31-01-2026")).toBe(false);
    expect(isValidDateString("2026-1-1")).toBe(false); // needs 2-digit month/day
    expect(isValidDateString("")).toBe(false);
    expect(isValidDateString("not-a-date")).toBe(false);
  });

  it("rejects non-string types", () => {
    expect(isValidDateString(123 as unknown as string)).toBe(false);
    expect(isValidDateString(null as unknown as string)).toBe(false);
    expect(isValidDateString(undefined as unknown as string)).toBe(false);
  });
});

// ============================================
// sanitizeString
// ============================================

describe("sanitizeString", () => {
  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });

  it("strips control characters", () => {
    expect(sanitizeString("hello\x00world")).toBe("helloworld");
    expect(sanitizeString("test\x1F\x7F")).toBe("test");
  });

  it("limits length", () => {
    const long = "a".repeat(2000);
    const result = sanitizeString(long, 100);
    expect(result!.length).toBe(100);
  });

  it("returns null for empty or null input", () => {
    expect(sanitizeString(null)).toBe(null);
    expect(sanitizeString(undefined)).toBe(null);
    expect(sanitizeString("")).toBe(null);
    expect(sanitizeString("   ")).toBe(null);
  });

  it("preserves Ukrainian characters", () => {
    expect(sanitizeString("Привіт, світ!")).toBe("Привіт, світ!");
    expect(sanitizeString("Лічильник №14097821")).toBe("Лічильник №14097821");
  });
});

// ============================================
// coerceBoolean
// ============================================

describe("coerceBoolean", () => {
  it("returns boolean as-is", () => {
    expect(coerceBoolean(true)).toBe(true);
    expect(coerceBoolean(false)).toBe(false);
  });

  it("coerces string 'true'/'false'", () => {
    expect(coerceBoolean("true")).toBe(true);
    expect(coerceBoolean("false")).toBe(false);
  });

  it("coerces 1/0", () => {
    expect(coerceBoolean(1)).toBe(true);
    expect(coerceBoolean(0)).toBe(false);
  });

  it("returns null for uncoercible values", () => {
    expect(coerceBoolean("yes")).toBe(null);
    expect(coerceBoolean(2)).toBe(null);
    expect(coerceBoolean(null)).toBe(null);
    expect(coerceBoolean(undefined)).toBe(null);
  });
});

// ============================================
// coerceNumber
// ============================================

describe("coerceNumber", () => {
  it("coerces valid numbers", () => {
    expect(coerceNumber(42)).toBe(42);
    expect(coerceNumber("3.14")).toBe(3.14);
    expect(coerceNumber("100")).toBe(100);
  });

  it("respects min/max bounds", () => {
    expect(coerceNumber(5, 1, 10)).toBe(5);
    expect(coerceNumber(0, 1, 10)).toBe(null); // below min
    expect(coerceNumber(15, 1, 10)).toBe(null); // above max
  });

  it("rejects non-finite values", () => {
    expect(coerceNumber(NaN)).toBe(null);
    expect(coerceNumber(Infinity)).toBe(null);
    expect(coerceNumber("abc")).toBe(null);
  });
});

// ============================================
// validateEnum
// ============================================

describe("validateEnum", () => {
  it("returns value if in allowed list", () => {
    expect(validateEnum("mlkit", ALLOWED_OCR_ENGINES)).toBe("mlkit");
    expect(validateEnum("manual", ALLOWED_OCR_ENGINES)).toBe("manual");
    expect(validateEnum("tesseract", ALLOWED_OCR_ENGINES)).toBe("tesseract");
  });

  it("returns null for disallowed values", () => {
    expect(validateEnum("google", ALLOWED_OCR_ENGINES)).toBe(null);
    expect(validateEnum("aws", ALLOWED_OCR_ENGINES)).toBe(null);
  });

  it("returns null for non-string values", () => {
    expect(validateEnum(123, ALLOWED_OCR_ENGINES)).toBe(null);
    expect(validateEnum(null, ALLOWED_OCR_ENGINES)).toBe(null);
  });
});

// ============================================
// ERRORS constants
// ============================================

describe("ERRORS constants", () => {
  it("all error messages are non-empty Ukrainian strings", () => {
    for (const [key, msg] of Object.entries(ERRORS)) {
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(10);
      // Check for Cyrillic characters (Ukrainian)
      expect(/[\u0400-\u04FF]/.test(msg)).toBe(true);
    }
  });

  it("has all expected error keys", () => {
    expect(ERRORS).toHaveProperty("DB_NOT_CONFIGURED");
    expect(ERRORS).toHaveProperty("INVALID_JSON");
    expect(ERRORS).toHaveProperty("MISSING_FIELDS");
    expect(ERRORS).toHaveProperty("INVALID_METER_ID");
    expect(ERRORS).toHaveProperty("INVALID_READING_VALUE");
    expect(ERRORS).toHaveProperty("INVALID_DATE");
    expect(ERRORS).toHaveProperty("METER_NOT_FOUND");
    expect(ERRORS).toHaveProperty("FETCH_METERS_FAILED");
    expect(ERRORS).toHaveProperty("FETCH_READINGS_FAILED");
    expect(ERRORS).toHaveProperty("CREATE_READING_FAILED");
    expect(ERRORS).toHaveProperty("FETCH_TARIFFS_FAILED");
    expect(ERRORS).toHaveProperty("FETCH_SETTINGS_FAILED");
    expect(ERRORS).toHaveProperty("UPDATE_SETTINGS_FAILED");
  });
});

// ============================================
// ALLOWED_OCR_ENGINES
// ============================================

describe("ALLOWED_OCR_ENGINES", () => {
  it("contains exactly 4 engines", () => {
    expect(ALLOWED_OCR_ENGINES).toHaveLength(4);
  });

  it("contains expected engines", () => {
    expect(ALLOWED_OCR_ENGINES).toContain("mlkit");
    expect(ALLOWED_OCR_ENGINES).toContain("azure");
    expect(ALLOWED_OCR_ENGINES).toContain("manual");
    expect(ALLOWED_OCR_ENGINES).toContain("tesseract");
  });
});
