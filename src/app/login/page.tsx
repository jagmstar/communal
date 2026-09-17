"use client";

/**
 * /login — password gate for Communal (ticket step 1/2).
 * On success, POSTs to /api/login (sets the HMAC session cookie), then
 * redirects to `?next=` (set by proxy.ts) or "/".
 */

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { postLogin } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // Absolute URL on native (API_BASE), relative on web — see
      // src/lib/api.ts postLogin(). A plain fetch("/api/login") 404s in the
      // APK: the app runs from static dist/ assets with no local API server.
      const { ok, status } = await postLogin(password);
      if (ok) {
        const next = searchParams.get("next") || "/";
        router.replace(next);
        router.refresh();
      } else if (status === 429) {
        setError("Забагато спроб. Зачекайте хвилину і спробуйте ще раз.");
      } else {
        setError("Невірний пароль.");
      }
    } catch {
      setError("Помилка мережі, спробуйте ще раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/20">
            <Lock className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Communal</h1>
          <p className="text-body text-muted-foreground">
            Введіть пароль, щоб продовжити
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pw" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Пароль
            </label>
            <input
              id="pw"
              type="password"
              autoFocus
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body text-foreground outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              placeholder="••••••••••"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 px-4 py-3 font-semibold text-white shadow-lg shadow-primary-500/20 transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Увійти
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
