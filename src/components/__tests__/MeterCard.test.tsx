// Component tests for MeterCard (ticket #2, AC-3).
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MeterCard } from "@/components/MeterCard";
import type { Meter } from "@/lib/types";

const waterMeter: Meter = {
  id: "m-water",
  meterNumber: "WTR-001",
  serviceType: "water",
  serviceName: "Вода",
  unit: "м³",
  lastReading: 123.4,
  lastReadingDate: "2026-08-01",
  submitDeadlineDay: 25,
  submitWindowStart: 20,
  color: "#0ea5e9",
  colorLight: "#e0f2fe",
  icon: "droplet",
};

const electricityMeter: Meter = {
  ...waterMeter,
  id: "m-elec",
  meterNumber: "ELC-777",
  serviceType: "electricity",
  serviceName: "Електроенергія",
  unit: "кВт·год",
  lastReading: 12453,
  icon: "zap",
};

describe("MeterCard — non-compact (default) mode", () => {
  it("renders serviceName, meterNumber and the formatted last reading", () => {
    render(<MeterCard meter={waterMeter} />);
    expect(screen.getByText("Вода")).toBeInTheDocument();
    expect(screen.getByText(/WTR-001/)).toBeInTheDocument();
    // non-electricity readings are formatted with toFixed(2)
    expect(screen.getByText(/123\.40/)).toBeInTheDocument();
    // non-compact mode also shows the submit deadline
    expect(screen.getByText("Передати до")).toBeInTheDocument();
    expect(screen.getByText(/25 числа/)).toBeInTheDocument();
  });

  it("formats electricity readings with uk-UA locale grouping", () => {
    render(<MeterCard meter={electricityMeter} />);
    const expected = (12453).toLocaleString("uk-UA"); // e.g. "12 453"
    expect(screen.getByText(new RegExp(expected.replace(/\s/g, "\\s")))).toBeInTheDocument();
    expect(screen.getByText("Електроенергія")).toBeInTheDocument();
  });

  it("fires onClick when the card is clicked", () => {
    const onClick = vi.fn();
    render(<MeterCard meter={waterMeter} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("MeterCard — compact mode", () => {
  it("renders serviceName, meterNumber and the formatted last reading", () => {
    render(<MeterCard meter={waterMeter} compact />);
    expect(screen.getByText("Вода")).toBeInTheDocument();
    expect(screen.getByText(/WTR-001/)).toBeInTheDocument();
    expect(screen.getByText("123.40")).toBeInTheDocument();
    // compact mode does NOT show the deadline row
    expect(screen.queryByText("Передати до")).not.toBeInTheDocument();
  });

  it("fires onClick when the compact card is clicked", () => {
    const onClick = vi.fn();
    render(<MeterCard meter={waterMeter} compact onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("falls back to 0 when lastReading is null", () => {
    render(<MeterCard meter={{ ...waterMeter, lastReading: null }} compact />);
    expect(screen.getByText("0.00")).toBeInTheDocument();
  });
});
