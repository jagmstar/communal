import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/queries", () => ({
  getPaymentsHistory: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  getSql: vi.fn(),
}));

import { GET } from "../payments-history/route";
import { getPaymentsHistory } from "@/lib/db/queries";
import type { PaymentHistoryEntry } from "@/lib/types";

const mockPayments: PaymentHistoryEntry[] = [
  {
    id: "p1",
    serviceName: "Вода",
    payerNumber: "63269",
    period: "Серпня",
    debtBefore: 777.86,
    paidLastMonth: 777.86,
    charged: 647.54,
    subsidy: 0,
    dueAmount: 647.54,
    paidThisMonth: 0,
    balance: 647.54,
    source: "snapshot",
    fetchedAt: "2026-09-17T17:36:41.216Z",
    paymentDate: null,
    receiptNumber: null,
  },
];

describe("GET /api/payments-history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns real EPS payment history entries", async () => {
    (getPaymentsHistory as any).mockResolvedValue(mockPayments);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].serviceName).toBe("Вода");
    expect(json.data[0].source).toBe("snapshot");
    expect(json.data[0].balance).toBe(647.54);
  });

  it("returns empty array when no snapshots captured yet (honest empty state, not fake data)", async () => {
    (getPaymentsHistory as any).mockResolvedValue([]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual([]);
  });

  it("returns 500 on database error", async () => {
    (getPaymentsHistory as any).mockRejectedValue(new Error("Connection timeout"));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("оплат");
  });

  it("returns 503 when DATABASE_URL not configured", async () => {
    (getPaymentsHistory as any).mockRejectedValue(
      new Error("DATABASE_URL environment variable is not set")
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toContain("Базу даних");
  });
});
