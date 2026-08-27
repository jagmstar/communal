// Component tests for the readings-submit flow, src/app/submit/page.tsx (ticket #2, AC-2).
//
// The page is exercised as a user would: select a meter → choose manual entry →
// type a value → submit. Network (fetchMeters/postReading) and next/navigation
// are mocked; everything else (MeterCard, rollover logic, state machine) is real.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Meter } from "@/lib/types";

const routerPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

const meters: Meter[] = [
  {
    id: "m-water",
    meterNumber: "WTR-001",
    serviceType: "water",
    serviceName: "Вода",
    unit: "м³",
    lastReading: 100,
    lastReadingDate: "2026-08-01",
    submitDeadlineDay: 25,
    submitWindowStart: 20,
    color: "#0ea5e9",
    colorLight: "#e0f2fe",
    icon: "droplet",
  },
  {
    id: "m-elec",
    meterNumber: "ELC-777",
    serviceType: "electricity",
    serviceName: "Електроенергія",
    unit: "кВт·год",
    lastReading: 12453,
    lastReadingDate: "2026-08-01",
    submitDeadlineDay: 25,
    submitWindowStart: 20,
    color: "#f59e0b",
    colorLight: "#fef3c7",
    icon: "zap",
  },
];

const fetchMetersMock = vi.fn();
const postReadingMock = vi.fn();
vi.mock("@/lib/api", () => ({
  fetchMeters: (...args: unknown[]) => fetchMetersMock(...args),
  postReading: (...args: unknown[]) => postReadingMock(...args),
}));

// Import AFTER vi.mock declarations (vitest hoists mocks, but keep it explicit).
import SubmitPage from "@/app/submit/page";

/** Render the page and walk it to the manual-entry confirm step for the water meter. */
async function goToManualConfirm() {
  render(<SubmitPage />);
  // Wait for meters to load (select step)
  const meterButton = await screen.findByRole("button", { name: /Вода, лічильник номер WTR-001/ });
  fireEvent.click(meterButton);
  // Photo step → choose the manual-entry fallback
  const manualButtons = await screen.findAllByRole("button", { name: /Ввести вручну/ });
  fireEvent.click(manualButtons[manualButtons.length - 1]);
  // Confirm step, manual mode
  return await screen.findByLabelText("Введіть показник");
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMetersMock.mockResolvedValue(meters);
  postReadingMock.mockResolvedValue({ id: "r-1" });
});

describe("SubmitPage — select step", () => {
  it("lists the meters returned by the API after loading", async () => {
    render(<SubmitPage />);
    expect(await screen.findByText("Передати показники")).toBeInTheDocument();
    expect(screen.getByText("Вода")).toBeInTheDocument();
    expect(screen.getByText("Електроенергія")).toBeInTheDocument();
    expect(fetchMetersMock).toHaveBeenCalledTimes(1);
  });
});

describe("SubmitPage — manual-entry path (AC-2a)", () => {
  it("renders the manual input on the confirm step and accepts a typed value", async () => {
    const input = await goToManualConfirm();
    expect(input).toBeInTheDocument();
    expect(screen.getByText("Перевірте показник")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "150.5" } });
    expect(input).toHaveValue("150.5");
    // The previous reading hint is shown for context
    expect(screen.getByText(/Попередній показник: 100/)).toBeInTheDocument();
  });
});

describe("SubmitPage — lower-than-last-reading warning (AC-2b)", () => {
  it("shows the warning banner when the entered value is below lastReading", async () => {
    const input = await goToManualConfirm();
    fireEvent.change(input, { target: { value: "50" } }); // 50 < lastReading 100
    expect(
      screen.getByText(/Показник менший за попередній \(100\)\. Перевірте значення\./)
    ).toBeInTheDocument();
    // 50% drop is NOT a plausible rollover → submit stays blocked, no rollover checkbox
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Передати на EPS/ })).toBeDisabled();
  });

  it("does not show the warning for a value above lastReading", async () => {
    const input = await goToManualConfirm();
    fireEvent.change(input, { target: { value: "150" } });
    expect(screen.queryByText(/Показник менший за попередній/)).not.toBeInTheDocument();
  });

  it("offers the rollover acknowledgment only for a plausible (>95% drop) rollover, and it unblocks submit", async () => {
    const input = await goToManualConfirm();
    fireEvent.change(input, { target: { value: "2" } }); // 2 < 100 * 0.05 → plausible rollover
    expect(screen.getByText(/Показник менший за попередній/)).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox");
    const submit = screen.getByRole("button", { name: /Передати на EPS/ });
    expect(submit).toBeDisabled();
    fireEvent.click(checkbox);
    expect(submit).toBeEnabled();
  });
});

describe("SubmitPage — submit button gating (AC-2c)", () => {
  it("is disabled while the value is empty and enabled once a valid value is typed", async () => {
    const input = await goToManualConfirm();
    const submit = screen.getByRole("button", { name: /Передати на EPS/ });
    expect(input).toHaveValue("");
    expect(submit).toBeDisabled();
    fireEvent.change(input, { target: { value: "150" } });
    expect(submit).toBeEnabled();
    fireEvent.change(input, { target: { value: "" } });
    expect(submit).toBeDisabled();
  });
});

describe("SubmitPage — successful submission", () => {
  it("POSTs the reading with manual OCR metadata and reaches the done step", async () => {
    const input = await goToManualConfirm();
    fireEvent.change(input, { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: /Передати на EPS/ }));
    await screen.findByText("Готово! ✅");
    expect(postReadingMock).toHaveBeenCalledTimes(1);
    expect(postReadingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        meterId: "m-water",
        value: 150,
        ocrEngine: "manual",
        ocrConfidence: 0,
        allowRollover: false,
      })
    );
    expect(screen.getByText(/150 м³/)).toBeInTheDocument();
  });

  it("shows the local-save notice when the API call fails (offline fallback)", async () => {
    postReadingMock.mockRejectedValueOnce(new Error("503"));
    const input = await goToManualConfirm();
    fireEvent.change(input, { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: /Передати на EPS/ }));
    await screen.findByText("Готово! ✅");
    expect(screen.getByText(/показник збережено локально/)).toBeInTheDocument();
  });
});
