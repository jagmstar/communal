# Communal — Design Specification

| Поле | Значення |
|------|----------|
| **Документ** | Design Specification |
| **Продукт** | Communal |
| **Автор** | Senior UI/UX Designer (JAGM-TWIN-146) |
| **Дата** | 2026-08-22 |
| **Статус** | Draft → Pending Developer Review |
| **Версія** | 1.0 |
| **PRD** | [2026-08-22-communal-prd.md](../prd/2026-08-22-communal-prd.md) |
| **Design System** | [DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md) |

---

## 1. Design Philosophy

**"If a developer has to interpret the design, the design is incomplete."**

This specification provides exact values — hex codes, pixel dimensions, Tailwind classes, spacing tokens — for every screen, component, and state across all 15 user stories from the PRD. No ambiguity. No guesswork.

### Principles

1. **Mobile-first**: Every screen is designed at 375px width first, then adapted to 768px tablet, then 1024px desktop.
2. **Cyrillic-first**: All user-facing text in Ukrainian. Numbers use `uk-UA` locale (space as thousands separator, comma as decimal).
3. **Warm, not cold**: Teal primary (#14b8a6) and terracotta secondary (#f97316). No corporate blue. No default Tailwind blue-500.
4. **One-handed use**: Primary actions in the bottom third. Navigation in bottom nav. Thumb-reachable.
5. **Reduce anxiety**: Generous whitespace, clear hierarchy, predictable patterns. Utility bills are stressful — the app must feel calm.

---

## 2. Screen Inventory

All screens required to satisfy the 15 user stories and 70+ acceptance criteria.

### 2.1. Primary Screens (4)

| ID | Screen | Route | User Stories | ACs |
|----|--------|-------|-------------|-----|
| S-HOME | Home / Dashboard | `/` | US-7, US-8, US-9 | AC-7.1–7.6, AC-8.1–8.7, AC-9.1–9.2 |
| S-SUBMIT | Submit Reading (multi-step) | `/submit` | US-1, US-2, US-3, US-4 | AC-1.1–1.4, AC-2.1–2.6, AC-3.1–3.7, AC-4.1–4.7 |
| S-HISTORY | History & Analytics | `/history` | US-5, US-6 | AC-5.1–5.7, AC-6.1–6.3 |
| S-SETTINGS | Settings & Profile | `/settings` | US-10, US-11 | AC-10.1–10.6, AC-11.1–11.4 |

### 2.2. Sub-screens / States within Submit Flow (6 steps)

| ID | Step | Parent | ACs |
|----|------|--------|-----|
| S-SUBMIT-1 | Meter Selection | S-SUBMIT | AC-1.1–1.4 |
| S-SUBMIT-2 | Photo Capture | S-SUBMIT | AC-2.1–2.6 |
| S-SUBMIT-3 | OCR Processing | S-SUBMIT | AC-3.1 |
| S-SUBMIT-4 | Confirm / Edit Value | S-SUBMIT | AC-3.2–3.7 |
| S-SUBMIT-5 | EPS Submitting | S-SUBMIT | AC-4.1, AC-4.2 |
| S-SUBMIT-6 | Success / Done | S-SUBMIT | AC-4.3, AC-4.5, AC-4.6 |

### 2.3. Error / Fallback States

| ID | State | Trigger | ACs |
|----|-------|---------|-----|
| E-CAMERA | Camera Unavailable | AC-2.6 | Camera permission denied / no camera |
| E-OCR-FAIL | OCR Recognition Failed | AC-3.7 | ML Kit returns no digits |
| E-OCR-UNAVAILABLE | OCR Not Available | AC-15.4 | Running in browser without Capacitor |
| E-EPS-FAIL | EPS Submission Failed | AC-4.4 | WebView injection fails / network error |
| E-EPS-NO-CREDS | EPS Credentials Not Set | AC-4.7 | User taps "Передати на EPS" without configured account |
| E-API-FAIL | API Call Failed | AC-13.7 | Database fetch fails |
| E-MONOTONICITY | Reading < Previous Reading | AC-3.5 | OCR value less than last reading |

### 2.4. Loading / Empty States

| ID | State | Screen | ACs |
|----|-------|--------|-----|
| L-SKELETON | Shimmer/Skeleton Loading | All pages | AC-13.6 |
| L-OCR | OCR Processing Spinner | S-SUBMIT-3 | AC-3.1 |
| L-EPS | EPS Submission Spinner | S-SUBMIT-5 | AC-4.1 |
| EMPTY-HISTORY | No Readings Yet | S-HISTORY | AC-5.7 |
| EMPTY-ANALYTICS | Analytics Placeholder | S-HISTORY | AC-5.6 |
| EMPTY-PREDICTION | No Data for Meter | S-HOME | AC-7.6 |

### 2.5. Settings Sub-sections

| ID | Section | ACs |
|----|---------|-----|
| S-SET-PROFILE | Profile (name, address) | AC-12.4 |
| S-SET-EPS | EPS Account (label, number, status, credentials form) | AC-10.1–10.6 |
| S-SET-NOTIF | Notifications (4 toggles) | AC-9.5–9.7 |
| S-SET-PRIVACY | Privacy info | NFR-6 |
| S-SET-ABOUT | About (version, OCR engine, EPS integration) | AC-11.1–11.4 |

---

## 3. Navigation Model

### 3.1. Mobile (≤768px) — Bottom Navigation

```
┌─────────────────────────────────────────┐
│                                         │
│           Page Content                  │
│         (scrollable)                    │
│                                         │
│                                         │
├─────┬─────┬───────┬─────┬───────────────┤
│ 🏠  │ 📊  │  📸   │ ⚙️  │               │
│Головна│Істор│Передати│Налаш│               │
│      │     │ (FAB) │     │               │
└─────┴─────┴───────┴─────┴───────────────┘
         ↑ centered FAB, elevated
```

**Navigation items (left to right):**

| # | Label (UA) | Icon | Route | Type |
|---|-----------|------|-------|------|
| 1 | Головна | `Home` (lucide) | `/` | Tab |
| 2 | Історія | `BarChart3` (lucide) | `/history` | Tab |
| 3 | Передати | `Camera` (lucide) | `/submit` | FAB (centered, elevated) |
| 4 | Налаштування | `Settings` (lucide) | `/settings` | Tab |

**Active state**: `text-primary-600` (icon + label)
**Inactive state**: `text-muted-foreground` (icon + label)
**FAB**: `bg-gradient-to-br from-secondary-500 to-secondary-600`, white icon, `-mt-6` (elevated above bar), `shadow-lg shadow-secondary-500/30`

**Tailwind (bottom nav container)**:
```
fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/90 backdrop-blur-lg shadow-xl
```

**Safe area**: `pb-[env(safe-area-inset-bottom)]` on inner container.

### 3.2. Tablet (769px–1023px) — Bottom Navigation (same as mobile, max-w-md centered)

The bottom nav stays at `max-w-md` (448px) centered. Content area expands to `max-w-lg` (512px).

### 3.3. Desktop (≥1024px) — Top Navigation

```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Головна   📊 Історія   📸 Передати   ⚙️ Налаштування   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              Page Content (max-w-2xl, centered)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tailwind (top nav)**: `sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-lg`
**Nav items**: horizontal flex, `gap-8`, `px-6 py-4`
**FAB becomes regular button**: No elevation, same gradient, `rounded-xl` instead of `rounded-full`

### 3.4. Routing Structure

```
/                    → Home (S-HOME)
/submit              → Submit flow (S-SUBMIT, internal state machine)
  └─ step: select    → S-SUBMIT-1
  └─ step: photo     → S-SUBMIT-2
  └─ step: ocr       → S-SUBMIT-3
  └─ step: confirm   → S-SUBMIT-4
  └─ step: submitting→ S-SUBMIT-5
  └─ step: done      → S-SUBMIT-6
/history             → History (S-HISTORY)
/settings            → Settings (S-SETTINGS)
  └─ #eps            → EPS Account section (anchor)
  └─ #notifications  → Notifications section (anchor)
```

**Back button behavior** (AC-1.4):
- Step `photo` → back to `select`
- Step `confirm` → back to `photo`
- Step `ocr` → (disabled, processing in progress)
- Step `submitting` → (disabled, submission in progress)
- Step `select` → no back button (entry point)
- Step `done` → no back button (terminal state, offers "На головну")

---

## 4. Wireframes — Text-Based Layouts

### 4.1. S-HOME — Home / Dashboard

**Mobile (375px)**

```
┌─────────────────────────────────┐
│ pt-safe                         │
│                                 │
│  Привіт, Роман 👋               │  ← h1: text-2xl font-bold
│  п'ятниця, 22 серпня             │  ← text-sm text-muted-foreground
│                                 │
│ ┌─────────────────────────────┐ │
│ │  ✨ Прогноз рахунку за серпень│ │  ← Hero Card (gradient teal)
│ │                              │ │
│ │  2 398,52 ₴                  │ │  ← text-4xl font-bold tabular-nums
│ │                              │ │
│ │  📈 4 лічильники • Оновлено   │ │  ← text-xs text-primary-100
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚠ Нагадування    [2 термінових]│ │  ← Section header
│ ├─────────────────────────────┤ │
│ │ 🔴 Електро — передати до     │ │  ← Urgent alert (danger)
│ │    3 серпня. Залишилось 2 дні │ │
│ ├─────────────────────────────┤ │
│ │ 🔴 Газ — передати до 5 серпня│ │  ← Urgent alert (danger)
│ │    Залишилось 4 дні          │ │
│ ├─────────────────────────────┤ │
│ │ 🔔 Вода — передати до 31 серп│ │  ← Upcoming (muted)
│ │    Ще 30 днів                │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📸 Передати показники    →  │ │  ← Quick action card
│ │ Фото → OCR → EPS одним тапом │ │
│ └─────────────────────────────┘ │
│                                 │
│ 💡 Розумні підказки   AI аналітика│  ← Section header
│ ┌─────────────────────────────┐ │
│ │ 🔥 3 місяців підряд          │ │  ← Streak insight (orange)
│ │ Передавав показники вчасно... │ │
│ ├─────────────────────────────┤ │
│ │ ⚠ Електроенергія +15%        │ │  ← Anomaly insight (red)
│ │ Витрата зросла... Можливий...│ │
│ ├─────────────────────────────┤ │
│ │ 🌿 85.8 кг CO₂/міс           │ │  ← CO₂ insight (green)
│ │ Твоя електро-витрата = ...   │ │
│ ├─────────────────────────────┤ │
│ │ 💡 Зеконом ₴340/рік          │ │  ← Savings insight (amber)
│ │ Перенеси 20% електро на...   │ │
│ ├─────────────────────────────┤ │
│ │ 📊 Газ: сезонний патерн       │ │  ← Seasonal insight (teal)
│ │ Твій газ зростає на 40%...   │ │
│ └─────────────────────────────┘ │
│                                 │
│ Мої лічильники                   │  ← Section header
│ ┌─────────────────────────────┐ │
│ │ 💧 Вода (гаряча)          →  │ │  ← MeterCard (full)
│ │    Лічильник №14091126       │ │
│ │ ─────────────────────────── │ │
│ │    Останній показник  Передати│ │
│ │    182,34 м³          до 31  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 💧 Вода (холодна)         →  │ │
│ │    Лічильник №14097821       │ │
│ │ ─────────────────────────── │ │
│ │    Останній показник  Передати│ │
│ │    345,67 м³          до 31  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ⚡ Електроенергія         →  │ │
│ │    Лічильник №2400786276     │ │
│ │ ─────────────────────────── │ │
│ │    Останній показник  Передати│ │
│ │    12 453 кВт·год      до 3  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🔥 Газ                    →  │ │
│ │    Лічильник №98040          │ │
│ │ ─────────────────────────── │ │
│ │    Останній показник  Передити│ │
│ │    5 678 м³            до 5  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Деталі рахунку                   │  ← Section header
│ ┌─────────────────────────────┐ │
│ │ ● Вода (гаряча)    73,92 ₴  │ │  ← Bill breakdown row
│ │   2,1 м³                     │ │
│ │ ─────────────────────────── │ │
│ │ ● Вода (холодна)  126,72 ₴  │ │
│ │   3,6 м³                     │ │
│ │ ─────────────────────────── │ │
│ │ ● Електроенергія 1 235,52 ₴ │ │
│ │   286 кВт·год                │ │
│ │ ─────────────────────────── │ │
│ │ ● Газ              962,36 ₴  │ │
│ │   44 м³                      │ │
│ │ ═════════════════════════════│ │
│ │ Разом           2 398,52 ₴  │ │  ← Total row (bold)
│ └─────────────────────────────┘ │
│                                 │
│ Чому рахунок змінився            │  ← Section header
│ ┌─────────────────────────────┐ │
│ │ Зміна vs липень  ↑ +47 ₴    │ │
│ │ 1 950 → 1 997 ₴  Прогноз:   │ │
│ │                  2 399 ₴    │ │
│ │ ─────────────────────────── │ │
│ │ ↑ Електро +15%       +47 ₴  │ │
│ │ ↓ Газ -8%            -12 ₴  │ │
│ └─────────────────────────────┘ │
│                                 │
│ pb-[calc(80px+safe-area)]       │
├─────────────────────────────────┤
│  🏠   📊   📸   ⚙️             │  ← BottomNav
└─────────────────────────────────┘
```

**Content priority order (top to bottom):**
1. Greeting + date (AC-7.2 context)
2. Hero bill prediction card (AC-7.1–7.5)
3. Deadline alerts (AC-9.1, AC-9.2)
4. Quick action → Submit (navigation shortcut)
5. Smart insights (AC-8.1–8.7)
6. Meter cards list (context for all meters)
7. Bill breakdown (AC-7.5)
8. Bill explanation (change factors)

**Tablet (768px)**: Same layout, content constrained to `max-w-lg` (512px), centered. Hero card slightly wider.

**Desktop (1024px)**: Two-column layout below hero:
- Left column (60%): Meter cards, bill breakdown
- Right column (40%): Insights, bill explanation
- Hero card spans full width at top

---

### 4.2. S-SUBMIT — Submit Reading Flow

#### S-SUBMIT-1: Meter Selection (AC-1.1–1.4)

```
┌─────────────────────────────────┐
│  Передати показники              │  ← h1: text-2xl font-bold
│  Оберіть лічильник для передачі  │  ← text-sm text-muted-foreground
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💧 Вода (гаряча)    182,34 →│ │  ← MeterCard (compact, selectable)
│ │    №14091126         м³     │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 💧 Вода (холодна)   345,67 →│ │
│ │    №14097821         м³     │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ⚡ Електроенергія  12 453  →│ │
│ │    №2400786276    кВт·год   │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🔥 Газ              5 678  →│ │
│ │    №98040            м³     │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│  🏠   📊   📸(active)   ⚙️     │
└─────────────────────────────────┘
```

**No back button** on this step (AC-1.4).

#### S-SUBMIT-2: Photo Capture (AC-2.1–2.6)

```
┌─────────────────────────────────┐
│  ← Назад                         │  ← Back button (AC-1.4)
│                                 │
│  Фото лічильника                 │  ← h1: text-2xl font-bold
│  Електроенергія • №2400786276   │  ← text-sm text-muted-foreground (AC-1.3)
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │    ┌───────────────────┐   │ │  ← Camera viewfinder
│ │    │                   │   │ │    aspect-[3/4], rounded-3xl
│ │    │  [Scanning Frame] │   │ │    border-2 border-dashed
│ │    │  ~60% height      │   │ │
│ │    │                   │   │ │
│ │    └───────────────────┘   │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│  Наведіть камеру на дисплей      │  ← Tip text (AC-2.2)
│  лічильника. Цифри мають бути   │
│  чітко видимими.                │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💡 Порада: Фотографуйте за  │ │  ← Tip card
│ │ прямого світла. Уникайте    │ │
│ │ відблисків на дисплеї.       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  📸  Зробити фото            │ │  ← Capture button (primary)
│ └─────────────────────────────┘ │    bg-gradient secondary, full width
│                                 │
│  🔒 Фото залишається на          │  ← Privacy notice (AC-2.5)
│  пристрої. На сервер            │    text-xs text-muted-foreground
│  передається лише цифра.        │    text-center
│                                 │
└─────────────────────────────────┘
```

**Camera Unavailable State (E-CAMERA, AC-2.6)**:
```
┌─────────────────────────────────┐
│  ← Назад                         │
│                                 │
│  Фото лічильника                 │
│  Електроенергія • №2400786276   │
│                                 │
│ ┌─────────────────────────────┐ │
│ │     ⚠️                       │ │  ← AlertCircle icon, danger color
│ │  Камера недоступна.          │ │  ← text-sm text-danger
│ │  Перевірте дозволи додатка.  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  ⌨  Ввести значення вручну   │ │  ← Fallback button (secondary)
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

#### S-SUBMIT-3: OCR Processing (AC-3.1)

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│           ⟳ (spinner)           │  ← Loader2, h-12 w-12, animate-spin
│                                 │    text-primary-500
│       Розпізнаю цифри...         │  ← text-sm text-muted-foreground
│                                 │
│                                 │
└─────────────────────────────────┘
```

**No back button** — processing is uninterruptible.

#### S-SUBMIT-4: Confirm / Edit Value (AC-3.2–3.7)

```
┌─────────────────────────────────┐
│  ← Назад                         │  ← Back → photo step (AC-1.4)
│                                 │
│  Перевірте показник             │  ← h1: text-2xl font-bold
│  Електроенергія • №2400786276   │  ← text-sm text-muted-foreground (AC-1.3)
│                                 │
│ ┌─────────────────────────────┐ │
│ │     Розпізнано OCR           │ │  ← text-xs text-muted-foreground
│ │                              │ │
│ │       12 512                 │ │  ← text-5xl font-bold tabular-nums
│ │       кВт·год                 │ │    text-foreground tracking-tight
│ │                              │ │
│ │     ✓ Впевненість 96%        │ │  ← Badge: bg-success-light
│ │                              │ │    text-success, rounded-full
│ └─────────────────────────────┘ │
│                                 │
│  Виправити значення (за потреби)│  ← label: text-sm font-medium
│ ┌─────────────────────────────┐ │
│ │ 12 512                       │ │  ← Input: h-12, rounded-xl
│ └─────────────────────────────┘ │    border-border-strong, text-lg
│                                 │    font-semibold tabular-nums
│                                 │
│ ┌─────────────────────────────┐ │  ← Warning (AC-3.5) — conditional
│ │ ⚠ Показник менший за        │ │    border-danger/20 bg-danger-light
│ │ попередній (12 453).         │ │    text-danger
│ │ Перевірте значення.          │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  📤  Передати на EPS          │ │  ← Submit button (primary)
│ └─────────────────────────────┘ │    bg-gradient primary, full width
│                                 │
└─────────────────────────────────┘
```

**OCR Failed State (E-OCR-FAIL, AC-3.7)**:
```
│ ┌─────────────────────────────┐ │
│ │     Розпізнано OCR           │ │
│ │                              │ │
│ │  Не вдалося розпізнати.      │ │  ← text-danger, text-sm
│ │  Введіть значення вручну.    │ │
│ │                              │ │
│ └─────────────────────────────┘ │
│                                 │
│  Показник лічильника             │  ← label
│ ┌─────────────────────────────┐ │
│ │ (empty, placeholder)         │ │  ← Input: empty, pre-focused
│ └─────────────────────────────┘ │
```

**OCR Unavailable State (E-OCR-UNAVAILABLE, AC-15.4)**:
```
│ ┌─────────────────────────────┐ │
│ │ ⚠ OCR недоступний.           │ │
│ │ Введіть показник вручну.     │ │
│ └─────────────────────────────┘ │
│                                 │
│  Показник лічильника             │
│ ┌─────────────────────────────┐ │
│ │ (empty, placeholder)         │ │
│ └─────────────────────────────┘ │
```

#### S-SUBMIT-5: EPS Submitting (AC-4.1, AC-4.2)

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│           ⟳ (spinner)           │  ← Loader2, h-12 w-12, animate-spin
│                                 │    text-primary-500
│      Передаю на EPS...           │  ← text-sm text-muted-foreground
│                                 │
│                                 │
└─────────────────────────────────┘
```

**No back button** — submission is uninterruptible.

**EPS Credentials Not Set (E-EPS-NO-CREDS, AC-4.7)**:
Instead of showing the submitting spinner, redirect to `/settings#eps` with a toast/message:
```
┌─────────────────────────────────┐
│  ⚠ Спочатку налаштуйте EPS      │  ← Toast/banner at top of Settings
│  акаунт.                        │
│                                 │
│  EPS Акаунт                      │  ← Settings → EPS section (highlighted)
│  ┌─────────────────────────────┐│
│  │ EPS Ternopil  [Не підключено]││  ← Gray badge (AC-10.2)
│  │ Акаунт #—                    ││
│  │ [Налаштувати →]              ││  ← Button to credentials form
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

#### S-SUBMIT-6: Success / Done (AC-4.3, AC-4.5, AC-4.6)

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│           ✅ (green)             │  ← CheckCircle in circle
│                                 │    bg-gradient success, h-24 w-24
│       Готово! ✅                 │  ← h1: text-2xl font-bold
│                                 │
│  Показник 12 512 кВт·год        │  ← text-sm, value in semibold
│  передано на EPS                 │
│                                 │
│  Електроенергія • №2400786276   │  ← text-xs text-muted-foreground
│                                 │
│ ┌─────────────────────────────┐ │
│ │  Передати ще один            │ │  ← Secondary button (outline)
│ └─────────────────────────────┘ │    Resets to meter selection (AC-4.6)
│                                 │
│  На головну                     │  ← Ghost link (AC-4.6)
│                                 │    text-sm text-muted-foreground
└─────────────────────────────────┘
```

**EPS Submission Failed State (E-EPS-FAIL, AC-4.4)**:
```
┌─────────────────────────────────┐
│                                 │
│           ❌ (red)               │  ← XCircle icon, danger color
│                                 │
│  Не вдалося передати на EPS.    │  ← text-sm text-danger
│  Перевірте підключення та       │
│  спробуйте ще раз.               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  ↻  Повторити                │ │  ← Retry button (primary)
│ └─────────────────────────────┘ │
│                                 │
│  Відкрити EPS вручну →          │  ← Fallback link (ghost)
│                                 │
└─────────────────────────────────┘
```

---

### 4.3. S-HISTORY — History & Analytics

**Mobile (375px)**

```
┌─────────────────────────────────┐
│  Історія                         │  ← h1: text-2xl font-bold
│  Витрата та платежі за місяцями │  ← text-sm text-muted-foreground
│                                 │
│ ┌──┬──┬──┬──┐                   │  ← Horizontally scrollable pills
│ │💧│💧│⚡│🔥│                   │    (AC-5.1)
│ │Вода│Вода│Елект│Газ│           │    overflow-x-auto, pb-2
│ └──┴──┴──┴──┘                   │    selected: bg=meter.color, text=white
│                                 │    unselected: border, text-muted
│                                 │
│ ┌─────────────────────────────┐ │  ← Meter info card
│ │ 💧 Вода (гаряча)    Тариф:   │ │
│ │   №14091126        35,20 ₴/м³│ │  (AC-5.3)
│ │                              │ │
│ │  ↑ 4,2%  vs попередній міс  │ │  ← Trend badge (AC-5.4)
│ │                              │ │    up=orange, down=green
│ │  [    Bar Chart    ]         │ │  ← UsageChart, h-[160px] (AC-5.2)
│ │  трав  чер  лип              │ │    bars use meter.color
│ │                              │ │
│ │ ───────────────────────────  │ │
│ │ Витрата за останній  Вартість │ │  (AC-6.1)
│ │ 4,11 м³            144,67 ₴  │ │
│ └─────────────────────────────┘ │
│                                 │
│ По місяцях                       │  ← Section header
│ ┌─────────────────────────────┐ │
│ │ лип  4,11 м³       144,67 ₴ │ │  ← Monthly breakdown (AC-5.5)
│ │ ─────────────────────────── │ │    sorted newest first
│ │ чер  2,11 м³        74,27 ₴ │ │
│ │ ─────────────────────────── │ │
│ │ трав 4,22 м³       148,54 ₴ │ │
│ └─────────────────────────────┘ │
│                                 │
│ Аналітика                        │  ← Section header
│ ┌─────────────────────────────┐ │
│ │ 📊 Річні порівняння та      │ │  ← Placeholder (AC-5.6)
│ │ аналітика будуть доступні   │ │    border-dashed, bg-muted/30
│ │ після 6 місяців використання│ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│  🏠   📊(active)   📸   ⚙️     │
└─────────────────────────────────┘
```

**Empty State (EMPTY-HISTORY, AC-5.7)**:
```
│ ┌─────────────────────────────┐ │
│ │                              │ │
│ │     📊 (muted icon)          │ │
│ │                              │ │
│ │  Поки немає даних.           │ │
│ │  Передайте перший показник,  │ │
│ │  щоб побачити графік.        │ │
│ │                              │ │
│ │  [Передати показники →]     │ │  ← Link to /submit
│ │                              │ │
│ └─────────────────────────────┘ │
```

**Tablet/Desktop**: Chart card expands to full width. Monthly breakdown becomes two-column grid on desktop.

---

### 4.4. S-SETTINGS — Settings & Profile

**Mobile (375px)**

```
┌─────────────────────────────────┐
│  Налаштування                    │  ← h1: text-2xl font-bold
│  Профіль та конфігурація         │  ← text-sm text-muted-foreground
│                                 │
│ ┌─────────────────────────────┐ │  ← Profile card
│ │  [РК]  Роман Крепич         │ │    Avatar: h-14 w-14 rounded-full
│ │        вул. Карпенка 18а/76, │ │    bg-gradient primary
│ │        Тернопіль             │ │
│ └─────────────────────────────┘ │
│                                 │
│ EPS АКАУНТ                       │  ← Section label (uppercase, xs)
│ ┌─────────────────────────────┐ │
│ │ 🔗 EPS Ternopil  [Підключено]│ │  ← AC-10.1, AC-10.2
│ │    Акаунт #2099000225595     │ │    Green badge when connected
│ │ ─────────────────────────── │ │
│ │ Відкрити EPS              → │ │  ← AC-10.5: link to eps.org.ua
│ └─────────────────────────────┘ │
│                                 │
│ НАГОЛОЩЕННЯ                      │  ← Section label
│ ┌─────────────────────────────┐ │
│ │ Нагадування про показники   │ │  ← AC-9.5
│ │ За 3 дні до дедлайну   [ON ] │ │    Toggle: h-6 w-11
│ │ ─────────────────────────── │ │
│ │ Нагадування про оплату      │ │
│ │ Коли рахунок доступний [ON ] │ │
│ │ ─────────────────────────── │ │
│ │ Зміна тарифів               │ │
│ │ Сповіщення при зміні  [OFF]  │ │
│ │ ─────────────────────────── │ │
│ │ Аномалії витрати            │ │
│ │ Неочікуване збільшення [ON ] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ПРИВАТНІСТЬ                      │  ← Section label
│ ┌─────────────────────────────┐ │
│ │ 🛡 Фото залишаються на      │ │  ← NFR-6
│ │    пристрої                  │ │
│ │ OCR працює локально...       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ПРО ДОДАТОК                      │  ← Section label
│ ┌─────────────────────────────┐ │  ← AC-11.1–11.4
│ │ Версія           0.1.0 (MVP) │ │
│ │ OCR Engine    Google ML Kit v2│ │
│ │ EPS інтеграція   WebView + JS│ │
│ └─────────────────────────────┘ │
│                                 │
│ Communal v0.1.0 • Зроблено з ❤️ │  ← Footer (AC-11.3)
│ для України                      │    text-xs text-muted-foreground
│                                 │    text-center
├─────────────────────────────────┤
│  🏠   📊   📸   ⚙️(active)     │
└─────────────────────────────────┘
```

**EPS Not Connected State (AC-10.2, AC-10.3)**:
```
│ ┌─────────────────────────────┐ │
│ │ 🔗 EPS Ternopil [Не підкл.] │ │  ← Gray badge
│ │    Акаунт #—                 │ │
│ │ ─────────────────────────── │ │
│ │ [Налаштувати →]              │ │  ← Button opens credentials form
│ └─────────────────────────────┘ │
```

**EPS Credentials Form (modal/inline, AC-10.3, AC-10.6)**:
```
│ ┌─────────────────────────────┐ │
│ │  Налаштування EPS акаунту    │ │
│ │                              │ │
│ │  Логін EPS                    │ │
│ │  ┌─────────────────────────┐ │ │
│ │  │ (input)                  │ │ │
│ │  └─────────────────────────┘ │ │
│ │                              │ │
│ │  Пароль EPS                   │ │
│ │  ┌─────────────────────────┐ │ │
│ │  │ (password input)        │ │ │
│ │  └─────────────────────────┘ │ │
│ │                              │ │
│ │  [Зберегти та перевірити]    │ │  ← Primary button
│ │  [Скасувати]                 │ │  ← Ghost button
│ │                              │ │
│ │  (validation feedback area)  │ │  ← AC-10.6
│ └─────────────────────────────┘ │
```

---

## 5. User Flows

### 5.1. E1 — Подача показників через OCR (US-1 → US-4)

```
[Home / FAB]
    │
    ▼
[Meter Selection (S-SUBMIT-1)]
    │
    ├── User taps meter card ────────────────────────┐
    │                                                │
    ▼                                                │
[Photo Capture (S-SUBMIT-2)]                         │
    │                                                │
    ├── Camera available? ── No ──► [E-CAMERA]       │
    │                          │                    │
    │                          ▼                    │
    │                    [Manual Input fallback]      │
    │                          │                    │
    │                          └──► [Confirm step]  │
    │                                               │
    ├── Yes ──► User taps "Зробити фото"             │
    │              │                                │
    │              ▼                                │
    │         [Capture button disabled (AC-2.4)]     │
    │              │                                │
    │              ▼                                │
    │         [OCR Processing (S-SUBMIT-3)]           │
    │              │                                │
    │              ├── OCR success ──► [Confirm (S-SUBMIT-4)]
    │              │                        │       │
    │              │                        ├── Value < last reading?
    │              │                        │   Yes ► [Warning E-MONOTONICITY]
    │              │                        │   No  ► (continue)
    │              │                        │       │
    │              │                        ▼       │
    │              │             [User taps "Передати на EPS"]
    │              │                        │       │
    │              │                        ├── EPS creds configured?
    │              │                        │   No  ► [E-EPS-NO-CREDS → Settings]
    │              │                        │   Yes │
    │              │                        ▼       │
    │              │             [EPS Submitting (S-SUBMIT-5)]
    │              │                        │       │
    │              │                        ├── Success ► [Done (S-SUBMIT-6)]
    │              │                        │                │
    │              │                        │                ├── "Передати ще один" → [S-SUBMIT-1]
    │              │                        │                └── "На головну" → [Home]
    │              │                        │
    │              │                        └── Fail ► [E-EPS-FAIL]
    │              │                                   ├── "Повторити" → [S-SUBMIT-5]
    │              │                                   └── "Відкрити EPS вручну" → browser
    │              │                                           │
    │              ├── OCR fail ──► [E-OCR-FAIL]       │
    │              │                  └──► [Manual input → Confirm]│
    │              │                                           │
    │              └── OCR unavailable ──► [E-OCR-UNAVAILABLE]    │
    │                                   └──► [Manual input → Confirm]
    │
    └── Back button (AC-1.4):
        photo → select
        confirm → photo
        ocr → (disabled)
        submitting → (disabled)
```

### 5.2. E2 — Історія та аналітика (US-5, US-6)

```
[Bottom Nav → Історія]
    │
    ▼
[History page loads]
    │
    ├── API fetch readings for default meter
    │      │
    │      ├── Loading ──► [L-SKELETON: shimmer chart + list]
    │      │
    │      ├── Success ──► [Chart + breakdown render]
    │      │
    │      └── Fail ──► [E-API-FAIL: retry button]
    │
    ├── Readings exist? ── No ──► [EMPTY-HISTORY: "Поки немає даних..."]
    │                  │
    │                  Yes
    │                  │
    │                  ▼
    │           [Meter selector pills (AC-5.1)]
    │                  │
    │                  ├── User taps different pill
    │                  │      │
    │                  │      ▼
    │                  │   [Chart + data re-render for new meter]
    │                  │
    │                  ▼
    │           [Bar chart: 12 months (AC-5.2)]
    │           [Trend badge (AC-5.4)]
    │           [Monthly summary: usage + cost (AC-6.1)]
    │           [Monthly breakdown list (AC-5.5)]
    │           [Analytics placeholder (AC-5.6)]
    │
    └── < 6 months data? ── Yes ──► [Placeholder shown]
                              No   ──► [Future: analytics section]
```

### 5.3. E3 — Прогноз рахунку та insights (US-7, US-8)

```
[Home page loads]
    │
    ▼
[Fetch bill predictions + insights from API (AC-13.2)]
    │
    ├── Loading ──► [L-SKELETON: hero card shimmer + insight card shimmers]
    │
    ├── Success ──► [Hero card renders with total (AC-7.1)]
    │                  │
    │                  ├── Any meter with no readings? (AC-7.6)
    │                  │   Yes ──► [Show "Немає даних" next to meter name]
    │                  │   No   ──► [Show predicted amount + usage]
    │                  │
    │                  ▼
    │              [Bill breakdown renders (AC-7.5)]
    │              [Smart insights render (AC-8.1–8.7)]
    │                  │
    │                  ├── ≥3 months streak? (AC-8.2) ──► [Streak insight (orange)]
    │                  ├── ≥15% usage change? (AC-8.3) ──► [Anomaly insight (red/green)]
    │                  ├── Electricity meter? (AC-8.4) ──► [CO₂ insight (green)]
    │                  ├── Always (AC-8.5) ──► [Savings tip (amber)]
    │                  └── Gas meter? (AC-8.6) ──► [Seasonal insight (teal)]
    │
    └── Fail ──► [E-API-FAIL: error state with retry]
```

### 5.4. E4 — Нагадування (US-9)

```
[Home page loads]
    │
    ▼
[Fetch reminders from API]
    │
    ▼
[For each reminder:]
    │
    ├── daysLeft ≤ 3? (AC-9.1)
    │   Yes ──► [Urgent alert: danger color, AlertCircle icon]
    │          [Text: "{serviceName} — передати до {date}"]
    │          [Subtext: "Залишилось {N} днів"]
    │
    └── daysLeft > 3? (AC-9.2)
        Yes ──► [Upcoming reminder: muted style, Bell icon]
               [Text: "{serviceName} — передити до {date} числа"]
               [Subtext: "Ще {N} днів"]

[Settings → Notifications (AC-9.5–9.7)]
    │
    ├── User toggles notification type ON (AC-9.7)
    │   ──► Schedule local notifications for all upcoming deadlines of that type
    │
    └── User toggles notification type OFF (AC-9.6)
        ──► Cancel all scheduled notifications of that type
```

### 5.5. E5 — Налаштування та профіль (US-10, US-11)

```
[Settings page loads]
    │
    ▼
[Fetch settings from API (AC-13.5)]
    │
    ├── Loading ──► [L-SKELETON]
    ├── Success ──► [Render all sections]
    │                  │
    │                  ├── EPS credentials stored? (AC-10.2)
    │                  │   Yes ──► [Show "Підключено" green badge]
    │                  │   No   ──► [Show "Не підключено" gray badge + "Налаштувати" button]
    │                  │             │
    │                  │             ▼
    │                  │         [User taps "Налаштувати" (AC-10.3)]
    │                  │             │
    │                  │             ▼
    │                  │         [Credentials form opens]
    │                  │             │
    │                  │             ▼
    │                  │         [User enters username + password, taps "Зберегти"]
    │                  │             │
    │                  │             ▼
    │                  │         [Validate by attempting login (AC-10.6)]
    │                  │             │
    │                  │             ├── Success ──► [Badge → "Підключено", form closes]
    │                  │             └── Fail ──► [Error message in form]
    │                  │
    │                  └── About section renders (AC-11.1–11.4)
    │                      [Version from package.json, OCR engine, EPS method]
    │
    └── Fail ──► [E-API-FAIL: retry button]
```

### 5.6. E6 — БД та API (US-12, US-13)

This is a system-level epic. No direct user flow. Design impact:

- **Loading states (AC-13.6)**: Every page must show shimmer/skeleton matching the loaded content layout.
- **Error states (AC-13.7)**: Every page must show an error state with a retry button, never a blank page.

**Skeleton patterns:**

| Page | Skeleton Layout |
|------|----------------|
| Home | Hero card shimmer (h-120px) + 2 alert shimmers + 3 insight shimmers + 4 meter card shimmers |
| Submit | 4 compact meter card shimmers |
| History | Meter pill shimmers (4) + chart area shimmer (h-200px) + 3 list row shimmers |
| Settings | Profile card shimmer + 4 section card shimmers |

**Error state pattern:**
```
┌─────────────────────────────┐
│                              │
│        ⚠️ (danger icon)      │
│                              │
│  Не вдалося завантажити.     │
│  Перевірте підключення.      │
│                              │
│  [Спробувати ще раз]         │  ← Primary button, retry
│                              │
└─────────────────────────────┘
```

### 5.7. E7 — Android (Capacitor) (US-14, US-15)

Design impact on flows:

**Camera permission flow (AC-14.6)**:
```
[User taps "Зробити фото" first time]
    │
    ▼
[Android permission rationale dialog]
"Communal потребує доступ до камери
для фотографування лічильників."
[Дозволити] [Відмовити]
    │
    ├── Allow ──► [Camera viewfinder opens]
    │
    └── Deny ──► [E-CAMERA: "Камера недоступна..."]
```

**Notification permission flow (AC-14.7)**:
```
[App first launch]
    │
    ▼
[Android permission rationale]
"Communal надсилає нагадування
про дедлайни подачі показників."
[Дозволити] [Пізніше]
    │
    ├── Allow ──► [Schedule all notifications (AC-9.3)]
    └── Later ──► [Notifications disabled, can enable in Settings]
```

---

## 6. Component Specifications

### 6.1. Bill Hero Card (AC-7.1–7.3)

| Property | Value | Tailwind |
|----------|-------|----------|
| Container | relative overflow-hidden rounded-3xl | `relative overflow-hidden rounded-3xl` |
| Background | gradient 135deg, primary-500 → primary-600 | `bg-gradient-to-br from-primary-500 to-primary-600` |
| Padding | 20px (all sides) | `p-5` |
| Text color | white | `text-white` |
| Shadow | lg with primary tint | `shadow-lg shadow-primary-500/20` |
| Decorative circles | white/10 and white/5 | `bg-white/10`, `bg-white/5` |
| Label text | text-sm font-medium text-primary-50 | `text-sm font-medium text-primary-50` |
| Amount text | text-4xl font-bold tabular-nums tracking-tight | `text-4xl font-bold tracking-tight tabular-nums` |
| Meta text | text-xs text-primary-100 | `text-xs text-primary-100` |
| Animation | slide-up 500ms ease-out | `animate-slide-up` |

**States:**

| State | Visual Change |
|-------|---------------|
| Default | As above |
| Loading (skeleton) | `shimmer` class, no text, same dimensions |
| No data (AC-7.6) | Amount shows "—" instead of number; label unchanged |

### 6.2. Meter Card — Full (AC-1.1)

| Property | Value | Tailwind |
|----------|-------|----------|
| Container | rounded-2xl, border, surface bg | `rounded-2xl border border-border bg-surface` |
| Shadow | sm | `shadow-sm` |
| Icon container | h-12 w-12 rounded-xl | `flex h-12 w-12 items-center justify-center rounded-xl` |
| Icon bg | meter.colorLight (inline style) | `style={{ backgroundColor: meter.colorLight }}` |
| Icon color | meter.color (inline style) | `style={{ color: meter.color }}` |
| Icon size | h-6 w-6, strokeWidth=2 | `h-6 w-6` strokeWidth={2} |
| Service name | font-semibold text-foreground | `font-semibold text-foreground` |
| Meter number | text-xs text-muted-foreground | `text-xs text-muted-foreground` |
| Chevron | h-4 w-4 text-muted-foreground | `h-4 w-4 text-muted-foreground` |
| Footer divider | border-t border-border bg-muted/30 | `border-t border-border bg-muted/30` |
| Footer padding | px-4 py-3 | `px-4 py-3` |
| Last reading value | text-lg font-bold tabular-nums | `text-lg font-bold tabular-nums` |
| Last reading unit | text-sm font-normal text-muted-foreground | `text-sm font-normal text-muted-foreground` |
| Deadline text | text-sm font-medium text-foreground | `text-sm font-medium text-foreground` |
| Hover (web) | translateY(-2px), shadow increase | `card-hover` class |

**States:**

| State | Visual Change |
|-------|---------------|
| Default | border-border, bg-surface |
| Hover (web only) | translateY(-2px), shadow-lg |
| Active (pressed) | translateY(0), shadow-sm |
| Focus | focus:ring-4 focus:ring-primary-100 |
| Selected | border-primary-500, bg-primary-50 |

### 6.3. Meter Card — Compact (AC-1.1, used in submit flow)

| Property | Value | Tailwind |
|----------|-------|----------|
| Container | rounded-2xl border border-border bg-surface p-3 | `rounded-2xl border border-border bg-surface p-3` |
| Icon container | h-10 w-10 rounded-xl | `flex h-10 w-10 items-center justify-center rounded-xl` |
| Icon size | h-5 w-5 | `h-5 w-5` |
| Service name | text-sm font-medium | `text-sm font-medium text-foreground` |
| Meter number | text-xs text-muted-foreground | `text-xs text-muted-foreground` |
| Reading value | text-sm font-semibold tabular-nums | `text-sm font-semibold tabular-nums` |
| Reading unit | text-xs text-muted-foreground | `text-xs text-muted-foreground` |

### 6.4. Deadline Alert — Urgent (AC-9.1)

| Property | Value | Tailwind |
|----------|-------|----------|
| Container | rounded-2xl border p-3 | `rounded-2xl border p-3` |
| Border color | danger at 15% opacity | `border-danger/15` |
| Background | danger-light | `bg-danger-light` |
| Icon container | h-9 w-9 rounded-full | `flex h-9 w-9 items-center justify-center rounded-full` |
| Icon bg | danger at 10% opacity | `bg-danger/10` |
| Icon | AlertCircle, h-5 w-5, text-danger | `h-5 w-5 text-danger` |
| Title text | text-sm font-semibold text-danger | `text-sm font-semibold text-danger` |
| Subtitle text | text-xs text-danger/80 | `text-xs text-danger/80` |
| Animation | fade-in 400ms | `animate-fade-in` |

### 6.5. Deadline Alert — Upcoming (AC-9.2)

| Property | Value | Tailwind |
|----------|-------|----------|
| Container | rounded-2xl border border-border bg-muted/50 p-3 | `rounded-2xl border border-border bg-muted/50 p-3` |
| Icon container | h-9 w-9 rounded-full bg-muted | `flex h-9 w-9 rounded-full bg-muted` |
| Icon | Bell, h-4 w-4, text-muted-foreground | `h-4 w-4 text-muted-foreground` |
| Title text | text-sm font-medium text-foreground | `text-sm font-medium text-foreground` |
| Subtitle text | text-xs text-muted-foreground | `text-xs text-muted-foreground` |

### 6.6. Insight Card (AC-8.1–8.7)

| Property | Value | Tailwind |
|----------|-------|----------|
| Container | rounded-2xl border p-3 | `rounded-2xl border p-3` |
| Icon container | h-10 w-10 rounded-xl | `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl` |
| Title | text-sm font-semibold | `text-sm font-semibold` |
| Description | text-xs text-muted-foreground | `text-xs text-muted-foreground mt-0.5 leading-relaxed` |
| Hover (web) | card-hover | `card-hover` |

**Insight type color mapping (AC-8.7):**

| Type | Icon | Color (text/icon) | Bg color | Hex |
|------|------|-------------------|---------|-----|
| Streak (AC-8.2) | Flame | `#f97316` (secondary-500) | `#fff7ed` (secondary-50) | Orange |
| Anomaly ↑ (AC-8.3) | AlertCircle | `#ef4444` (danger) | `#fee2e2` (danger-light) | Red |
| Anomaly ↓ (AC-8.3) | TrendingDown | `#16a34a` (success) | `#dcfce7` (success-light) | Green |
| CO₂ (AC-8.4) | Leaf | `#16a34a` (success) | `#dcfce7` (success-light) | Green |
| Saving (AC-8.5) | Zap | `#f59e0b` (warning) | `#fef3c7` (warning-light) | Amber |
| Seasonal (AC-8.6) | Lightbulb | `#14b8a6` (primary-500) | `#f0fdfa` (primary-50) | Teal |

### 6.7. Primary Button

| Property | Value | Tailwind |
|----------|-------|----------|
| Height | 48px | `h-12` |
| Width | full or auto | `w-full` or auto |
| Background | primary-500 | `bg-primary-500` |
| Text color | white | `text-white` |
| Font | text-base font-semibold | `text-base font-semibold` |
| Radius | 12px | `rounded-xl` |
| Padding | px-6 | `px-6` |
| Shadow | md with primary tint | `shadow-md shadow-primary-500/20` |

**States:**

| State | Tailwind |
|-------|----------|
| Default | `bg-primary-500 text-white` |
| Hover | `hover:bg-primary-600` |
| Active (pressed) | `active:bg-primary-700` |
| Focus | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300` |
| Disabled | `disabled:bg-disabled disabled:text-muted-foreground disabled:shadow-none` |

### 6.8. Secondary Button

| Property | Value | Tailwind |
|----------|-------|----------|
| Height | 44px | `h-11` |
| Background | secondary-100 | `bg-secondary-100` |
| Text color | secondary-700 | `text-secondary-700` |
| Font | text-sm font-semibold | `text-sm font-semibold` |
| Radius | 12px | `rounded-xl` |

**States:**

| State | Tailwind |
|-------|----------|
| Default | `bg-secondary-100 text-secondary-700` |
| Hover | `hover:bg-secondary-200` |
| Active | `active:bg-secondary-300` |
| Disabled | `disabled:bg-muted disabled:text-muted-foreground` |

### 6.9. Ghost Button

| Property | Value | Tailwind |
|----------|-------|----------|
| Height | 40px | `h-10` |
| Background | transparent | (none) |
| Text color | foreground | `text-foreground` |
| Font | text-sm font-medium | `text-sm font-medium` |
| Radius | 8px | `rounded-lg` |
| Padding | px-3 | `px-3` |

**States:**

| State | Tailwind |
|-------|----------|
| Default | `text-foreground` |
| Hover | `hover:bg-muted` |
| Active | `active:bg-muted/80` |

### 6.10. FAB — Floating Action Button

| Property | Value | Tailwind |
|----------|-------|----------|
| Size | 56x56px | `h-14 w-14` |
| Background | gradient secondary-500 → secondary-600 | `bg-gradient-to-br from-secondary-500 to-secondary-600` |
| Text color | white | `text-white` |
| Icon | Camera, h-6 w-6, strokeWidth=2.5 | `h-6 w-6` strokeWidth={2.5} |
| Radius | full (circle) | `rounded-full` |
| Shadow | lg with secondary tint | `shadow-lg shadow-secondary-500/30` |
| Margin top | -24px (elevated above bar) | `-mt-6` |
| Active | scale 95% | `active:scale-95` |

### 6.11. Text Input

| Property | Value | Tailwind |
|----------|-------|----------|
| Height | 48px | `h-12` |
| Width | full | `w-full` |
| Background | surface | `bg-surface` |
| Border | border-strong | `border border-border-strong` |
| Radius | 12px | `rounded-xl` |
| Padding | px-4 | `px-4` |
| Text | text-base text-foreground | `text-base text-foreground` |
| Placeholder | text-muted-foreground | `placeholder:text-muted-foreground` |
| Input mode | decimal | `inputMode="decimal"` |

**States:**

| State | Tailwind |
|-------|----------|
| Default | `border-border-strong bg-surface` |
| Focus | `focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100` |
| Error | `border-danger bg-danger-light/30` |
| Disabled | `bg-muted text-muted-foreground` |

### 6.12. Toggle Switch (AC-9.5)

| Property | Value | Tailwind |
|----------|-------|----------|
| Track height | 24px | `h-6` |
| Track width | 44px | `w-11` |
| Track radius | full | `rounded-full` |
| Knob size | 20x20px | `h-5 w-5` |
| Knob radius | full | `rounded-full` |
| Knob bg | white | `bg-white` |
| Knob shadow | sm | `shadow-sm` |

**States:**

| State | Track | Knob position |
|-------|-------|-------------|
| ON | `bg-primary-500` | `translate-x-5` |
| OFF | `bg-border` | `translate-x-0.5` |
| Disabled ON | `bg-primary-500/50` | `translate-x-5` |
| Disabled OFF | `bg-muted` | `translate-x-0.5` |

### 6.13. Bar Chart (AC-5.2)

| Property | Value |
|----------|-------|
| Height | 160px |
| Library | Recharts (web), MPAndroidChart (native) |
| Bar radius | [6, 6, 0, 0] (top corners) |
| Bar fill | meter.color |
| Bar opacity | gradient: 0.3 + (index/length) × 0.7 |
| X-axis | month names (uk-UA short), 11px, muted-foreground |
| Y-axis | usage values, 10px, muted-foreground |
| Grid lines | none |
| Tooltip | surface bg, border border, 12px radius, 12px font |

### 6.14. Meter Selector Pills (AC-5.1)

| Property | Value | Tailwind |
|----------|-------|----------|
| Container | flex gap-2 overflow-x-auto pb-2 | `flex gap-2 overflow-x-auto pb-2 -mx-4 px-4` |
| Pill | shrink-0 rounded-full px-4 py-2 | `shrink-0 rounded-full px-4 py-2 text-sm font-medium` |
| Selected | text-white shadow-md | `text-white shadow-md` + inline `backgroundColor: meter.color` |
| Unselected | border border-border bg-surface text-muted-foreground | `border border-border bg-surface text-muted-foreground` |
| Icon | h-4 w-4 | `h-4 w-4` strokeWidth={2} |

### 6.15. Badge

| Type | Background | Text | Tailwind |
|------|-----------|------|----------|
| Success (AC-10.2) | `#dcfce7` (success-light) | `#16a34a` (success) | `bg-success-light text-success` |
| Gray (AC-10.2) | `#f5f5f4` (muted) | `#78716c` (muted-foreground) | `bg-muted text-muted-foreground` |
| Confidence (AC-3.3) | `#dcfce7` (success-light) | `#16a34a` (success) | `bg-success-light text-success` |
| Urgent count (AC-9.1) | `#ffedd5` (secondary-100) | `#c2410c` (secondary-700) | `bg-secondary-100 text-secondary-700` |

**Common properties:** `rounded-full px-2 py-0.5 text-xs font-medium`

---

## 7. Responsive Behavior

### 7.1. Breakpoints

| Breakpoint | Min width | Tailwind | Layout |
|-----------|-----------|---------|--------|
| Phone | 375px | (default) | Single column, bottom nav, max-w-md |
| Large phone | 414px | (default) | Same as phone, slightly more breathing room |
| Tablet | 768px | `md:` | Single column centered, max-w-lg, bottom nav |
| Desktop | 1024px | `lg:` | Two-column where applicable, top nav, max-w-2xl |

### 7.2. Per-screen Responsive Behavior

#### Home (S-HOME)

| Element | Phone (375px) | Tablet (768px) | Desktop (1024px) |
|---------|-------------|----------------|-------------------|
| Content width | full - 32px padding | max-w-lg (512px) centered | max-w-2xl (672px) centered |
| Hero card | full width | full width | full width |
| Meter cards | stacked vertical | stacked vertical | 2-column grid |
| Insight cards | stacked vertical | stacked vertical | 2-column grid |
| Bill breakdown | full width list | full width list | full width list |
| Navigation | bottom nav | bottom nav | top nav |

#### Submit (S-SUBMIT)

| Element | Phone (375px) | Tablet (768px) | Desktop (1024px) |
|---------|-------------|----------------|-------------------|
| Meter selection list | stacked | stacked, max-w-lg | 2-column grid |
| Camera viewfinder | full width, aspect-3/4 | max-w-md centered | max-w-sm centered |
| OCR result card | full width | max-w-lg | max-w-md |
| Navigation | bottom nav | bottom nav | top nav |

#### History (S-HISTORY)

| Element | Phone (375px) | Tablet (768px) | Desktop (1024px) |
|---------|-------------|----------------|-------------------|
| Meter pills | horizontal scroll | horizontal scroll | horizontal scroll (or wrap) |
| Chart card | full width | max-w-lg | max-w-2xl |
| Monthly breakdown | single column list | single column list | 2-column grid |
| Analytics placeholder | full width | max-w-lg | max-w-2xl |
| Navigation | bottom nav | bottom nav | top nav |

#### Settings (S-SETTINGS)

| Element | Phone (375px) | Tablet (768px) | Desktop (1024px) |
|---------|-------------|----------------|-------------------|
| All sections | full width | max-w-lg | max-w-md |
| Credentials form | full width modal | centered modal | centered modal, max-w-sm |
| Navigation | bottom nav | bottom nav | top nav |

---

## 8. State Diagrams

### 8.1. Submit Flow State Machine

```
                    ┌─────────┐
                    │  select │ ← entry, no back button
                    └────┬────┘
                         │ tap meter
                         ▼
                    ┌─────────┐
              ┌─────│  photo  │ ← back → select
              │     └────┬────┘
              │          │ tap capture
              │          ▼
              │     ┌─────────┐
              │     │   ocr   │ ← no back (processing)
              │     └────┬────┘
              │          │
              │    ┌─────┼──────┐
              │    │     │      │
              │    ▼     ▼      ▼
              │  success fail  unavailable
              │    │     │      │
              │    │     └──────┴── manual ──┐
              │    │                           │
              │    ▼                           │
              │ ┌─────────┐                    │
              │ │ confirm │ ← back → photo    │
              │ └────┬────┘                    │
              │      │ tap "Передати на EPS"   │
              │      │                         │
              │      ├── no creds → settings   │
              │      │                         │
              │      ▼                         │
              │ ┌───────────┐                   │
              │ │ submitting│ ← no back         │
              │ └────┬──────┘                   │
              │      │                          │
              │   ┌──┴──┐                       │
              │   ▼     ▼                       │
              │ done   fail                     │
              │   │     │                        │
              │   │     └── retry → submitting   │
              │   │     └── manual → browser     │
              │   ▼                              │
              │ ┌─────────┐                       │
              │ │  done   │ ← terminal           │
              │ └────┬────┘                       │
              │      ├── "Передати ще" → select  │
              │      └── "На головну" → /         │
              └──────────────────────────────────┘
```

### 8.2. Loading State Pattern (all pages)

```
[Page mount]
    │
    ▼
[fetch API data]
    │
    ├── pending ──► [SKELETON: shimmer placeholders matching layout]
    │                  │
    │                  └── (timeout 10s) ──► [ERROR with retry]
    │
    ├── fulfilled ──► [CONTENT renders with animate-fade-in]
    │
    └── rejected ──► [ERROR: icon + message + retry button]
                        │
                        └── User taps retry ──► [fetch again]
```

### 8.3. Empty State Pattern

```
[Data fetched successfully]
    │
    ├── data.length > 0 ──► [Render content]
    │
    └── data.length === 0 ──► [EMPTY STATE]
                                  │
                                  ├── Icon (muted, h-16 w-16)
                                  ├── Title (text-sm font-medium)
                                  ├── Description (text-xs text-muted-foreground)
                                  └── CTA button (if applicable)
```

---

## 9. Accessibility

### 9.1. Contrast Ratios (WCAG AA, NFR-7)

| Element | Foreground | Background | Ratio | Pass? |
|---------|-----------|-----------|-------|-------|
| Body text | `#1c1917` (foreground) | `#fafaf9` (background) | 15.3:1 | ✅ |
| Body text on card | `#1c1917` | `#ffffff` (surface) | 16.1:1 | ✅ |
| Muted text | `#78716c` | `#fafaf9` | 4.6:1 | ✅ |
| Muted text on card | `#78716c` | `#ffffff` | 4.8:1 | ✅ |
| Hero card text | `#ffffff` | `#14b8a6` (primary-500) | 3.2:1 | ⚠️ Large text only |
| Hero card text | `#ffffff` | gradient to `#0d9488` (primary-600) | 3.8:1 | ⚠️ Large text only |
| Hero label | `#f0fdfa` (primary-50) | `#14b8a6` | 1.3:1 | ❌ Decorative only |
| Danger text | `#dc2626` | `#fee2e2` (danger-light) | 4.7:1 | ✅ |
| Success text | `#16a34a` | `#dcfce7` (success-light) | 4.5:1 | ✅ |
| Warning text | `#f59e0b` | `#fef3c7` (warning-light) | 3.2:1 | ⚠️ Large/bold only |
| Secondary-700 text | `#c2410c` | `#ffedd5` (secondary-100) | 4.8:1 | ✅ |
| Primary-600 (active nav) | `#0d9488` | `#ffffff` (surface) | 4.5:1 | ✅ |

**Note**: Hero card label (`text-primary-50` on gradient) is decorative supplementary text. The main amount (`text-white` on gradient) is large text (36px bold), which requires only 3:1 contrast — passes. For the small meta text (`text-primary-100`), consider using `text-white/80` for better contrast.

**Recommendation**: Change hero meta text from `text-primary-100` to `text-white/80` for improved contrast on the gradient.

### 9.2. Keyboard Navigation

**Focus order (top to bottom, left to right):**

**Home page:**
1. Quick action link (Передати показники)
2. First urgent alert (if any)
3. First insight card
4. First meter card
5. Bill breakdown rows
6. Bill explanation section
7. Bottom nav items (left to right)

**Submit page:**
1. Back button (if visible)
2. Meter cards / capture button / input field (depends on step)
3. Submit button

**History page:**
1. First meter pill
2. (chart is not keyboard-interactive)
3. Monthly breakdown rows

**Settings page:**
1. Profile card
2. EPS section items
3. Notification toggles
4. About section

**Focus styling**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2`

### 9.3. Screen Reader Labels

| Element | aria-label / aria-describedby |
|---------|------------------------------|
| FAB | `aria-label="Передати показники — відкрити камеру"` |
| Meter card (selectable) | `role="button" aria-label="{serviceName}, лічильник №{meterNumber}, останній показник {lastReading} {unit}"` |
| Toggle | `role="switch" aria-label="{notificationType}" aria-checked="{enabled}"` |
| Capture button | `aria-label="Зробити фото лічильника"` |
| Chart | `aria-label="Графік витрати за останні {N} місяців" role="img"` |
| Hero card | `aria-label="Прогноз рахунку за {month}: {amount} гривень"` |
| Urgent alert | `role="alert"` |
| OCR spinner | `aria-live="polite" aria-label="Розпізнаю цифри"` |
| EPS submitting | `aria-live="polite" aria-label="Передаю на EPS"` |
| Success checkmark | `role="status" aria-label="Показник успішно передано"` |

### 9.4. Touch Targets (NFR-7, AC-14.4)

| Element | Size | Meets 44×44px? |
|---------|------|----------------|
| Primary button | 48px height, full width | ✅ |
| Secondary button | 44px height | ✅ |
| Meter card | ~72px height (full), ~56px (compact) | ✅ |
| FAB | 56×56px | ✅ |
| Bottom nav item | ~48px height (icon + label) | ✅ |
| Toggle | 44px width × 24px height (track), but touch target extended to 44px via padding | ✅ (with padding) |
| Meter pill | ~36px height | ⚠️ Extend to 44px min via `min-h-[44px]` |
| Back button | ~32px height | ⚠️ Extend to 44px via `min-h-[44px]` padding |

### 9.5. Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-slide-up,
  .animate-pulse-soft {
    animation: none;
  }
  .card-hover {
    transition: none;
  }
  .card-hover:hover {
    transform: none;
  }
}
```

All animations must respect `prefers-reduced-motion`. The spinner (loading) is exempt as it communicates state.

---

## 10. Typography Scale

Complete reference from DESIGN_SYSTEM.md §3.

| Token | Size | Line Height | Weight | Usage | Tailwind equivalent |
|-------|------|-------------|--------|-------|---------------------|
| display | 36px (2.25rem) | 40px | 700 | Hero bill total | `text-4xl font-bold leading-10` |
| h1 | 24px (1.5rem) | 32px | 700 | Page titles | `text-2xl font-bold leading-8` |
| h2 | 18px (1.125rem) | 24px | 600 | Section headings | `text-lg font-semibold leading-6` |
| h3 | 16px (1rem) | 24px | 600 | Card titles | `text-base font-semibold leading-6` |
| body | 15px (0.9375rem) | 24px | 400 | Body copy | `text-sm leading-6` (Note: Tailwind text-sm = 14px. Use `text-[15px]` for exact) |
| small | 13px (0.8125rem) | 20px | 400 | Secondary labels | `text-xs leading-5` (Note: Tailwind text-xs = 12px. Use `text-[13px]` for exact) |
| xs | 11px (0.6875rem) | 16px | 500 | Captions, badges, nav labels | `text-[11px] font-medium leading-4` |
| button | 15px (0.9375rem) | 20px | 600 | Button labels | `text-[15px] font-semibold leading-5` |

**Font family**: `Inter` (primary), `Roboto` (Android fallback), `IBM Plex Mono` (numeric values).

**Tailwind font config**: `--font-sans: var(--font-inter), system-ui, -apple-system, sans-serif`

**Numeric formatting**: All meter readings, bill amounts, and usage values use `tabular-nums` (`font-variant-numeric: tabular-nums`) for alignment.

---

## 11. Spacing System

Complete reference from DESIGN_SYSTEM.md §4.

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| space-1 | 4px | `gap-1`, `p-1` | Tight gaps, icon spacing |
| space-2 | 8px | `gap-2`, `p-2` | Small gaps, badge padding |
| space-3 | 12px | `gap-3`, `p-3` | Card padding (compact), icon gaps |
| space-4 | 16px | `gap-4`, `p-4` | Card padding (standard), section gaps |
| space-5 | 20px | `p-5` | Hero card padding |
| space-6 | 24px | `gap-6`, `space-y-6` | Section spacing on pages |
| space-8 | 32px | `pt-8` | Large top padding |
| space-10 | 40px | `pt-10` | Spinner top offset |
| space-12 | 48px | `pt-12` | Page top padding |

**Page container**: `px-4 pt-12 pb-[calc(80px+env(safe-area-inset-bottom))]`
- Left/right padding: 16px
- Top padding: 48px (clears status bar area)
- Bottom padding: 80px (clears bottom nav) + safe area

---

## 12. Icon Specification

All icons from [Lucide React](https://lucide.dev/).

| Context | Icon | Size | strokeWidth | Color |
|---------|------|------|-------------|-------|
| Home nav | `Home` | 20px | 2 | primary-600 (active) / muted-foreground (inactive) |
| History nav | `BarChart3` | 20px | 2 | primary-600 (active) / muted-foreground (inactive) |
| Submit FAB | `Camera` | 24px | 2.5 | white |
| Settings nav | `Settings` | 20px | 2 | primary-600 (active) / muted-foreground (inactive) |
| Water meter | `Droplet` | 24px (full) / 20px (compact) | 2 | `#0ea5e9` (water) |
| Electricity meter | `Zap` | 24px / 20px | 2 | `#f59e0b` (electricity) |
| Gas meter | `Flame` | 24px / 20px | 2 | `#f97316` (gas) |
| Heating meter | `Thermometer` | 24px / 20px | 2 | `#ef4444` (heating) |
| OSBB meter | `Building` | 24px / 20px | 2 | `#64748b` (osbb) |
| Other meter | `Receipt` | 24px / 20px | 2 | `#64748b` |
| Urgent alert | `AlertCircle` | 20px | 2 | danger |
| Upcoming alert | `Bell` | 16px | 2 | muted-foreground |
| Back button | `ArrowLeft` | 16px | 2 | muted-foreground |
| Chevron right | `ChevronRight` | 16px / 20px | 2 | muted-foreground |
| Streak insight | `Flame` | 16px | 2 | secondary-500 |
| Anomaly insight ↑ | `AlertCircle` | 16px | 2 | danger |
| Anomaly insight ↓ | `TrendingDown` | 16px | 2 | success |
| CO₂ insight | `Leaf` | 16px | 2 | success |
| Savings insight | `Zap` | 16px | 2 | warning |
| Seasonal insight | `Lightbulb` | 16px | 2 | primary-500 |
| Trend up | `TrendingUp` | 12px | 2 | secondary-600 |
| Trend down | `TrendingDown` | 12px | 2 | success |
| Sparkles (hero) | `Sparkles` | 16px | 2 | primary-50 |
| Bill explanation | `Info` | 16px | 2 | primary-500 |
| Arrow up (factor) | `ArrowUp` | 14px | 2 | secondary-500 |
| Arrow down (factor) | `ArrowDown` | 14px | 2 | success |
| External link | `ExternalLink` | 16px | 2 | primary |
| Shield (privacy) | `Shield` | 20px | 2 | success |
| Upload (submit) | `Upload` | 20px | 2 | white |
| Check (success) | `Check` | 48px (hero) / 12px (badge) | 3 / 2 | white / success |
| Loader (spinner) | `Loader2` | 48px | 2 | primary-500 |
| User (profile) | `User` | 20px | 2 | (not currently used, avatar uses initials) |

---

## 13. Animation / Transition Specs

| Animation | Duration | Easing | CSS | Trigger |
|-----------|---------|--------|-----|---------|
| Page fade-in | 400ms | ease-out | `animate-fade-in` | Page mount |
| Hero slide-up | 500ms | ease-out | `animate-slide-up` | Home page mount |
| Card hover (web) | 200ms | ease | `.card-hover` transition | Mouse hover on cards |
| Button press | 100ms | ease | `active:scale-95` | Touch/click |
| OCR spinner | infinite | linear | `animate-spin` | OCR processing |
| EPS spinner | infinite | linear | `animate-spin` | EPS submission |
| Toggle switch | 200ms | ease | `transition-colors`, `transition-transform` | Toggle tap |
| Shimmer skeleton | 1.5s infinite | linear | `.shimmer` animation | API loading |
| Pulse soft | 2s infinite | ease-in-out | `animate-pulse-soft` | (reserved for alerts) |
| Meter pill select | 200ms | ease | `transition-all` | Pill tap |

**Reduced motion**: All non-essential animations disabled via `@media (prefers-reduced-motion: reduce)`. Spinners remain as they communicate state.

---

## 14. PRD Conflicts & Ambiguities Flagged

### 14.1. Color Mismatch (AC-7, Architecture Concern AC-7)

**Issue**: The current code uses `blue-500`/`blue-600` extensively (page.tsx hero card, BottomNav FAB, submit page capture button, submit page EPS button uses `cyan-500`/`teal-600`). DESIGN_SYSTEM.md mandates `primary-500` (#14b8a6 teal) and `secondary-500` (#f97316 terracotta).

**Affected files**:
- `src/app/page.tsx`: Hero card uses `from-blue-600 to-blue-500`, `shadow-blue-500/20`, `text-blue-50`, `text-blue-100`
- `src/app/page.tsx`: Quick action uses `border-blue-200 bg-blue-50`, `from-blue-600 to-blue-500`, `text-blue-600`
- `src/app/page.tsx`: Urgent count badge uses `bg-orange-100 text-orange-700` (should use secondary tokens)
- `src/app/submit/page.tsx`: Camera placeholder uses `from-blue-600 to-blue-500`, `border-blue-400`
- `src/app/submit/page.tsx`: Capture button uses `from-blue-600 to-blue-500`
- `src/app/submit/page.tsx`: EPS submit button uses `from-cyan-500 to-teal-600`
- `src/components/BottomNav.tsx`: FAB uses `from-blue-600 to-blue-500`, `shadow-blue-500/30`
- `src/app/settings/page.tsx`: Profile avatar uses `from-cyan-500 to-teal-600`
- `src/app/settings/page.tsx`: EPS icon uses `bg-cyan-100`, `text-cyan-600`
- `src/lib/types.ts`: SERVICE_CONFIG water color is `#3b82f6` (blue-500) — should be `#0ea5e9` per DESIGN_SYSTEM.md
- `src/lib/mockData.ts`: All water meters use `color: "#3b82f6"` — should be `#0ea5e9`
- `src/app/layout.tsx`: `viewport.themeColor` is `#0891b2` — should be `#14b8a6` (primary-500)

**Resolution**: See Developer Handoff §2 for complete mapping of old → new classes.

### 14.2. Dark Mode Classes Present Despite OOS-8

**Issue**: PRD OOS-8 explicitly excludes dark mode, but current code contains `dark:` classes in multiple files (page.tsx, submit/page.tsx, history/page.tsx, settings/page.tsx, DeadlineAlert.tsx, SmartInsights.tsx).

**Resolution**: Remove all `dark:` class variants. No dark mode is supported.

### 14.3. Font Mismatch

**Issue**: `layout.tsx` loads `Geist` and `Geist_Mono` fonts, but DESIGN_SYSTEM.md §3 specifies `Inter` as primary font with `Roboto` as Android fallback.

**Resolution**: Replace `Geist` with `Inter` in layout.tsx. Update CSS variable `--font-sans` to use Inter.

### 14.4. Missing 5th Meter (Heating) in Mock Data

**Issue**: The task description mentions "5 meters: water, electricity, gas, heating, OSBB" but `mockData.ts` only has 4 meters (hot water, cold water, electricity, gas). No heating or OSBB meter exists.

**Resolution**: This is a data gap, not a design issue. The design system supports heating (red) and OSBB (slate) colors. If meters are added later, the design accommodates them.

### 14.5. ServiceType "heating" Missing from TypeScript

**Issue**: `types.ts` defines `ServiceType = "water" | "electricity" | "gas" | "osbb" | "other"` — no `"heating"` type. But DESIGN_SYSTEM.md §6 defines heating color/icon. And `SERVICE_CONFIG` has no `heating` entry.

**Resolution**: Add `"heating"` to `ServiceType` union and add `heating` entry to `SERVICE_CONFIG` with color `#ef4444`, colorLight `#fee2e2`, icon `thermometer`.

### 14.6. Body Text Size Discrepancy

**Issue**: DESIGN_SYSTEM.md §3 specifies body text at 15px (`0.9375rem`), but Tailwind's `text-sm` is 14px. Current code uses `text-sm` for body text throughout.

**Resolution**: Use `text-[15px]` for body text where exact 15px is required, or accept 14px (`text-sm`) as the practical body size. Recommend accepting `text-sm` (14px) as the baseline since it's already implemented and 14px still meets the "minimum 15px" PRD requirement is actually a "minimum 15px" — so 14px fails. **Must use `text-[15px]` for body text.**

### 14.7. Settings Page Missing "Налаштувати" Button for Unconfigured EPS

**Issue**: AC-10.3 requires a "Налаштувати" button when EPS credentials are not stored. Current settings page always shows "Підключено" (connected) state with no credentials form.

**Resolution**: Design includes both states (connected/not connected) and a credentials form modal. See wireframe §4.4.

### 14.8. Submit Flow Missing Manual Input Fallback

**Issue**: AC-2.6 requires a manual input fallback when camera is unavailable. AC-3.7 and AC-15.4 require manual input when OCR fails or is unavailable. Current submit flow jumps from photo directly to OCR without a manual input path.

**Resolution**: Design includes E-CAMERA, E-OCR-FAIL, and E-OCR-UNAVAILABLE states, all leading to a manual input form that feeds into the confirm step.

### 14.9. Submit Flow Missing EPS Credentials Check

**Issue**: AC-4.7 requires redirect to Settings → EPS section when credentials are not configured. Current flow doesn't check.

**Resolution**: Design includes E-EPS-NO-CREDS state that redirects to `/settings#eps` with a banner message.

### 14.10. Notification Scheduling Not Implemented

**Issue**: AC-9.3–9.7 require local notification scheduling with Capacitor Local Notifications plugin. Current settings page has static toggles with no behavior.

**Resolution**: Design specifies toggle behavior in the user flow (§5.4). Implementation requires Capacitor integration (E7).

---

## 15. Acceptance Criteria Traceability Matrix

| AC ID | Screen | Component | Wireframe Section | Notes |
|-------|--------|-----------|-------------------|-------|
| AC-1.1 | S-SUBMIT-1 | MeterCard (compact) | §4.2 S-SUBMIT-1 | List with service name, meter #, last reading, date |
| AC-1.2 | S-SUBMIT-1 | MeterCard (clickable) | §4.2 S-SUBMIT-1 | Tap navigates to photo step |
| AC-1.3 | S-SUBMIT-2–4 | Header | §4.2 all steps | Service name + meter # in header |
| AC-1.4 | S-SUBMIT | Back button | §4.2 | Back on photo/confirm, not on select/done |
| AC-2.1 | S-SUBMIT-2 | Camera viewfinder | §4.2 S-SUBMIT-2 | Scanning frame ~60% screen height |
| AC-2.2 | S-SUBMIT-2 | Tip text | §4.2 S-SUBMIT-2 | Exact UA text specified |
| AC-2.3 | S-SUBMIT-2 | Capture button | §4.2 S-SUBMIT-2 | Captures photo, passes to OCR |
| AC-2.4 | S-SUBMIT-2 | Capture button (disabled) | §4.2 S-SUBMIT-2 | Disabled during capture |
| AC-2.5 | S-SUBMIT-2 | Privacy notice | §4.2 S-SUBMIT-2 | Exact UA text specified |
| AC-2.6 | E-CAMERA | Error + fallback | §4.2 E-CAMERA | Camera unavailable state |
| AC-3.1 | S-SUBMIT-3 | OCR spinner | §4.2 S-SUBMIT-3 | "Розпізнаю цифри..." |
| AC-3.2 | S-SUBMIT-4 | OCR result card | §4.2 S-SUBMIT-4 | Large centered card with unit |
| AC-3.3 | S-SUBMIT-4 | Confidence badge | §4.2 S-SUBMIT-4 | "Впевненість {N}%" |
| AC-3.4 | S-SUBMIT-4 | Edit input | §4.2 S-SUBMIT-4 | Pre-filled, labeled "Виправити значення" |
| AC-3.5 | E-MONOTONICITY | Warning card | §4.2 S-SUBMIT-4 | Red-bordered alert |
| AC-3.6 | S-SUBMIT-4 | Edit input | §4.2 S-SUBMIT-4 | Editable before submission |
| AC-3.7 | E-OCR-FAIL | Error + manual input | §4.2 E-OCR-FAIL | "Не вдалося розпізнати..." |
| AC-4.1 | S-SUBMIT-5 | EPS spinner | §4.2 S-SUBMIT-5 | "Передаю на EPS..." |
| AC-4.2 | S-SUBMIT-5 | WebView (hidden) | §4.2 S-SUBMIT-5 | Hidden WebView, JS injection |
| AC-4.3 | S-SUBMIT-6 | Success screen | §4.2 S-SUBMIT-6 | Green checkmark, value, meter info |
| AC-4.4 | E-EPS-FAIL | Error + retry + fallback | §4.2 E-EPS-FAIL | Error msg, retry, manual link |
| AC-4.5 | S-SUBMIT-6 | (DB storage) | §4.2 S-SUBMIT-6 | Stored after success |
| AC-4.6 | S-SUBMIT-6 | Action buttons | §4.2 S-SUBMIT-6 | "Передати ще один" + "На головну" |
| AC-4.7 | E-EPS-NO-CREDS | Redirect to settings | §4.2 E-EPS-NO-CREDS | Redirect with message |
| AC-5.1 | S-HISTORY | Meter pills | §4.3 | Horizontal scroll, first word + icon |
| AC-5.2 | S-HISTORY | UsageChart | §4.3 | Bar chart, 12 months, meter color |
| AC-5.3 | S-HISTORY | Tariff display | §4.3 | Below meter info header |
| AC-5.4 | S-HISTORY | Trend badge | §4.3 | Up=orange, down=green |
| AC-5.5 | S-HISTORY | Monthly breakdown | §4.3 | Newest first, month + usage + cost |
| AC-5.6 | EMPTY-ANALYTICS | Placeholder | §4.3 | "Річні порівняння..." |
| AC-5.7 | EMPTY-HISTORY | Empty state | §4.3 | "Поки немає даних..." |
| AC-6.1 | S-HISTORY | Summary row | §4.3 | Usage left, cost right |
| AC-6.2 | S-HISTORY | (calculation) | §4.3 | (last - prev) × tariff |
| AC-6.3 | S-HISTORY | (calculation) | §4.3 | Sum all tariffs for service |
| AC-7.1 | S-HOME | Hero card | §4.1 | Total predicted bill, uk-UA |
| AC-7.2 | S-HOME | Hero label | §4.1 | "Прогноз рахунку за {month}" |
| AC-7.3 | S-HOME | Hero meta | §4.1 | Meter count + last updated |
| AC-7.4 | S-HOME | (calculation) | §4.1 | Sum of per-meter predictions |
| AC-7.5 | S-HOME | Bill breakdown | §4.1 | Per-meter: name, amount, usage, total |
| AC-7.6 | S-HOME | "Немає даних" | §4.1 | For meters with no readings |
| AC-8.1 | S-HOME | SmartInsights | §4.1 | "Розумні підказки" section |
| AC-8.2 | S-HOME | Streak insight | §4.1 | "{N} місяців підряд" |
| AC-8.3 | S-HOME | Anomaly insight | §4.1 | Meter name, % change, description |
| AC-8.4 | S-HOME | CO₂ insight | §4.1 | CO₂ kg + tree equivalent |
| AC-8.5 | S-HOME | Savings insight | §4.1 | Night tariff tip |
| AC-8.6 | S-HOME | Seasonal insight | §4.1 | Gas winter pattern |
| AC-8.7 | S-HOME | Insight colors | §4.1, §6.6 | Distinct colors per type |
| AC-9.1 | S-HOME | Urgent alerts | §4.1 | ≤3 days, danger style, AlertCircle |
| AC-9.2 | S-HOME | Upcoming reminders | §4.1 | >3 days, muted style, Bell |
| AC-9.3 | (Android) | Local notifications | §5.7 | 3 days, 1 day, day-of, at 09:00 |
| AC-9.4 | (Android) | Notification content | §5.7 | "{serviceName} — передати до {date}" |
| AC-9.5 | S-SETTINGS | Notification toggles | §4.4 | 4 types |
| AC-9.6 | S-SETTINGS | Toggle OFF behavior | §5.4 | Cancel notifications |
| AC-9.7 | S-SETTINGS | Toggle ON behavior | §5.4 | Schedule notifications |
| AC-10.1 | S-SET-EPS | EPS section | §4.4 | Label, account #, status |
| AC-10.2 | S-SET-EPS | Status badge | §4.4 | Green/gray badge |
| AC-10.3 | S-SET-EPS | "Налаштувати" button | §4.4 | Opens credentials form |
| AC-10.4 | (System) | Secure storage | — | Capacitor SecureStoragePlugin |
| AC-10.5 | S-SET-EPS | "Відкрити EPS" link | §4.4 | Opens eps.org.ua in browser |
| AC-10.6 | S-SET-EPS | Validation feedback | §4.4 | Login attempt + success/fail |
| AC-11.1 | S-SET-ABOUT | About section | §4.4 | Version, OCR engine, EPS integration |
| AC-11.2 | S-SET-ABOUT | Version format | §4.4 | "{major}.{minor}.{patch} ({stage})" |
| AC-11.3 | S-SET-ABOUT | Version source + footer | §4.4 | package.json, footer text |
| AC-11.4 | S-SET-ABOUT | OCR + EPS info | §4.4 | Engine name, integration method |
| AC-12.1–12.7 | (System) | Database/API | — | Backend, no UI design |
| AC-13.1 | (System) | API migration | — | Replace mockData imports |
| AC-13.2 | S-HOME | API fetch | §5.3 | Fetch on page load |
| AC-13.3 | S-SUBMIT | POST reading | §5.1 | After EPS success |
| AC-13.4 | S-HISTORY | API fetch | §5.2 | Fetch readings for meter |
| AC-13.5 | S-SETTINGS | API fetch/update | §5.5 | Fetch and update settings |
| AC-13.6 | All | Skeleton loading | §5.6 | Shimmer matching layout |
| AC-13.7 | All | Error state | §5.6 | Error + retry, no blank page |
| AC-14.1–14.7 | (Android) | Capacitor config | — | See Android spec |
| AC-15.1–15.5 | (Android) | ML Kit OCR | — | See Android spec |

---

## Provenance

| Джерело | Тип | Дата доступу |
|---------|-----|-------------|
| `F:\communal\wiki\products\communal\prd\2026-08-22-communal-prd.md` | PRD | 2026-08-22 |
| `F:\communal\wiki\products\communal\business\2026-08-22-communal-brief.md` | Business Brief | 2026-08-22 |
| `F:\communal\DESIGN_SYSTEM.md` | Design System | 2026-08-22 |
| `F:\communal\src\lib\types.ts` | Code | 2026-08-22 |
| `F:\communal\src\lib\mockData.ts` | Code | 2026-08-22 |
| `F:\communal\src\app\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\submit\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\history\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\settings\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\layout.tsx` | Code | 2026-08-22 |
| `F:\communal\src\components\*.tsx` | Code | 2026-08-22 |
