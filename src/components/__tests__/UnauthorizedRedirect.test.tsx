// Component test for UnauthorizedRedirect (APK auth fix, 2026-09-17).
//
// Regression coverage for the actual bug this ticket found in the QA
// emulator run: src/lib/api.ts's handleUnauthorized() used to do
// `window.location.href = "/login"` (a hard navigation), which Capacitor's
// static-export html5mode resolves to index.html (Home), not login.html —
// an invisible infinite 401 loop. This component listens for the
// "communal:unauthorized" event and drives next/navigation's router
// instead, which is a same-SPA transition.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { UnauthorizedRedirect } from "@/components/UnauthorizedRedirect";

const routerPush = vi.fn();
let currentPathname = "/history";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
  usePathname: () => currentPathname,
}));

describe("UnauthorizedRedirect", () => {
  beforeEach(() => {
    routerPush.mockClear();
    currentPathname = "/history";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes to /login with the event's next= on communal:unauthorized", () => {
    render(<UnauthorizedRedirect />);
    window.dispatchEvent(
      new CustomEvent("communal:unauthorized", { detail: { next: "%2Fhistory" } })
    );
    expect(routerPush).toHaveBeenCalledWith("/login?next=%2Fhistory");
  });

  it("does not push again when already on /login", () => {
    currentPathname = "/login";
    render(<UnauthorizedRedirect />);
    window.dispatchEvent(
      new CustomEvent("communal:unauthorized", { detail: { next: "%2Fhistory" } })
    );
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("falls back to the current pathname when the event has no detail", () => {
    render(<UnauthorizedRedirect />);
    window.dispatchEvent(new CustomEvent("communal:unauthorized"));
    expect(routerPush).toHaveBeenCalledWith("/login?next=%2Fhistory");
  });

  it("uses router.push, never a hard navigation (the bug this fixes)", () => {
    const originalHref = window.location.href;
    render(<UnauthorizedRedirect />);
    window.dispatchEvent(
      new CustomEvent("communal:unauthorized", { detail: { next: "%2Fhistory" } })
    );
    expect(window.location.href).toBe(originalHref);
    expect(routerPush).toHaveBeenCalledTimes(1);
  });
});
