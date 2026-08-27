// Component tests for ErrorBoundary (ticket #2, AC-4).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function Bomb(): never {
  throw new Error("boom: intentional test render error");
}

describe("ErrorBoundary", () => {
  // React logs caught render errors via console.error — silence them so the
  // test output stays readable, and restore afterwards.
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders its children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>здорова дитина</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("здорова дитина")).toBeInTheDocument();
    expect(screen.queryByText("Щось пішло не так")).not.toBeInTheDocument();
  });

  it("catches a thrown render error and shows the fallback UI instead of crashing", () => {
    // If the boundary failed to catch, render() itself would throw and fail this test.
    expect(() =>
      render(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>
      )
    ).not.toThrow();

    // Fallback UI is shown…
    expect(screen.getByText("Щось пішло не так")).toBeInTheDocument();
    expect(
      screen.getByText("Сталася помилка. Спробуйте перезавантажити сторінку.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Перезавантажити/ })).toBeInTheDocument();
  });

  it("does not render the crashed child subtree in the fallback state", () => {
    render(
      <ErrorBoundary>
        <div>
          <span>sibling content</span>
          <Bomb />
        </div>
      </ErrorBoundary>
    );
    // The whole child subtree is replaced by the fallback.
    expect(screen.queryByText("sibling content")).not.toBeInTheDocument();
    expect(screen.getByText("Щось пішло не так")).toBeInTheDocument();
  });
});
