import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database queries module
vi.mock("@/lib/db/queries", () => ({
  getReadings: vi.fn(),
  createReading: vi.fn(),
}));

// Mock the db client to avoid DATABASE_URL requirement
vi.mock("@/lib/db/client", () => ({
  getSql: vi.fn(),
}));

import { GET, POST } from "../readings/route";
import { getReadings, createReading } from "@/lib/db/queries";
import type { Reading } from "@/lib/types";

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
});
