"use client";

/**
 * Listens for the "communal:unauthorized" event (dispatched by
 * src/lib/api.ts's handleUnauthorized on any 401) and redirects to /login
 * via the Next.js client router — NOT window.location.href.
 *
 * Why this has to be a router.push and not a hard navigation: see the long
 * comment on handleUnauthorized() in src/lib/api.ts. Short version — the
 * mobile static export runs under Capacitor's default html5mode, whose
 * local WebView server resolves ANY extensionless hard-navigation path to
 * index.html (Home), never login.html. A hard nav to "/login" silently
 * reopens Home, which 401s again, which fires this event again: an
 * infinite loop that looks like a stuck "Не вдалося завантажити дані"
 * screen. router.push() is an in-SPA transition handled entirely by
 * Next.js's already-mounted client router — it never touches Capacitor's
 * asset resolution, so this failure mode does not apply.
 */
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function UnauthorizedRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onUnauthorized(e: Event) {
      if (pathname === "/login") return;
      const detail = (e as CustomEvent<{ next: string }>).detail;
      const next = detail?.next ?? encodeURIComponent(pathname);
      router.push(`/login?next=${next}`);
    }
    window.addEventListener("communal:unauthorized", onUnauthorized);
    return () => window.removeEventListener("communal:unauthorized", onUnauthorized);
  }, [router, pathname]);

  return null;
}
