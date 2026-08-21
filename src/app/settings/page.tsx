"use client";

import { User, CreditCard, Bell, Shield, Info, ChevronRight, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="px-4 pt-12 pb-4 space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Налаштування</h1>
        <p className="text-sm text-muted-foreground">Профіль та конфігурація</p>
      </header>

      {/* Profile */}
      <section className="rounded-2xl border border-border bg-card p-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 text-white text-lg font-bold">
            РК
          </div>
          <div className="flex-1">
            <p className="font-semibold">Роман Крепич</p>
            <p className="text-sm text-muted-foreground">вул. Карпенка 18а/76, Тернопіль</p>
          </div>
        </div>
      </section>

      {/* EPS Account */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          EPS Акаунт
        </h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
              <ExternalLink className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">EPS Ternopil</p>
              <p className="text-xs text-muted-foreground">Акаунт #2099000225595</p>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
              Підключено
            </span>
          </div>
          <a
            href="https://www.eps.org.ua/ternopil/account/view/hz0rXLAm6c5g2jas7j8ysg"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
          >
            <p className="text-sm text-primary">Відкрити EPS</p>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </a>
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Нагадування
        </h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {[
            { label: "Нагадування про показники", desc: "За 3 дні до дедлайну", enabled: true },
            { label: "Нагадування про оплату", desc: "Коли рахунок доступний", enabled: true },
            { label: "Зміна тарифів", desc: "Сповіщення при зміні", enabled: false },
            { label: "Аномалії витрати", desc: "Неочікуване збільшення", enabled: true },
          ].map((item, idx, arr) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-4 ${
                idx < arr.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  item.enabled ? "bg-primary" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    item.enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Приватність
        </h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Фото залишаються на пристрої</p>
              <p className="text-xs text-muted-foreground mt-1">
                OCR працює локально на вашому телефоні. На сервер передається лише цифра показника.
                Фото завантажується на сервер лише коли ви явно архівуєте його для спорів.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Про додаток
        </h2>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Версія</span>
            <span className="text-sm font-medium">0.1.0 (MVP)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">OCR Engine</span>
            <span className="text-sm font-medium">Google ML Kit v2</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">EPS інтеграція</span>
            <span className="text-sm font-medium">WebView + JS</span>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Communal v0.1.0 • Зроблено з ❤️ для України
      </p>
    </div>
  );
}
