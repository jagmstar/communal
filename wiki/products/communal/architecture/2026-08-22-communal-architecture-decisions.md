# Communal — Architecture Decisions

| Поле | Значення |
|------|----------|
| **Документ** | Architecture Decisions |
| **Продукт** | Communal |
| **Автор** | Clark (COO Twin) |
| **Дата** | 2026-08-22 |
| **Статус** | Approved for Development |

---

## AD-1: Next.js Deployment Strategy

**Decision**: Deploy to Vercel as a standard Next.js app (NOT static export).

**Rationale**: The PRD flagged that `output: 'export'` (static export) conflicts with API routes. Since the app needs server-side API routes for database access (US-12, US-13), we cannot use static export. Vercel's free tier supports serverless API routes natively.

**Impact**:
- `next.config.ts` stays empty (no `output: 'export'`)
- API routes go in `src/app/api/` directory
- Server actions or API routes for data mutations
- Neon Postgres via `@neondatabase/serverless` (already installed)

## AD-2: Android via Capacitor

**Decision**: Use Capacitor to wrap the Vercel-deployed URL as a WebView app.

**Rationale**: Capacitor with `server.url` pointing to the Vercel deployment gives us:
1. Full Next.js server capabilities (API routes, server components)
2. Native device access (camera, notifications) via Capacitor plugins
3. No static export needed
4. Simple deployment: update Vercel → Android app auto-updates

**Implementation**:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init Communal com.krepych.comunal --web-dir=dist
# capacitor.config.ts: server.url = https://communal.vercel.app
```

**Native plugins needed**:
- `@capacitor/camera` — for US-2 (photo capture)
- `@capacitor/local-notifications` — for US-9 (reminders)
- `@capacitor/inappbrowser` — for US-4 (EPS WebView)
- `@capacitor-community/mlkit-ocr` or Tesseract.js — for US-3 (OCR)

## AD-3: Database Schema (Neon Postgres)

**Decision**: 4 tables matching PRD US-12 acceptance criteria.

```sql
-- meters table
CREATE TABLE meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_number TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('water', 'electricity', 'gas', 'osbb', 'other')),
  service_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  last_reading NUMERIC,
  last_reading_date DATE,
  submit_deadline_day INTEGER NOT NULL,
  submit_window_start INTEGER NOT NULL,
  color TEXT NOT NULL,
  color_light TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- readings table
CREATE TABLE readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID REFERENCES meters(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  date DATE NOT NULL,
  photo_url TEXT,
  ocr_confidence REAL,
  ocr_engine TEXT CHECK (ocr_engine IN ('mlkit', 'azure', 'manual')),
  submitted_to_eps BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- tariffs table
CREATE TABLE tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  effective_from DATE NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- settings table (singleton)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  eps_username TEXT,
  eps_account_number TEXT,
  eps_password_encrypted TEXT, -- encrypted on device, not stored in plaintext
  notification_reading BOOLEAN DEFAULT TRUE,
  notification_payment BOOLEAN DEFAULT TRUE,
  notification_tariff BOOLEAN DEFAULT FALSE,
  notification_anomaly BOOLEAN DEFAULT TRUE,
  user_name TEXT,
  user_address TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Seed data**: Migrate existing mock data from `mockData.ts` into seed SQL.

## AD-4: Color System Fix

**Decision**: Replace all blue-500 references with teal-500 (#14b8a6) per DESIGN_SYSTEM.md.

**Files to update**:
- `src/app/globals.css` — `--primary: #2563eb` → `--primary: #14b8a6`
- `src/app/page.tsx` — `from-blue-600 to-blue-500` → `from-teal-600 to-teal-500`
- `src/components/BottomNav.tsx` — `from-blue-600 to-blue-500` → `from-teal-600 to-teal-500`
- `src/lib/types.ts` — `SERVICE_CONFIG.water.color: "#3b82f6"` → `"#0ea5e9"` (cyan-teal per DESIGN_SYSTEM.md)
- All `text-primary`, `bg-primary` references auto-update via CSS variables

## AD-5: EPS Integration (eps.org.ua)

**Decision**: WebView + JavaScript injection (no public API available).

**Flow**:
1. User taps "Передати на EPS" (US-4)
2. App opens hidden InAppBrowser to eps.org.ua
3. JS injection: fill username/password → submit login form
4. Navigate to meter reading submission page
5. JS injection: fill meter number + reading value → submit form
6. Parse response for success/failure
7. Close InAppBrowser, show result to user

**Security**: EPS credentials stored encrypted on device (Capacitor SecureStorage). Never sent to server.

**Fallback**: If WebView injection fails, offer "Open EPS manually" link (AC-4.4).

## AD-6: OCR Strategy

**Decision**: Google ML Kit Text Recognition v2 (on-device, no server call).

**Rationale**: AC-2.5 requires "Фото залишається на пристрої. На сервер передається лише цифра." ML Kit runs entirely on-device.

**Implementation**:
- Capacitor plugin: `@capacitor-community/mlkit-ocr` or native bridge
- Fallback: Tesseract.js (pure JS, slower but no native dependency)
- Manual input fallback if OCR fails (AC-3.7)

## AD-7: API Route Structure

**Decision**: Next.js API routes in `src/app/api/`.

```
src/app/api/
  meters/route.ts        — GET: list all meters
  readings/route.ts      — GET: list readings (?meterId=), POST: create reading
  tariffs/route.ts        — GET: list tariffs
  settings/route.ts       — GET: settings, PUT: update settings
```

All routes use `@neondatabase/serverless` with `DATABASE_URL` from environment.

## Open Questions for Roman (from PRD)

**OQ-1**: Should the app support multiple users/households or just Roman's? → **Single user (Roman only) for MVP.**

**OQ-2**: What EPS account number should be pre-configured? → **Already in settings page: #2099000225595**

**OQ-5**: Should the app work offline (queue readings for later submission)? → **MVP: online only. Future: offline queue.**

**OQ-8**: App name confirmation: "Communal"? → **Yes, confirmed.**

## Open Questions for Architect (from PRD) — RESOLVED

**OQ-3**: Static export vs API routes → **AD-1: No static export, deploy to Vercel.**
**OQ-4**: How to handle EPS credentials securely → **AD-5: Encrypted on device, never on server.**
**OQ-6**: OCR engine choice → **AD-6: Google ML Kit v2, on-device.**
**OQ-7**: Neon connection string → **Need from Roman. Neon project exists (see R197). Need DATABASE_URL env var on Vercel.**
