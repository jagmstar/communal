import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/queries", () => ({
  getReadingsHistory: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  getSql: vi.fn(),
}));

import { GET } from "../readings-history/route";
import { getReadingsHistory } from "@/lib/db/queries";
import type { ReadingHistoryEntry } from "@/lib/types";

const mockReadings: ReadingHistoryEntry[] = [
  {
    id: "r1",
    meterNumber: "14091126",
    serviceName: "Вода",
    value: 118,
    readingDate: "2018-02-28",
    source: "cabinet_export",
    fetchedAt: "2026-09-22T17:00:00.000Z",
  },
];

describe("GET /api/readings-history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns real EPS meter-reading history entries", async () => {
    (getReadingsHistory as any).mockResolvedValue(mockReadings);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].meterNumber).toBe("14091126");
    expect(json.data[0].source).toBe("cabinet_export");
    expect(json.data[0].value).toBe(118);
  });

  it("returns empty array when no history captured yet (honest empty state)", async () => {
    (getReadingsHistory as any).mockResolvedValue([]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    (getReadingsHistory as any).mockRejectedValue(new Error("Connection timeout"));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("показник");
  });

  it("returns 503 when DATABASE_URL not configured", async () => {
    (getReadingsHistory as any).mockRejectedValue(
      new Error("DATABASE_URL environment variable is not set")
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toContain("Базу даних");
  });
});
