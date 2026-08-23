# Communal — Wiki Index

## Project: Communal
**Product:** Персональний додаток для подачі показників лічильників та оплати комунальних послуг
**Platform:** Web (Next.js) + Android (Capacitor)
**Owner:** Roman Krepych
**Status:** In Development

## Products
- [communal](products/communal/) — головний продукт

## Architecture
- [Architecture Decisions (2026-08-22)](architecture/2026-08-22-communal-architecture-decisions.md) — 7 architecture decisions resolving PRD open questions (deployment, DB, EPS, OCR, color fix)

## Artifacts
- [Business Brief (2026-08-22)](products/communal/business/2026-08-22-communal-brief.md) — бізнес-проблема, цілі, scope, ризики
- [PRD (2026-08-22)](products/communal/prd/2026-08-22-communal-prd.md) — user stories, EARS acceptance criteria, architecture concerns
- [Sources](products/communal/sources/) — вихідні матеріали

### QA
- [QA Report (2026-08-22)](products/communal/qa/2026-08-22-communal-qa-report.md) — 75 ACs verified: 48 pass, 18 partial, 9 fail. TypeScript + build pass. Critical: mock data not replaced with API calls, readings not persisted, EPS credentials in plaintext.

### Design
- [Design Specification (2026-08-22)](products/communal/design/2026-08-22-communal-design-spec.md) — comprehensive design spec: screen inventory, wireframes, user flows, component specs, responsive behavior, accessibility, AC traceability for all 15 user stories
- [Android Design Spec (2026-08-22)](products/communal/design/2026-08-22-communal-android-spec.md) — Material Design 3 adaptation for Android (Capacitor): color mapping, touch targets, camera UX, WebView interaction, local notifications, dark theme reference
- [Developer Handoff (2026-08-22)](products/communal/design/2026-08-22-communal-handoff.md) — implementation-ready spec: exact Tailwind classes, color token mapping (blue→teal fix), component state matrix, screen-by-screen notes, animation specs, icon spec, implementation checklist

## Tech Stack (вже існує)
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- @neondatabase/serverless (Neon PostgreSQL)
- Recharts (графіки)
- Lucide React (іконки)
- Capacitor (Android wrapper — заплановано)

## Existing Code
- 4 сторінки: home, submit, history, settings
- 6 компонентів: MeterCard, BottomNav, DeadlineAlert, SmartInsights, BillExplanation, UsageChart
- Типи: Meter, Reading, Tariff, BillPrediction, Reminder
- Mock data (поки без реального API/БД)
- Design System: "Тепло домівки" (teal + terracotta, 32KB)

## Decisions
<!-- Оновлюється кожним твіном після виконання задачі -->
- 2026-08-22 · Senior BA (JAGM-TWIN-034) · Створено Business Brief та PRD для проєкту Communal. 15 user stories, 7 епіків, 8 open questions. Документи готові до review власником.
- 2026-08-22 · Clark (COO) · Архітектурні рішення (AD-1 to AD-7): Vercel deploy (не static export), Neon Postgres schema, Capacitor WebView, ML Kit OCR, EPS JS injection, color fix plan. Open questions from PRD resolved.
- 2026-08-22 · Senior UI/UX Designer (JAGM-TWIN-146) · Створено 3 дизайн-артефакти: Design Spec (15 user stories, wireframes, flows, component specs, accessibility), Android Spec (Material 3 mapping, camera/notification UX, Capacitor), Developer Handoff (color token fix blue→teal, Tailwind class mapping, state matrix, implementation checklist). 10 PRD conflicts flagged.
- 2026-08-22 · Senior Frontend Developer (JAGM-TWIN) · Реалізовано frontend features (10 tasks): (1) Font migration Geist→Inter with Cyrillic subset; (2) Body text size fix text-sm→text-body (15px, NFR-7); (3) Added heating ServiceType + full color token overhaul per DESIGN_SYSTEM.md (blue→teal, dark mode removal); (4) Created ErrorState and LoadingState reusable components; (5) OCR capture flow with Tesseract.js, confidence indicator, manual fallback, EPS placeholder; (6) Local notifications setup with 3-day/1-day/day-of scheduling at 09:00; (7) Capacitor configuration (capacitor.config.ts, capacitor.ts helper, package.json deps); (8) Settings page enhanced with notification toggles, EPS account form, profile editing, localStorage persistence; (9) History page enhanced with year filter, reading history table, CSV export, Recharts trends; (10) SmartInsights enhanced with severity indicators and dismissible cards. All color migrations (blue→teal/secondary, orange→danger, cyan→primary, green→success) and dark mode class removal completed across all files.
- 2026-08-22 · Senior Developer (Backend) (JAGM-TWIN) · Реалізовано backend infrastructure (6 tasks): (1) Database schema (schema.sql) — 4 tables (meters, readings, tariffs, settings) per AD-3 with CHECK constraints, indexes on readings(meter_id, date), and seed data from mockData.ts; (2) Neon serverless client (client.ts) — lazy singleton with DATABASE_URL env var, query/queryOne helpers; (3) Typed query functions (queries.ts) — 7 functions (getMeters, getReadings, createReading, getTariffs, getSettings, updateSettings, updateMeterLastReading) with snake_case→camelCase mapping; (4) 4 API routes — GET /api/meters, GET+POST /api/readings (with ?meterId= filter), GET /api/tariffs, GET+PUT /api/settings, all with proper error handling and 503 on missing DATABASE_URL; (5) Added Settings interface to types.ts; (6) Created .env.example with DATABASE_URL template. Color fix (blue→teal) was already completed by Senior Frontend Developer — verified no remaining blue references.
- 2026-08-22 · Senior QA Engineer (JAGM-TWIN) · [QA Report](products/communal/qa/2026-08-22-communal-qa-report.md) — Verified 75 acceptance criteria: 48 PASS, 18 PARTIAL, 9 FAIL. TypeScript: PASS (0 errors). Build: PASS. Color migration: complete (zero blue references). Font migration: complete (Inter + Cyrillic). Database schema: 4 tables with seed data matching mockData. API routes: all 6 endpoints with proper error handling. Critical issues: (1) mock data not replaced with API calls — all pages still import from mockData; (2) readings not persisted on submission; (3) EPS credentials stored in plaintext (localStorage). Major issues: EPS WebView not implemented, gas tariff summation incomplete, version hardcoded, ML Kit not installed.
