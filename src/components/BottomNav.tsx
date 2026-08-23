"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, BarChart3, Settings } from "lucide-react";

const tabs = [
  { href: "/", label: "Головна", icon: Home },
  { href: "/submit", label: "Передати", icon: Camera, primary: true },
  { href: "/history", label: "Історія", icon: BarChart3 },
  { href: "/settings", label: "Налаштування", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Основна навігація" className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/90 backdrop-blur-lg shadow-xl">
      <div className="mx-auto flex max-w-md items-end justify-around px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          if (tab.primary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-1"
                aria-label="Передати показники, відкрити камеру"
                aria-current={isActive ? "page" : undefined}
              >
                <div className={`flex h-14 w-14 -mt-6 items-center justify-center rounded-full bg-gradient-to-br from-secondary-500 to-secondary-600 shadow-lg shadow-secondary-500/30 transition-transform active:scale-95 ${isActive ? "ring-2 ring-primary-500 ring-offset-2" : ""}`}>
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <span className={`text-[11px] font-medium ${isActive ? "text-primary-600" : "text-secondary-600"}`}>{tab.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                isActive ? "text-primary-600" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
