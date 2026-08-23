import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/queries", () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  getSql: vi.fn(),
}));

import { GET, PUT } from "../settings/route";
import { getSettings, updateSettings } from "@/lib/db/queries";
import type { Settings } from "@/lib/types";

const mockSettings: Settings = {
  epsUsername: "roman.krepych",
  epsAccountNumber: "2099000225595",
  notificationReading: true,
  notificationPayment: true,
  notificationTariff: false,
  notificationAnomaly: true,
  userName: "Роман Крепич",
  userAddress: "м. Тернопіль",
};

function makeRequest(url: string, options: { method?: string; body?: unknown } = {}) {
  const init: RequestInit = { method: options.method ?? "GET" };
  if (options.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }
  return new Request(url, init) as any;
}

describe("GET /api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns settings", async () => {
    (getSettings as any).mockResolvedValue(mockSettings);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.epsUsername).toBe("roman.krepych");
    expect(json.data.notificationReading).toBe(true);
  });

  it("returns 500 on database error", async () => {
    (getSettings as any).mockRejectedValue(new Error("Connection failed"));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("налаштування");
  });

  it("returns 503 when DATABASE_URL not configured", async () => {
    (getSettings as any).mockRejectedValue(
      new Error("DATABASE_URL environment variable is not set")
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toContain("Базу даних");
  });
});

describe("PUT /api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates settings with valid data", async () => {
    const updated = { ...mockSettings, userName: "Нове Ім'я" };
    (updateSettings as any).mockResolvedValue(updated);

    const req = makeRequest("http://localhost:3000/api/settings", {
      method: "PUT",
      body: { userName: "Нове Ім'я" },
    });
    const response = await PUT(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.userName).toBe("Нове Ім'я");
    expect(updateSettings).toHaveBeenCalledWith({ userName: "Нове Ім'я" });
  });

  it("updates notification settings", async () => {
    const updated = { ...mockSettings, notificationTariff: true };
    (updateSettings as any).mockResolvedValue(updated);

    const req = makeRequest("http://localhost:3000/api/settings", {
      method: "PUT",
      body: { notificationTariff: true },
    });
    const response = await PUT(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.notificationTariff).toBe(true);
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost:3000/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "not json{",
    }) as any;

    const response = await PUT(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("JSON");
  });

  it("returns 500 on database error", async () => {
    (updateSettings as any).mockRejectedValue(new Error("Connection failed"));

    const req = makeRequest("http://localhost:3000/api/settings", {
      method: "PUT",
      body: { userName: "Test" },
    });
    const response = await PUT(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("налаштування");
  });
});
