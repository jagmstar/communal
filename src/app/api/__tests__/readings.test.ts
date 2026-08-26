import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database queries module
vi.mock("@/lib/db/queries", () => ({
  getReadings: vi.fn(),
  createReading: vi.fn(),
  getMeterById: vi.fn(),
}));

// Mock the db client to avoid DATABASE_URL requirement
vi.mock("@/lib/db/client", () => ({
  getSql: vi.fn(),
}));

import { GET, POST } from "../readings/route";
import { getReadings, createReading, getMeterById } from "@/lib/db/queries";
import type { Reading, Meter } from "@/lib/types";

// Helper: create a NextRequest-like object
function makeRequest(
  url: string,
  options: { method?: string; body?: unknown } = {}
) {
  const init: RequestInit = {
    method: options.method ?? "GET",
  };
  if (options.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }
  return new Request(url, init) as any;
}

const mockReading: Reading = {
  id: "test-reading-1",
  meterId: "a1b2c3d4-0001-4000-8000-000000000001",
  value: 200,
  date: "2026-07-31",
  ocrConfidence: 0.98,
  ocrEngine: "manual",
  submittedToEps: true,
  submittedAt: "2026-07-31T10:00:00Z",
};

describe("GET /api/readings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all readings when no meterId provided", async () => {
    (getReadings as any).mockResolvedValue([mockReading]);

    const req = makeRequest("http://localhost:3000/api/readings");
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].id).toBe("test-reading-1");
    expect(getReadings).toHaveBeenCalledWith(undefined);
  });

  it("filters by meterId when provided", async () => {
    const meterId = "a1b2c3d4-0001-4000-8000-000000000001";
    (getReadings as any).mockResolvedValue([mockReading]);

    const req = makeRequest(`http://localhost:3000/api/readings?meterId=${meterId}`);
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(getReadings).toHaveBeenCalledWith(meterId);
  });

  it("returns 400 for invalid meterId format", async () => {
    const req = makeRequest("http://localhost:3000/api/readings?meterId=not-a-uuid");
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("ідентифікатор");
  });

  it("returns 500 on database error", async () => {
    (getReadings as any).mockRejectedValue(new Error("Connection failed"));

    const req = makeRequest("http://localhost:3000/api/readings");
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("показники");
  });

  it("returns 503 when DATABASE_URL not configured", async () => {
    (getReadings as any).mockRejectedValue(new Error("DATABASE_URL environment variable is not set"));

    const req = makeRequest("http://localhost:3000/api/readings");
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toContain("Базу даних");
  });
});

describe("POST /api/readings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a reading with valid data", async () => {
    (createReading as any).mockResolvedValue(mockReading);

    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: "a1b2c3d4-0001-4000-8000-000000000001",
        value: 200,
        date: "2026-07-31",
        ocrConfidence: 0.98,
        ocrEngine: "manual",
        submittedToEps: true,
        submittedAt: "2026-07-31T10:00:00Z",
      },
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data.id).toBe("test-reading-1");
  });

  it("returns 400 for missing required fields", async () => {
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: { meterId: "a1b2c3d4-0001-4000-8000-000000000001" },
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("Відсутні");
  });

  it("returns 400 for invalid meterId", async () => {
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: "not-a-uuid",
        value: 200,
        date: "2026-07-31",
      },
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("ідентифікатор");
  });

  it("returns 400 for negative reading value", async () => {
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: "a1b2c3d4-0001-4000-8000-000000000001",
        value: -50,
        date: "2026-07-31",
      },
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("додатним");
  });

  it("returns 400 for invalid date format", async () => {
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: "a1b2c3d4-0001-4000-8000-000000000001",
        value: 200,
        date: "31-07-2026",
      },
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("дати");
  });

  it("returns 400 for impossible date (Feb 30)", async () => {
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: "a1b2c3d4-0001-4000-8000-000000000001",
        value: 200,
        date: "2026-02-30",
      },
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("дати");
  });

  it("returns 400 for invalid OCR engine", async () => {
    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: "a1b2c3d4-0001-4000-8000-000000000001",
        value: 200,
        date: "2026-07-31",
        ocrEngine: "google",
      },
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("OCR");
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost:3000/api/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json{",
    }) as any;
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("JSON");
  });

  it("returns 404 when meter doesn't exist (foreign key)", async () => {
    (createReading as any).mockRejectedValue(
      new Error("foreign key constraint violation")
    );

    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: "a1b2c3d4-0001-4000-8000-000000000099",
        value: 200,
        date: "2026-07-31",
      },
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toContain("Лічильник не знайдено");
  });

  // ============================================
  // Reading-below-last-reading validation (ticket #1)
  // ============================================

  const mockMeter: Meter = {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    meterNumber: "001",
    serviceType: "water",
    serviceName: "Вода",
    unit: "м³",
    lastReading: 200,
    lastReadingDate: "2026-07-31",
    submitDeadlineDay: 31,
    submitWindowStart: 25,
    color: "#0ea5e9",
    colorLight: "#e0f2fe",
    icon: "droplet",
  };

  it("returns 400 when value is below the meter's last known reading (AC-1)", async () => {
    (getMeterById as any).mockResolvedValue(mockMeter);

    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: mockMeter.id,
        value: 150, // below lastReading (200), fat-finger / OCR misread case
        date: "2026-08-15",
      },
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("менший за попередній");
    expect(createReading).not.toHaveBeenCalled();
  });

  it("returns 400 when value equals a regression on the same date", async () => {
    (getMeterById as any).mockResolvedValue(mockMeter);

    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: mockMeter.id,
        value: 199,
        date: "2026-07-31", // same date as lastReadingDate
      },
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("менший за попередній");
  });

  it("accepts a value equal to the last reading (no usage, not a regression)", async () => {
    (getMeterById as any).mockResolvedValue(mockMeter);
    (createReading as any).mockResolvedValue({ ...mockReading, value: 200 });

    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: mockMeter.id,
        value: 200,
        date: "2026-08-15",
      },
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
  });

  it("accepts a value increasing above the last reading", async () => {
    (getMeterById as any).mockResolvedValue(mockMeter);
    (createReading as any).mockResolvedValue({ ...mockReading, value: 250 });

    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: mockMeter.id,
        value: 250,
        date: "2026-08-15",
      },
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
    expect(createReading).toHaveBeenCalled();
  });

  it("accepts a meter rollover when allowRollover is set and the drop is large (AC-3)", async () => {
    const rolloverMeter: Meter = { ...mockMeter, lastReading: 99950 };
    (getMeterById as any).mockResolvedValue(rolloverMeter);
    (createReading as any).mockResolvedValue({ ...mockReading, value: 12 });

    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: mockMeter.id,
        value: 12, // dial wrapped from 99950 -> 00012
        date: "2026-08-15",
        allowRollover: true,
      },
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
    expect(createReading).toHaveBeenCalled();
  });

  it("rejects a small drop even when allowRollover is set (typo, not a real rollover)", async () => {
    (getMeterById as any).mockResolvedValue(mockMeter); // lastReading = 200

    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: mockMeter.id,
        value: 150, // only a ~25% drop — not plausible as a dial rollover
        date: "2026-08-15",
        allowRollover: true,
      },
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("менший за попередній");
  });

  it("rejects a large drop without the allowRollover flag", async () => {
    const rolloverMeter: Meter = { ...mockMeter, lastReading: 99950 };
    (getMeterById as any).mockResolvedValue(rolloverMeter);

    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: mockMeter.id,
        value: 12,
        date: "2026-08-15",
        // allowRollover omitted — must not be silently accepted
      },
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("менший за попередній");
  });

  // ------------------------------------------------------------------
  // QA verdict (qa/ticket-1-verdict.md, Finding F1) regression coverage:
  // ROLLOVER_MAX_RATIO tightened from 0.5 to 0.05 (require a >95% drop,
  // not merely >50%) so the ticket's own headline OCR-misread example is
  // actually rejected even with allowRollover set. See src/lib/rollover.ts
  // for the full rationale.
  // ------------------------------------------------------------------

  it("F1 regression: rejects the ticket's own headline OCR-misread example (12453 -> 1453, an 88.3% drop) EVEN WITH allowRollover set", async () => {
    const meterWith12453: Meter = { ...mockMeter, lastReading: 12453 };
    (getMeterById as any).mockResolvedValue(meterWith12453);

    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: mockMeter.id,
        value: 1453, // 1453/12453 = 0.1167 -> an 88.3% drop, NOT a genuine rollover
        date: "2026-08-15",
        allowRollover: true,
      },
    });
    const response = await POST(req);
    const json = await response.json();

    // Under the old ROLLOVER_MAX_RATIO=0.5, 1453 < 12453*0.5 was true, so this was
    // wrongly accepted (201) — QA's kill-test confirmed this end-to-end. Under the
    // new ROLLOVER_MAX_RATIO=0.05, 1453 is NOT < 12453*0.05 (=622.65), so it is
    // correctly rejected.
    expect(response.status).toBe(400);
    expect(json.error).toContain("менший за попередній");
    expect(createReading).not.toHaveBeenCalled();
  });

  it("F1 regression: accepts a genuine rollover on a 5-digit meter (99998 -> 5, a >99.99% drop) WITH allowRollover set", async () => {
    const fiveDigitMeter: Meter = { ...mockMeter, lastReading: 99998 };
    (getMeterById as any).mockResolvedValue(fiveDigitMeter);
    (createReading as any).mockResolvedValue({ ...mockReading, value: 5 });

    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: mockMeter.id,
        value: 5, // dial wrapped from 99998 -> 00005, a >99.99% drop
        date: "2026-08-15",
        allowRollover: true,
      },
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
    expect(createReading).toHaveBeenCalled();
  });

  it("skips the regression check when the meter has no prior reading yet", async () => {
    const freshMeter: Meter = { ...mockMeter, lastReading: null, lastReadingDate: null };
    (getMeterById as any).mockResolvedValue(freshMeter);
    (createReading as any).mockResolvedValue({ ...mockReading, value: 50 });

    const req = makeRequest("http://localhost:3000/api/readings", {
      method: "POST",
      body: {
        meterId: mockMeter.id,
        value: 50,
        date: "2026-08-15",
      },
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
  });
});
