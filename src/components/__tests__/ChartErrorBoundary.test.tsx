// Component tests for ChartErrorBoundary (2026-09-10 QA fix, qa/2026-09-10/).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartErrorBoundary } from "@/components/ChartErrorBoundary";

function Bomb(): never {
  throw new Error("boom: intentional chart render error");
}

describe("ChartErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders its children when nothing throws", () => {
    render(
      <ChartErrorBoundary>
        <p>chart content</p>
      </ChartErrorBoundary>
    );
    expect(screen.getByText("chart content")).toBeInTheDocument();
  });

  it("catches a chart render error and shows a local fallback instead of crashing the whole page", () => {
    expect(() =>
      render(
        <div>
          <p>sibling page content — must survive a chart crash</p>
          <ChartErrorBoundary>
            <Bomb />
          </ChartErrorBoundary>
        </div>
      )
    ).not.toThrow();

    // The rest of the page (outside the chart boundary) is untouched.
    expect(screen.getByText("sibling page content — must survive a chart crash")).toBeInTheDocument();
    // The chart itself shows a small inline fallback, not the global
    // "Щось пішло не так" screen.
    expect(screen.getByText("Графік тимчасово недоступний")).toBeInTheDocument();
    expect(screen.queryByText("Щось пішло не так")).not.toBeInTheDocument();
  });
});
