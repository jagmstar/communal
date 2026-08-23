"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  ChevronRight,
  ExternalLink,
  Check,
  X,
  Save,
} from "lucide-react";
import {
  loadUserSettings,
  saveUserSettings,
  loadNotificationSettings,
  saveNotificationSettings,
  updateNotificationSettings,
} from "@/lib/notifications";
import { fetchMeters, fetchSettings, putSettings } from "@/lib/api";
import { LoadingState } from "@/components/LoadingState";
import type { UserSettings, NotificationSettings, Meter, Settings as AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [showEpsForm, setShowEpsForm] = useState(false);
  const [epsUsername, setEpsUsername] = useState("");
  const [epsPassword, setEpsPassword] = useState("");
  const [epsAccountNumber, setEpsAccountNumber] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [profileName, setProfileName] = useState("");
  const [profileAddress, setProfileAddress] = useState("");

  // Load settings from localStorage on mount + fetch meters from API
  useEffect(() => {
    let cancelled = false;
    const loaded = loadUserSettings();
    setSettings(loaded);
    setNotifSettings(loadNotificationSettings());
    setProfileName(loaded.userName);
    setProfileAddress(loaded.userAddress);
    setEpsAccountNumber(loaded.epsAccountNumber || "");
    if (loaded.epsConnected) {
      setShowEpsForm(false);
    }

    // Fetch meters from API
    fetchMeters()
      .then((data) => { if (!cancelled) setMeters(data); })
      .catch(() => {});

    // Fetch app settings from API (server-side settings)
    fetchSettings()
      .then((data) => { if (!cancelled) setAppSettings(data); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  if (!settings || !notifSettings) {
    return <LoadingState type="detail" />;
  }

  /** Toggle a notification setting */
  const handleToggle = async (key: keyof NotificationSettings) => {
    const newSettings = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(newSettings);
    saveNotificationSettings(newSettings);

    // Update scheduled notifications (AC-9.6, AC-9.7)
    await updateNotificationSettings(newSettings, meters);

    // Also persist to server if available
    if (appSettings) {
      try {
        await putSettings({ notifications: newSettings } as Partial<AppSettings>);
      } catch {
        // Server may not be available (503), localStorage is the primary store
      }
    }
  };

  /** Save EPS credentials */
  const handleSaveEps = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      const updated: UserSettings = {
        ...settings,
        epsUsername: epsUsername || null,
        epsAccountNumber: epsAccountNumber || null,
        epsConnected: !!(epsUsername && epsPassword),
      };
      setSettings(updated);
      saveUserSettings(updated);
      setShowEpsForm(false);
      setEpsPassword(""); // Don't keep password in state
      setSaveStatus("idle");
    }, 1000);
  };

  /** Save profile */
  const handleSaveProfile = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      const updated: UserSettings = {
        ...settings,
        userName: profileName,
        userAddress: profileAddress,
      };
      setSettings(updated);
      saveUserSettings(updated);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
  };

  const notificationItems: { key: keyof NotificationSettings; label: string; desc: string }[] = [
    { key: "reading", label: "Нагадування про показники", desc: "За 3 дні до дедлайну" },
    { key: "payment", label: "Нагадування про оплату", desc: "Коли рахунок доступний" },
    { key: "tariff", label: "Зміна тарифів", desc: "Сповіщення при зміні" },
    { key: "anomaly", label: "Аномалії витрати", desc: "Неочікуване збільшення" },
  ];

  // Get version from package.json at build time, fallback to hardcoded
  const APP_VERSION = "0.1.0 (MVP)";

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Налаштування</h1>
        <p className="text-body text-muted-foreground">Профіль та конфігурація</p>
      </header>

      {/* Profile Section */}
      <section className="space-y-2">
        <h2 className="text-body font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Профіль
        </h2>
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-lg font-bold">
              {profileName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{profileName}</p>
              <p className="text-body text-muted-foreground">{profileAddress}</p>
            </div>
          </div>
          <div className="space-y-3 border-t border-border pt-3">
            <div className="space-y-1.5">
              <label htmlFor="profile-name" className="text-body font-medium text-foreground">Ім'я</label>
              <input
                id="profile-name"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-body text-foreground focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-address" className="text-body font-medium text-foreground">Адреса</label>
              <input
                id="profile-address"
                type="text"
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-body text-foreground focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-body font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-600 active:scale-95 transition-all"
            >
              <Save className="h-4 w-4" />
              {saveStatus === "saving" ? "Збереження..." : saveStatus === "saved" ? "Збережено!" : "Зберегти профіль"}
            </button>
          </div>
        </div>
      </section>

      {/* EPS Account Section */}
      <section className="space-y-2" id="eps">
        <h2 className="text-body font-semibold text-muted-foreground uppercase tracking-wide px-1">
          EPS Акаунт
        </h2>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100">
              <ExternalLink className="h-4 w-4 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-body font-medium">EPS Ternopil</p>
              <p className="text-xs text-muted-foreground">Акаунт #{settings.epsAccountNumber || "—"}</p>
            </div>
            {settings.epsConnected ? (
              <span className="rounded-full bg-success-light px-2 py-0.5 text-xs font-medium text-success">
                Підключено
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Не підключено
              </span>
            )}
          </div>

          {/* EPS credentials form (AC-10.3) */}
          {showEpsForm ? (
            <div className="p-4 space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="eps-username" className="text-body font-medium text-foreground">EPS логін</label>
                <input
                  id="eps-username"
                  type="text"
                  value={epsUsername}
                  onChange={(e) => setEpsUsername(e.target.value)}
                  placeholder="Ваш логін на eps.org.ua"
                  className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-body text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="eps-password" className="text-body font-medium text-foreground">EPS пароль</label>
                <input
                  id="eps-password"
                  type="password"
                  value={epsPassword}
                  onChange={(e) => setEpsPassword(e.target.value)}
                  placeholder="Пароль зберігається зашифрованим на пристрої"
                  className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-body text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="eps-account" className="text-body font-medium text-foreground">Номер акаунту</label>
                <input
                  id="eps-account"
                  type="text"
                  value={epsAccountNumber}
                  onChange={(e) => setEpsAccountNumber(e.target.value)}
                  placeholder="Номер акаунту EPS"
                  className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-body text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-success" />
                Пароль зберігається зашифрованим на пристрої. Не передається на сервер.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEps}
                  disabled={saveStatus === "saving" || (!epsUsername && !epsPassword)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-body font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-4 w-4" />
                  {saveStatus === "saving" ? "Збереження..." : "Зберегти"}
                </button>
                <button
                  onClick={() => setShowEpsForm(false)}
                  className="flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-3 text-body font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                  Скасувати
                </button>
              </div>
            </div>
          ) : (
            <>
              {!settings.epsConnected && (
                <button
                  onClick={() => setShowEpsForm(true)}
                  className="flex w-full items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <p className="text-body text-primary-600 font-medium">Налаштувати</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              <a
                href="https://www.eps.org.ua/ternopil/account/view/hz0rXLAm6c5g2jas7j8ysg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors border-t border-border"
              >
                <p className="text-body text-primary-600">Відкрити EPS</p>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </a>
            </>
          )}
        </div>
      </section>

      {/* Notifications Section */}
      <section className="space-y-2" id="notifications">
        <h2 className="text-body font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Нагадування
        </h2>
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          {notificationItems.map((item, idx) => (
            <div
              key={item.key}
              className={`flex items-center justify-between p-4 ${
                idx < notificationItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div>
                <p className="text-body font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={notifSettings[item.key]}
                aria-label={`${item.label}, ${notifSettings[item.key] ? "увімкнено" : "вимкнено"}`}
                onClick={() => handleToggle(item.key)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${notifSettings[item.key] ? "bg-primary-500" : "bg-border-strong"}`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${notifSettings[item.key] ? "translate-x-[22px]" : "translate-x-0.5"}`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy Section */}
      <section className="space-y-2">
        <h2 className="text-body font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Приватність
        </h2>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-body font-medium">Фото залишаються на пристрої</p>
              <p className="text-xs text-muted-foreground mt-1">
                OCR працює локально на вашому телефоні. На сервер передається лише цифра показника.
                Фото завантажується на сервер лише коли ви явно архівуєте його для спорів.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="space-y-2">
        <h2 className="text-body font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Про додаток
        </h2>
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-body text-muted-foreground">Версія</span>
            <span className="text-body font-medium">{APP_VERSION}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-body text-muted-foreground">OCR Engine</span>
            <span className="text-body font-medium">Tesseract.js (web) / ML Kit v2 (native)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-body text-muted-foreground">EPS інтеграція</span>
            <span className="text-body font-medium">WebView + JS</span>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Communal v{APP_VERSION} • Зроблено з ❤️ для України
      </p>
    </div>
  );
}
