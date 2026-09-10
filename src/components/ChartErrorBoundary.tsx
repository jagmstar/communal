"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { BarChart3 } from "lucide-react";

interface ChartErrorBoundaryProps {
  children: ReactNode;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
}

/**
 * 2026-09-10 QA fix — root cause investigation for the "ErrorBoundary crash
 * at ~1150px" report (see qa/2026-09-10/).
 *
 * Recharts' <ResponsiveContainer> drives itself with a raw `ResizeObserver`
 * (see node_modules/recharts/es6/component/ResponsiveContainer.js). During a
 * live window resize that crosses a layout breakpoint — e.g. a flex/overflow
 * reflow right around 1150px on this page's meter-tab row — the observer can
 * fire with a container mid-reflow at a transient 0×0 or otherwise degenerate
 * size. Recharts' own scale/domain math (and ours in UsageChart's
 * `niceMax`/`tickCount` calculation) isn't guaranteed to handle every
 * transient input gracefully, and because the ResizeObserver callback
 * triggers a synchronous React state update, any resulting render throw
 * happens inside React's normal render pass — which is exactly what trips
 * the *global* ErrorBoundary in src/app/layout.tsx and takes down the whole
 * page (nav included) instead of just the chart.
 *
 * This was never reliably reproducible in headless Playwright (fixed
 * viewports, scripted resize sweeps 1140–1160px, and rapid-fire resize
 * storms all passed clean — see qa/2026-09-10/before/*-log.txt) which is
 * consistent with a real-OS-resize-only timing issue rather than a
 * deterministic layout bug. Rather than ship a fix for a root cause that
 * can't be confirmed, this isolates the blast radius: a chart-internal
 * render failure now shows a small inline fallback instead of replacing the
 * entire page (header, nav, other cards) with "Щось пішло не так". The user
 * can keep navigating; only the chart itself needs a data refresh.
 */
export class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ChartErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ChartErrorBoundary caught a chart render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[180px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Графік тимчасово недоступний</p>
        </div>
      );
    }

    return this.props.children;
  }
}
