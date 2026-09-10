// Component tests for UsageChart's guard against non-finite values
// (2026-09-10 QA fix, qa/2026-09-10/ — see ChartErrorBoundary.tsx writeup).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { UsageChart } from "@/components/UsageChart";

describe("UsageChart", () => {
  beforeEach(() => {
    // recharts logs warnings for zero-size containers under jsdom (no real
    // layout engine); silence to keep test output readable.
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders normally with well-formed usage data", () => {
    expect(() =>
      render(
        <UsageChart
          data={[
            { month: "черв.", usage: 2.11, cost: 74.27 },
            { month: "лип.", usage: 2.11, cost: 74.27 },
          ]}
          unit="м³"
        />
      )
    ).not.toThrow();
  });

  it("does not throw when a data point contains NaN (e.g. a transient/degenerate upstream value)", () => {
    expect(() =>
      render(
        <UsageChart
          data={[
            { month: "черв.", usage: NaN, cost: NaN },
            { month: "лип.", usage: 2.11, cost: 74.27 },
          ]}
          unit="м³"
        />
      )
    ).not.toThrow();
  });

  it("does not throw with an empty data array", () => {
    expect(() => render(<UsageChart data={[]} unit="м³" />)).not.toThrow();
  });

  it("does not throw when every value is non-finite", () => {
    expect(() =>
      render(
        <UsageChart
          data={[
            { month: "черв.", usage: Infinity, cost: -Infinity },
            { month: "лип.", usage: NaN, cost: NaN },
          ]}
          unit="м³"
        />
      )
    ).not.toThrow();
  });
});
