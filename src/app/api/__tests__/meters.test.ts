import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/queries", () => ({
  getMeters: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  getSql: vi.fn(),
}));

import { GET } from "../meters/route";
import { getMeters } from "@/lib/db/queries";
import type { Meter } from "@/lib/types";

function makeRequest(url: string) {
  return new Request(url) as any;
}

const mockMeters: Meter[] = [
  {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    meterNumber: "001",
    serviceType: "water",
    serviceName: "Вода (гаряча)",
    unit: "м³",
    lastReading: 200,
    lastReadingDate: "2026-07-31",
    submitDeadlineDay: 31,
    submitWindowStart: 25,
    color: "#0ea5e9",
    colorLight: "#e0f2fe",
    icon: "droplet",
  },
  {
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    meterNumber: "002",
    serviceType: "electricity",
    serviceName: "Електроенергія",
    unit: "кВт·год",
    lastReading: 12500,
    lastReadingDate: "2026-07-31",
    submitDeadlineDay: 3,
    submitWindowStart: 28,
    color: "#f59e0b",
    colorLight: "#fef3c7",
    icon: "zap",
  },
];

describe("GET /api/meters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all meters", async () => {
    (getMeters as any).mockResolvedValue(mockMeters);

    const req = makeRequest("http://localhost:3000/api/meters");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].serviceName).toBe("Вода (гаряча)");
    expect(json.data[1].serviceName).toBe("Електроенергія");
  });

  it("returns empty array when no meters exist", async () => {
    (getMeters as any).mockResolvedValue([]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    (getMeters as any).mockRejectedValue(new Error("Connection refused"));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("лічильників");
  });

  it("returns 503 when DATABASE_URL not configured", async () => {
    (getMeters as any).mockRejectedValue(
      new Error("DATABASE_URL environment variable is not set")
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toContain("Базу даних");
  });

  it("includes security headers in response", async () => {
    (getMeters as any).mockResolvedValue(mockMeters);

    const response = await GET();

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
