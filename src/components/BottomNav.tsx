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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          if (tab.primary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/30 transition-transform active:scale-95">
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-medium text-primary">{tab.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
