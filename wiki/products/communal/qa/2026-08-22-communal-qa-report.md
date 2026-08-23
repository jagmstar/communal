# Communal — QA Report

| Field | Value |
|------|-------|
| **Document** | QA Report |
| **Product** | Communal |
| **Tester** | Senior QA Engineer (JAGM-TWIN) |
| **Date** | 2026-08-22 |
| **PRD** | [2026-08-22-communal-prd.md](../prd/2026-08-22-communal-prd.md) |
| **Architecture** | [2026-08-22-communal-architecture-decisions.md](../architecture/2026-08-22-communal-architecture-decisions.md) |
| **Status** | Complete |

---

## Summary

| Metric | Count |
|--------|-------|
| Total ACs verified | 75 |
| Pass | 48 |
| Partial | 18 |
| Fail | 9 |
| TypeScript (`tsc --noEmit`) | PASS |
| Build (`next build`) | PASS |

**Build output:**
- Static pages: `/`, `/_not-found`, `/history`, `/settings`, `/submit`
- Dynamic API routes: `/api/meters`, `/api/readings`, `/api/settings`, `/api/tariffs`
- TypeScript: 0 errors
- Compilation: success in 4.8s (Turbopack)

---

## Detailed Results

### US-1: Home Page — Meter Selection

| AC | Status | Evidence |
|----|--------|----------|
| AC-1.1 | **PARTIAL** | `src/app/submit/page.tsx:249-265` — Meter list shown on Submit page with MeterCard (compact). Shows service name, meter number, last reading, unit. However, **last reading date is not displayed** in compact card mode — only shown in full MeterCard on home page (`src/components/MeterCard.tsx:76-87`). |
| AC-1.2 | **PASS** | `src/app/submit/page.tsx:48-56` — `handleMeterSelect(meterId)` navigates to photo step (`setStep("photo")`). |
| AC-1.3 | **PASS** | `src/app/submit/page.tsx:274,378-379` — Photo and confirm steps show `{selectedMeter.serviceName} • №{selectedMeter.meterNumber}` in header. |
| AC-1.4 | **PASS** | `src/app/submit/page.tsx:235-246` — Back button shown on all steps except `"select"` and `"done"`. Navigates to previous step. |

### US-2: Photo Capture

| AC | Status | Evidence |
|----|--------|----------|
| AC-2.1 | **PARTIAL** | `src/app/submit/page.tsx:279` — Camera viewfinder area uses `aspect-[3/4]` ratio with scanning frame overlay at `top-1/4 bottom-1/4` (line 298). However, the spec says "60% of screen height" — the implementation uses a 3:4 aspect ratio container, not an exact 60% height. Close but not exact. |
| AC-2.2 | **PASS** | `src/app/submit/page.tsx:291-294` — Tip text: "Наведіть камеру на дисплей лічильника. Цифри мають бути чітко видимими." matches AC-2.2 exactly. |
| AC-2.3 | **PASS** | `src/app/submit/page.tsx:173-179,328-344` — `handleCapture()` triggers either native camera (`takePhoto()`) or file input. Photo passed to `runOcr()`. |
| AC-2.4 | **PASS** | `src/app/submit/page.tsx:330` — `disabled={isCapturing}` prevents duplicate capture. Button shows spinner when capturing. |
| AC-2.5 | **PASS** | `src/app/submit/page.tsx:347-352` — Privacy notice: "Фото залишається на пристрої. На сервер передається лише цифра." matches AC-2.5. |
| AC-2.6 | **PASS** | `src/app/submit/page.tsx:309-325` — Camera error shows "Камера недоступна. Перевірте дозволи додатка." with manual input fallback button. |

### US-3: OCR Text Recognition

| AC | Status | Evidence |
|----|--------|----------|
| AC-3.1 | **PARTIAL** | `src/app/submit/page.tsx:367-370` — Loading indicator with spinner shown. Text says "Розпізнаю показник..." but AC says "Розпізнаю цифри...". Minor text difference. |
| AC-3.2 | **PASS** | `src/app/submit/page.tsx:395-401` — Recognized value shown in large centered card (`text-5xl font-bold`) with meter unit below. |
| AC-3.3 | **PARTIAL** | `src/app/submit/page.tsx:402-407` — Confidence shown as badge: "Впевненість {N}% ({level})". AC says format "Впевненість {N}%" — implementation adds confidence level label ("Висока"/"Середня"/"Низька"). Extra info, not wrong, but slightly different format. |
| AC-3.4 | **PASS** | `src/app/submit/page.tsx:413-423` — Editable text input pre-filled with OCR value, labeled "Виправити значення (за потреби)". |
| AC-3.5 | **PASS** | `src/app/submit/page.tsx:427-434` — Warning shown when value < lastReading: "Показник менший за попередній ({lastReading}). Перевірте значення." in red-bordered alert card. |
| AC-3.6 | **PASS** | `src/app/submit/page.tsx:419-420` — Input `onChange={(e) => setOcrValue(e.target.value)}` allows editing. |
| AC-3.7 | **PASS** | `src/app/submit/page.tsx:96-104` — On OCR failure: "Не вдалося розпізнати. Введіть значення вручну." with empty editable input. |

### US-4: EPS Submission

| AC | Status | Evidence |
|----|--------|----------|
| AC-4.1 | **PASS** | `src/app/submit/page.tsx:460-464` — Loading indicator with "Передаю на EPS..." text. |
| AC-4.2 | **FAIL** | `src/app/submit/page.tsx:191-198` — `handleConfirm()` uses `setTimeout(2000)` as placeholder. No WebView, no JS injection, no EPS authentication. Architecture decision AD-5 documents the approach but it's not implemented. |
| AC-4.3 | **PASS** | `src/app/submit/page.tsx:468-481` — Success screen with green checkmark, submitted value, meter name, and meter number. |
| AC-4.4 | **FAIL** | `src/app/submit/page.tsx:484-489` — Shows placeholder notice "EPS integration coming soon" instead of error message with Retry button and "Open EPS manually" fallback. |
| AC-4.5 | **FAIL** | `src/app/submit/page.tsx:191-198` — Reading is NOT stored to database on submission. The `handleConfirm` function does not call `POST /api/readings`. The API route exists but is not wired up. |
| AC-4.6 | **PASS** | `src/app/submit/page.tsx:493-503` — "Передати ще один" (resets to meter selection) and "На головну" (navigates home) buttons present. |
| AC-4.7 | **FAIL** | No check for EPS credentials before submission. No redirect to Settings → EPS Account section. |

### US-5: History Viewing with Filter

| AC | Status | Evidence |
|----|--------|----------|
| AC-5.1 | **PASS** | `src/app/history/page.tsx:103-124` — Horizontally scrollable meter selector pills with icon and first word of service name. |
| AC-5.2 | **PASS** | `src/app/history/page.tsx:187` — `<UsageChart data={usageData} color={selectedMeter.color} />` shows bar chart of monthly usage. `getMonthlyUsage()` calculates differences between consecutive readings. |
| AC-5.3 | **PASS** | `src/app/history/page.tsx:163-168` — Tariff shown below meter info: `{tariff.value} {tariff.unit}`. |
| AC-5.4 | **PASS** | `src/app/history/page.tsx:171-184` — Trend badge with up/down arrow. Orange (`bg-secondary-100 text-secondary-700`) for increase, green (`bg-success-light text-success`) for decrease. |
| AC-5.5 | **PASS** | `src/app/history/page.tsx:259-280` — Monthly breakdown list sorted newest first, with month name, usage value with unit, and cost in ₴. |
| AC-5.6 | **PASS** | `src/app/history/page.tsx:284-292` — "Аналітика" section placeholder: "Річні порівняння та аналітика будуть доступні після 6 місяців використання". |
| AC-5.7 | **PASS** | `src/app/history/page.tsx:142-147` — Empty state: "Поки немає даних. Передайте перший показник, щоб побачити графік." |

### US-6: Usage Trends

| AC | Status | Evidence |
|----|--------|----------|
| AC-6.1 | **PASS** | `src/app/history/page.tsx:189-203` — Summary row with "Витрата за останній місяць" (left) and "Вартість" (right, formatted with uk-UA locale). |
| AC-6.2 | **PASS** | `src/lib/mockData.ts:194-196` — Cost calculated as `diff * (tariff?.value || 0)` where diff = last reading − previous reading. |
| AC-6.3 | **PARTIAL** | `src/lib/mockData.ts:194` — `mockTariffs.find(t => t.serviceType === meter?.serviceType)` finds only the **first** tariff for a service type. For gas (which has 2 tariffs: 7.99 + 13.87), only the first one (7.99) is used. The `getBillChangeFactors()` function at line 236 correctly sums all tariffs (`tariffs.reduce`), but `getMonthlyUsage()` does not. |

### US-7: Smart Insights

| AC | Status | Evidence |
|----|--------|----------|
| AC-7.1 | **PASS** | `src/app/page.tsx:27-47` — Hero card on Home page shows total predicted bill formatted as `{amount} ₴` with uk-UA locale, minimum 2 decimal places. |
| AC-7.2 | **PASS** | `src/app/page.tsx:33` — Label: "Прогноз рахунку за {currentMonth}" where currentMonth uses `toLocaleDateString("uk-UA", { month: "long" })`. |
| AC-7.3 | **PASS** | `src/app/page.tsx:38-45` — Shows count of meters (`{mockMeters.length} лічильники`) and "Оновлено сьогодні". |
| AC-7.4 | **PARTIAL** | `src/lib/mockData.ts:150-183` — `mockBillPredictions` has pre-calculated values, not dynamically computed as `predictedUsage × tariff`. The prediction values are hardcoded, not calculated from readings data. |
| AC-7.5 | **PASS** | `src/app/page.tsx:97-134` — Bill breakdown section lists each meter's service name, predicted amount, and predicted usage with unit, plus a total row. |
| AC-7.6 | **FAIL** | No check for meters without readings. All 4 meters have readings in mock data, so the "Немає даних" case is not implemented. |

### US-8: Smart Insights (Anomaly, Trend, Comparison)

| AC | Status | Evidence |
|----|--------|----------|
| AC-8.1 | **PASS** | `src/components/SmartInsights.tsx:52-59` — "Розумні підказки" section with "AI аналітика" label. |
| AC-8.2 | **PASS** | `src/lib/mockData.ts:292-301` — Streak insight: "{N} місяців підряд" with description about timely submissions. Triggered when `streakCount >= 3`. |
| AC-8.3 | **PASS** | `src/lib/mockData.ts:304-330` — Anomaly insight: checks if `Math.abs(changePct) >= 15`, shows meter name, percentage change, and description about leak/savings. |
| AC-8.4 | **PARTIAL** | `src/lib/mockData.ts:333-350` — CO₂ insight shown for electricity meter with `CO₂kg = monthlyUsage × 0.3`. Tree-equivalent calculated. However, the description format differs slightly from AC — it says "Еквівалент {treesEquiv} дерев/рік" rather than specifying "tree-equivalent" as a separate field. |
| AC-8.5 | **PASS** | `src/lib/mockData.ts:353-360` — Savings tip about electricity night tariffs: "Перенеси 20% електро на нічний тариф". |
| AC-8.6 | **PASS** | `src/lib/mockData.ts:363-373` — Gas seasonal pattern insight: "Газ: сезонний патерн" with description about winter usage increase. |
| AC-8.7 | **PARTIAL** | `src/lib/mockData.ts:294-373` — Each insight has colored icon, title, and description. Colors: streak=orange (#f97316), anomaly=red/green (#ef4444/#22c55e), CO₂=green (#22c55e), saving=amber (#f59e0b), tip=teal (#14b8a6). All match AC-8.7. However, `SmartInsights.tsx:19-26` maps anomaly to "warning" severity and all others to "info" — the severity system is less granular than the AC implies. |

### US-9: Local Notifications

| AC | Status | Evidence |
|----|--------|----------|
| AC-9.1 | **PASS** | `src/components/DeadlineAlert.tsx:20-38` — Urgent alerts use `bg-danger-light` with `AlertCircle` icon (orange/red style). |
| AC-9.2 | **PASS** | `src/components/DeadlineAlert.tsx:39-57` — Upcoming reminders use muted style with `Bell` icon. |
| AC-9.3 | **PASS** | `src/lib/notifications.ts:91-153` — `scheduleNotifications()` schedules 3 notifications: 3 days before, 1 day before, and day of deadline, all at 09:00 (`NOTIFICATION_HOUR = 9, NOTIFICATION_MINUTE = 0`). |
| AC-9.4 | **PASS** | `src/lib/notifications.ts:71-77` — Body format: `{serviceName} — передати показники до {date}` with uk-UA date formatting. |
| AC-9.5 | **PASS** | `src/app/settings/page.tsx:104-109,274-301` — 4 notification toggles: reading, payment, tariff, anomaly. Each has label and description. |
| AC-9.6 | **PASS** | `src/lib/notifications.ts:178-196` — `updateNotificationSettings()` cancels notifications when toggle is off. `src/app/settings/page.tsx:61-68` calls this on toggle. |
| AC-9.7 | **PASS** | `src/lib/notifications.ts:182-186` — When reading toggle is on, schedules notifications for all meters. |

### US-10: EPS Account Settings

| AC | Status | Evidence |
|----|--------|----------|
| AC-10.1 | **PASS** | `src/app/settings/page.tsx:164-186` — "EPS Акаунт" section showing "EPS Ternopil", account number, and connection status badge. |
| AC-10.2 | **PASS** | `src/app/settings/page.tsx:177-185` — "Підключено" (green/success) badge when connected, "Не підключено" (gray/muted) when not. |
| AC-10.3 | **PASS** | `src/app/settings/page.tsx:245-253` — "Налаштувати" button shown when not connected, opens form with username and password fields. |
| AC-10.4 | **PARTIAL** | `src/app/settings/page.tsx:221-224` — UI says "Пароль зберігається зашифрованим на пристрої" but actual storage uses `localStorage` (`src/lib/notifications.ts:276-284`) which is plaintext, not encrypted. No Capacitor SecureStorage plugin used. |
| AC-10.5 | **PASS** | `src/app/settings/page.tsx:254-262` — "Відкрити EPS" link opens `https://www.eps.org.ua/ternopil/account/view/...` in new tab. |
| AC-10.6 | **FAIL** | `src/app/settings/page.tsx:71-86` — `handleSaveEps()` uses `setTimeout(1000)` as placeholder. No actual login validation to eps.org.ua. |

### US-11: App Information

| AC | Status | Evidence |
|----|--------|----------|
| AC-11.1 | **PASS** | `src/app/settings/page.tsx:324-343` — "Про додаток" section with Version, OCR Engine, EPS Integration fields. |
| AC-11.2 | **PARTIAL** | `src/app/settings/page.tsx:23` — `APP_VERSION = "0.1.0 (MVP)"` is hardcoded, not read from `package.json`. The format matches ({major}.{minor}.{patch} ({stage})), but the source is wrong. `package.json` has `"version": "0.1.0"` without the "(MVP)" stage suffix. |
| AC-11.3 | **PARTIAL** | `src/app/settings/page.tsx:332,346` — Version displayed in Settings and footer as "Communal v{version}". But version is hardcoded constant, not sourced from `package.json` at build time. |
| AC-11.4 | **PASS** | `src/app/settings/page.tsx:336,340` — OCR Engine: "Tesseract.js (web) / ML Kit v2 (native)", EPS Integration: "WebView + JS". |

### US-12: Database Schema

| AC | Status | Evidence |
|----|--------|----------|
| AC-12.1 | **PASS** | `src/lib/db/schema.sql:31-42` — `readings` table with all required columns: id (UUID), meter_id (FK), value (numeric), date (date), photo_url (text, nullable), ocr_confidence (real), ocr_engine (text with CHECK constraint), submitted_to_eps (boolean), submitted_at (timestamptz, nullable). |
| AC-12.2 | **PASS** | `src/lib/db/schema.sql:12-26` — `meters` table with all columns matching Meter interface: id, meter_number, service_type, service_name, unit, last_reading, last_reading_date, submit_deadline_day, submit_window_start, color, color_light, icon. CHECK constraint includes 'heating'. |
| AC-12.3 | **PASS** | `src/lib/db/schema.sql:50-59` — `tariffs` table with columns matching Tariff interface: id, service_type, service_name, value, unit, effective_from, source. |
| AC-12.4 | **PASS** | `src/lib/db/schema.sql:64-76` — `settings` table (singleton, `id=1 CHECK`): eps_username, eps_account_number, notification_reading, notification_payment, notification_tariff, notification_anomaly, user_name, user_address. Also includes `eps_password_encrypted` and `updated_at`. |
| AC-12.5 | **PASS** | All 4 API route files exist: `src/app/api/meters/route.ts` (GET), `src/app/api/readings/route.ts` (GET+POST with `?meterId=`), `src/app/api/tariffs/route.ts` (GET), `src/app/api/settings/route.ts` (GET+PUT). |
| AC-12.6 | **PASS** | `src/lib/db/queries.ts:167-199` — `createReading()` calls `updateMeterLastReading()` after INSERT, updating meter's `last_reading` and `last_reading_date`. |
| AC-12.7 | **PASS** | `src/lib/db/client.ts:10` — `import { neon } from "@neondatabase/serverless"` and `src/lib/db/client.ts:32` — `neon(connectionString)`. All queries use this client. |

### US-13: Migration from Mock Data

| AC | Status | Evidence |
|----|--------|----------|
| AC-13.1 | **FAIL** | Mock data imports still present in: `src/app/page.tsx:3`, `src/app/submit/page.tsx:17`, `src/app/history/page.tsx:8`, `src/app/settings/page.tsx:21`, `src/components/SmartInsights.tsx:5`, `src/components/BillExplanation.tsx:4`. No page uses API calls instead of mockData. |
| AC-13.2 | **FAIL** | `src/app/page.tsx:3` — Home page imports from `@/lib/mockData`, not from API. Does not fetch from `/api/meters`, `/api/tariffs`, etc. |
| AC-13.3 | **FAIL** | `src/app/submit/page.tsx:191-198` — Submit page uses `setTimeout` placeholder, does not call `POST /api/readings`. |
| AC-13.4 | **FAIL** | `src/app/history/page.tsx:8` — History page imports from `@/lib/mockData`, not from `/api/readings`. |
| AC-13.5 | **FAIL** | `src/app/settings/page.tsx:13-21` — Settings page uses `loadUserSettings()` from localStorage, not from `/api/settings`. |
| AC-13.6 | **PARTIAL** | `src/components/LoadingState.tsx` — Skeleton/shimmer component exists. `src/app/settings/page.tsx:49-57` uses shimmer for loading. But Home, Submit, and History pages don't use LoadingState since they use mock data (synchronous). |
| AC-13.7 | **PARTIAL** | `src/components/ErrorState.tsx` — Error state component with retry button exists. But since pages use mock data (which never fails), it's not actually used on any page. |

### US-14: Capacitor Configuration

| AC | Status | Evidence |
|----|--------|----------|
| AC-14.1 | **PASS** | `capacitor.config.ts:1-24` — `appId: "com.krepych.communal"`, `appName: "Communal"`, `webDir: "dist"`. All required fields present. |
| AC-14.2 | **FAIL** | `next.config.ts:1-7` — No `output: 'export'` configured. Architecture decision AD-1 explicitly chose NOT to use static export, deploying to Vercel instead. This conflicts with AC-14.2 but aligns with AD-1. The Capacitor config uses `server.url` pointing to Vercel, which is the chosen approach. |
| AC-14.3 | **PARTIAL** | `src/lib/capacitor.ts:48-66` — `takePhoto()` uses `@capacitor/camera` dynamically. However, no Capacitor HTTP plugin is used for API calls — the app relies on server-side API routes via the Vercel URL. |
| AC-14.4 | **PASS** | `src/app/globals.css:234-241` — `.pb-safe` and `.pt-safe` classes use `env(safe-area-inset-bottom/top)`. `.page-container` uses `calc(80px + env(safe-area-inset-bottom))`. `src/app/layout.tsx:34` — `viewportFit: "cover"`. |
| AC-14.5 | **PASS** | `src/components/BottomNav.tsx:19` — `pb-[env(safe-area-inset-bottom)]` prevents overlap with Android system navigation bar. |
| AC-14.6 | **PARTIAL** | `src/lib/capacitor.ts:72-82` — `requestCameraPermission()` exists and uses `Camera.requestPermissions()`. However, no rationale dialog is shown before requesting. |
| AC-14.7 | **PARTIAL** | `src/lib/capacitor.ts:178-195` — `requestNotificationPermission()` exists. However, it's not called on first launch — only when scheduling notifications. No rationale dialog. |

### US-15: On-Device OCR

| AC | Status | Evidence |
|----|--------|----------|
| AC-15.1 | **PARTIAL** | `src/app/submit/page.tsx:68` — Uses Tesseract.js (`await import("tesseract.js")`), not Google ML Kit. Architecture decision AD-6 lists Tesseract.js as a fallback. ML Kit plugin not installed. |
| AC-15.2 | **PASS** | `src/app/submit/page.tsx:70-94` — OCR processes photo and returns numeric value (`extractedValue`) and confidence score (`normalizedConfidence`). |
| AC-15.3 | **PASS** | `src/app/submit/page.tsx:68-76` — Tesseract.js runs entirely in the browser/device. No image data transmitted to server. Privacy notice at line 350 confirms. |
| AC-15.4 | **PASS** | `src/app/submit/page.tsx:112-120` — On OCR failure: "OCR недоступний. Введіть показник вручну." with manual input. `src/app/submit/page.tsx:354-361` — Manual entry button on photo step. |
| AC-15.5 | **PARTIAL** | `src/lib/types.ts:25` — `ocrEngine` field includes `"tesseract"` as valid value. `src/app/submit/page.tsx` uses Tesseract but doesn't explicitly store the engine identifier with the reading (since readings aren't persisted yet). The schema (`schema.sql:38`) includes 'tesseract' in CHECK constraint. |

---

### Color Migration

| File | Status | Notes |
|------|--------|-------|
| `src/app/globals.css` | **PASS** | Primary color is teal (`--primary-500: #14b8a6`). No blue references. Water color is `#0ea5e9` (cyan, per DESIGN_SYSTEM.md). |
| `src/app/page.tsx` | **PASS** | Uses `from-primary-500 to-primary-600` gradient. No blue references. |
| `src/components/BottomNav.tsx` | **PASS** | Uses `from-secondary-500 to-secondary-600` for FAB, `text-primary-600` for active tab. No blue references. |
| `src/components/MeterCard.tsx` | **PASS** | Uses meter colors from data, `hover:border-primary-300`, `focus:border-primary-500`. No blue references. |
| `src/components/DeadlineAlert.tsx` | **PASS** | Uses `bg-danger-light`, `text-danger` for urgent, `bg-muted` for upcoming. No blue references. |
| `src/components/SmartInsights.tsx` | **PASS** | Uses insight colors from data. No blue references. |
| `src/components/UsageChart.tsx` | **PASS** | Default color `#14b8a6` (teal). No blue references. |
| `src/components/BillExplanation.tsx` | **PASS** | Uses `text-primary-500`, `text-secondary-600`, `text-success`. No blue references. |
| `src/components/ErrorState.tsx` | **PASS** | Uses `bg-primary-500`, `bg-danger-light`. No blue references. |
| `src/components/LoadingState.tsx` | **PASS** | Uses `shimmer` class. No blue references. |
| `src/app/submit/page.tsx` | **PASS** | Uses `from-primary-500 to-primary-600`, `from-secondary-500 to-secondary-600`. No blue references. |
| `src/app/history/page.tsx` | **PASS** | Uses `text-primary-500`, `bg-success-light`, `text-secondary-600`. No blue references. |
| `src/app/settings/page.tsx` | **PASS** | Uses `bg-primary-500`, `text-primary-600`, `bg-success-light`. No blue references. |
| `src/lib/types.ts` | **PASS** | Water color is `#0ea5e9` (cyan-teal, per DESIGN_SYSTEM.md). No `#3b82f6` or `#2563eb`. |
| `capacitor.config.ts` | **PASS** | `iconColor: "#14b8a6"` (teal). |
| `src/app/layout.tsx` | **PASS** | `themeColor: "#14b8a6"` (teal). |

**Search results**: Zero matches for `blue`, `#2563eb`, `#3b82f6`, `from-blue`, `to-blue`, `text-blue`, `bg-blue`, `border-blue` across all source files.

---

### Font Migration

| Check | Status | Evidence |
|-------|--------|----------|
| Inter font (not Geist) | **PASS** | `src/app/layout.tsx:2,6-9` — `import { Inter, IBM_Plex_Mono } from "next/font/google"` and `const inter = Inter({...})`. No Geist import. |
| Cyrillic subset | **PASS** | `src/app/layout.tsx:8` — `subsets: ["latin", "cyrillic"]` includes Cyrillic. |
| `text-body` class (15px) | **PASS** | `src/app/globals.css:228-231` — `.text-body { font-size: 15px; line-height: 1.6; }` defined. |
| `text-body` usage | **PASS** | Used across all pages: `page.tsx:22,33,115`, `submit/page.tsx:241,252,274`, `history/page.tsx:100,128,144`, `settings/page.tsx:115,120,130,135`, `MeterCard.tsx:43,47,80,85`, `SmartInsights.tsx:79,83`, `ErrorState.tsx:31,32`, etc. |

---

### Database Schema Verification

| Check | Status | Evidence |
|-------|--------|----------|
| 4 tables exist | **PASS** | `schema.sql` defines: `meters` (line 12), `readings` (line 31), `tariffs` (line 50), `settings` (line 64). |
| Meters columns | **PASS** | id (UUID PK), meter_number, service_type (CHECK), service_name, unit, last_reading (nullable), last_reading_date (nullable), submit_deadline_day, submit_window_start, color, color_light, icon, created_at. |
| Readings columns | **PASS** | id (UUID PK), meter_id (FK→meters ON DELETE CASCADE), value, date, photo_url (nullable), ocr_confidence (real), ocr_engine (CHECK: mlkit/azure/manual/tesseract), submitted_to_eps (bool), submitted_at (nullable), created_at. |
| Tariffs columns | **PASS** | id (UUID PK), service_type, service_name, value, unit, effective_from, source, created_at. |
| Settings columns | **PASS** | id (INTEGER PK, CHECK id=1 singleton), eps_username, eps_account_number, eps_password_encrypted, notification_reading (bool), notification_payment (bool), notification_tariff (bool), notification_anomaly (bool), user_name, user_address, updated_at. |
| Indexes | **PASS** | `idx_readings_meter_id_date` on `readings(meter_id, date)` (line 45). |
| Constraints | **PASS** | service_type CHECK (line 15), ocr_engine CHECK (line 38), settings singleton CHECK (line 65), FK reference (line 33). |
| Seed data — meters | **PASS** | 4 meters matching mockData.ts: same meter numbers (14091126, 14097821, 2400786276, 98040), same service types/names/units, same last readings/dates, same deadline days, same colors. |
| Seed data — readings | **PASS** | 12 readings matching mockData.ts: 3 per meter, same values (178.12, 180.23, 182.34, etc.), same dates, same OCR confidence/engine, same submitted status. |
| Seed data — tariffs | **PASS** | 4 tariffs matching mockData.ts: water 35.20, electricity 4.32, gas 7.99, gas 13.87. Same service names, units, effective dates, sources. |
| Seed data — settings | **PASS** | Singleton row: eps_username='roman.krepych', eps_account_number='2099000225595', notification flags (true, true, false, true), user_name='Роман Кречих', user_address='м. Тернопіль'. |
| `pgcrypto` extension | **PASS** | `CREATE EXTENSION IF NOT EXISTS pgcrypto` (line 7) for `gen_random_uuid()`. |
| `ON CONFLICT` clauses | **PASS** | All seed INSERTs use `ON CONFLICT (id) DO NOTHING` for idempotency. |

---

### API Routes Verification

| Route | Method | Status | Evidence |
|-------|--------|--------|----------|
| `/api/meters` | GET | **PASS** | `src/app/api/meters/route.ts:9-28` — Returns JSON array. 503 on missing DATABASE_URL, 500 on other errors. |
| `/api/readings` | GET | **PASS** | `src/app/api/readings/route.ts:10-32` — Supports `?meterId=` filter. Returns JSON array. 503/500 error handling. |
| `/api/readings` | POST | **PASS** | `src/app/api/readings/route.ts:34-75` — Validates required fields (meterId, value, date), returns 400 on missing. Returns 201 on success. 503/500 error handling. |
| `/api/tariffs` | GET | **PASS** | `src/app/api/tariffs/route.ts:9-28` — Returns JSON array. 503/500 error handling. |
| `/api/settings` | GET | **PASS** | `src/app/api/settings/route.ts:10-29` — Returns singleton settings. 503/500 error handling. |
| `/api/settings` | PUT | **PASS** | `src/app/api/settings/route.ts:31-64` — Accepts partial updates. Returns updated settings. 503/500 error handling. |

**Error handling summary**: All routes check for `DATABASE_URL` in error message and return 503. Validation errors return 400. All other errors return 500. All responses are JSON (`NextResponse.json()`).

---

### File Conflict Verification (types.ts)

| Check | Status | Evidence |
|-------|--------|----------|
| Settings interface (Dev 1) | **PASS** | `src/lib/types.ts:59-68` — `Settings` interface with epsUsername, epsAccountNumber, notification flags, userName, userAddress. |
| Heating ServiceType (Dev 2) | **PASS** | `src/lib/types.ts:1` — `"heating"` included in `ServiceType` union. |
| SERVICE_CONFIG heating entry | **PASS** | `src/lib/types.ts:122-130` — `heating` entry with label "Heating", labelUa "Опалення", unit "Гкал", color "#ef4444", icon "thermometer". |
| No duplicate types | **PASS** | No duplicate interfaces or conflicting definitions found. `UserSettings` (line 77) is separate from `Settings` (line 59) — `UserSettings` includes `epsConnected` and nested `NotificationSettings`, while `Settings` maps to DB schema. |
| `NotificationSettings` interface | **PASS** | `src/lib/types.ts:70-75` — Separate interface for notification toggles. |

---

## Issues Found

### CRITICAL

1. **[C-1] US-13: Mock data not replaced with API calls (AC-13.1 through AC-13.5)** — All pages still import from `@/lib/mockData`. The backend API routes exist and are functional, but no frontend page uses them. The migration from mock data to real API is not started. This means data persistence (NFR-5) is not functional — data won't persist between sessions.

2. **[C-2] AC-4.5: Readings not stored to database on submission** — `src/app/submit/page.tsx:191-198` uses `setTimeout` as a placeholder and does not call `POST /api/readings`. The API endpoint exists but is not wired up. Users cannot actually save readings.

3. **[C-3] AC-10.4: EPS credentials stored in plaintext (localStorage)** — `src/lib/notifications.ts:276-284` uses `localStorage.setItem` for user settings, which is plaintext. The UI claims "Пароль зберігається зашифрованим на пристрої" but no encryption is applied. No Capacitor SecureStorage plugin is used.

### MAJOR

4. **[M-1] AC-4.2, AC-4.4, AC-4.7: EPS WebView integration not implemented** — The EPS submission flow is a placeholder (`setTimeout`). No WebView, no JS injection, no credential check, no error retry, no "Open EPS manually" fallback. Architecture decision AD-5 documents the approach but it's not coded.

5. **[M-2] AC-10.6: EPS credential validation not implemented** — `handleSaveEps()` uses `setTimeout(1000)` without any actual login validation to eps.org.ua.

6. **[M-3] AC-14.2: Static export not configured** — `next.config.ts` has no `output: 'export'`. Architecture decision AD-1 explicitly chose Vercel deployment instead, which conflicts with AC-14.2. The Capacitor config uses `server.url` pointing to Vercel, which is the chosen workaround. This is a PRD vs Architecture decision conflict.

7. **[M-4] AC-6.3: Gas tariff summation incomplete in `getMonthlyUsage()`** — `src/lib/mockData.ts:194` uses `mockTariffs.find()` which returns only the first tariff for gas (7.99), not the sum of both (7.99 + 13.87 = 21.87). The `getBillChangeFactors()` function at line 236 correctly sums all tariffs, but the History page uses `getMonthlyUsage()` which doesn't.

8. **[M-5] AC-11.2, AC-11.3: Version hardcoded instead of from package.json** — `APP_VERSION = "0.1.0 (MVP)"` is a hardcoded constant in `src/app/settings/page.tsx:23`, not read from `package.json` at build time.

9. **[M-6] AC-15.1: ML Kit not used — Tesseract.js only** — The PRD requires Google ML Kit Text Recognition v2 for on-device OCR. The implementation uses Tesseract.js (pure JS). Architecture decision AD-6 lists Tesseract.js as a fallback, but the primary ML Kit plugin is not installed.

### MINOR

10. **[m-1] AC-1.1: Last reading date not shown in compact MeterCard** — The compact card on the Submit page shows last reading value but not the date. The full card on the Home page shows both.

11. **[m-2] AC-2.1: Scanning frame not exactly 60% of screen height** — Uses `aspect-[3/4]` with `top-1/4 bottom-1/4` overlay, which is approximately 50% of the container, not exactly 60% of screen height.

12. **[m-3] AC-3.1: Loading text says "Розпізнаю показник..." instead of "Розпізнаю цифри..."** — Minor text difference from AC spec.

13. **[m-4] AC-3.3: Confidence badge includes extra level label** — Shows "Впевненість {N}% ({level})" instead of just "Впевненість {N}%". Extra info, not wrong.

14. **[m-5] AC-7.6: "Немає даних" case not implemented** — All meters have readings in mock data, so the empty-meter case is not handled in the bill breakdown.

15. **[m-6] AC-14.6, AC-14.7: No rationale dialogs for permissions** — Camera and notification permissions are requested without a rationale dialog explaining why access is needed.

16. **[m-7] AC-14.7: Notification permission not requested on first launch** — Only requested lazily when scheduling notifications, not on app startup.

17. **[m-8] `src/lib/notifications.ts:255`: User name "Роман Крепич" vs schema seed "Роман Кречих"** — Name spelling inconsistency between localStorage defaults and database seed data.

---

## Recommendations

1. **[P0] Wire up API calls** — Replace all `@/lib/mockData` imports with `fetch()` calls to the API routes. Start with Home page, then Submit, History, and Settings. Use `LoadingState` and `ErrorState` components for loading/error states (AC-13.6, AC-13.7).

2. **[P0] Persist readings on submission** — After EPS submission (or placeholder), call `POST /api/readings` with the reading data, including OCR confidence and engine identifier (AC-4.5, AC-13.3).

3. **[P1] Implement EPS WebView integration** — Use `@capacitor/inappbrowser` to open eps.org.ua, inject JS for authentication and form submission. Include error detection and "Open EPS manually" fallback (AC-4.2, AC-4.4, AC-4.7).

4. **[P1] Secure credential storage** — Install `@capacitor-community/secure-storage` or use Android Keystore for EPS credentials. Never store passwords in localStorage (AC-10.4).

5. **[P1] Fix gas tariff summation** — Update `getMonthlyUsage()` to sum all tariffs for a service type, matching the pattern in `getBillChangeFactors()` (AC-6.3).

6. **[P2] Read version from package.json** — Use `process.env.npm_package_version` or a build-time constant to source the version dynamically (AC-11.2, AC-11.3).

7. **[P2] Resolve static export conflict** — The PRD (AC-14.2) requires `output: 'export'` but AD-1 chose Vercel deployment. Either update the PRD to accept the Vercel + Capacitor `server.url` approach, or implement static export with a separate API solution. Document the decision.

8. **[P2] Install ML Kit plugin** — Install `@capacitor-community/mlkit-ocr` or create a custom native plugin for Google ML Kit Text Recognition v2. Keep Tesseract.js as a web fallback (AC-15.1).

9. **[P3] Add permission rationale dialogs** — Show a rationale dialog before requesting camera and notification permissions on Android (AC-14.6, AC-14.7).

10. **[P3] Fix name spelling inconsistency** — Align "Роман Крепич" (notifications.ts) with "Роман Кречих" (schema.sql) or vice versa.

---

## Provenance

| Source | Type | Date |
|--------|------|------|
| `F:\communal\src\lib\types.ts` | Code | 2026-08-22 |
| `F:\communal\src\lib\mockData.ts` | Code | 2026-08-22 |
| `F:\communal\src\lib\db\schema.sql` | Code | 2026-08-22 |
| `F:\communal\src\lib\db\client.ts` | Code | 2026-08-22 |
| `F:\communal\src\lib\db\queries.ts` | Code | 2026-08-22 |
| `F:\communal\src\app\api\meters\route.ts` | Code | 2026-08-22 |
| `F:\communal\src\app\api\readings\route.ts` | Code | 2026-08-22 |
| `F:\communal\src\app\api\tariffs\route.ts` | Code | 2026-08-22 |
| `F:\communal\src\app\api\settings\route.ts` | Code | 2026-08-22 |
| `F:\communal\src\app\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\submit\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\history\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\settings\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\layout.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\globals.css` | Code | 2026-08-22 |
| `F:\communal\src\components\*.tsx` | Code | 2026-08-22 |
| `F:\communal\src\lib\notifications.ts` | Code | 2026-08-22 |
| `F:\communal\src\lib\capacitor.ts` | Code | 2026-08-22 |
| `F:\communal\capacitor.config.ts` | Code | 2026-08-22 |
| `F:\communal\package.json` | Code | 2026-08-22 |
| `F:\communal\next.config.ts` | Code | 2026-08-22 |
| `F:\communal\.env.example` | Code | 2026-08-22 |
| `npx tsc --noEmit` | Build | 2026-08-22 — PASS (0 errors) |
| `npm run build` | Build | 2026-08-22 — PASS (exit code 0) |
