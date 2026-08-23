import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/queries", () => ({
  getTariffs: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  getSql: vi.fn(),
}));

import { GET } from "../tariffs/route";
import { getTariffs } from "@/lib/db/queries";
import type { Tariff } from "@/lib/types";

const mockTariffs: Tariff[] = [
  { id: "t1", serviceType: "water", serviceName: "Вода", value: 35.2, unit: "₴/м³", effectiveFrom: "2026-01-01", source: "eps" },
  { id: "t2", serviceType: "electricity", serviceName: "Електроенергія", value: 4.32, unit: "₴/кВт·год", effectiveFrom: "2026-01-01", source: "nerc" },
];

describe("GET /api/tariffs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all tariffs", async () => {
    (getTariffs as any).mockResolvedValue(mockTariffs);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].value).toBe(35.2);
    expect(json.data[1].serviceName).toBe("Електроенергія");
  });

  it("returns empty array when no tariffs", async () => {
    (getTariffs as any).mockResolvedValue([]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    (getTariffs as any).mockRejectedValue(new Error("Connection timeout"));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("тарифи");
  });

  it("returns 503 when DATABASE_URL not configured", async () => {
    (getTariffs as any).mockRejectedValue(
      new Error("DATABASE_URL environment variable is not set")
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toContain("Базу даних");
  });
});
