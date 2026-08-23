# Communal — Android (Capacitor) Design Specification

| Поле | Значення |
|------|----------|
| **Документ** | Android Design Specification |
| **Продукт** | Communal |
| **Автор** | Senior UI/UX Designer (JAGM-TWIN-146) |
| **Дата** | 2026-08-22 |
| **Статус** | Draft → Pending Developer Review |
| **Версія** | 1.0 |
| **PRD** | [2026-08-22-communal-prd.md](../prd/2026-08-22-communal-prd.md) |
| **Design System** | [DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md) |
| **Design Spec** | [2026-08-22-communal-design-spec.md](2026-08-22-communal-design-spec.md) |

---

## 1. Overview

This document specifies the Material Design 3 adaptation of the Communal app for Android via Capacitor (US-14, US-15). The web app (Next.js) is wrapped in a Capacitor WebView and rendered natively on Android. The design must feel native while sharing the same codebase.

**Target devices:**
- Android phone (360px–428px width)
- Android tablet (600px–1024px width)
- Android versions 10+ (API 29+)

**Key PRD references:**
- US-14: Capacitor setup, safe areas, permissions
- US-15: On-device OCR via Google ML Kit
- AC-14.1–14.7: Android-specific requirements
- AC-15.1–15.5: OCR plugin requirements
- AC-9.3–9.4: Local notification scheduling

---

## 2. Material Design 3 Color Mapping

### 2.1. Light Theme (Default — OOS-8 excludes dark mode)

Mapping the Communal teal/terracotta palette to Material 3 color roles.

| M3 Color Role | Hex | Source Token | Usage |
|---------------|-----|-------------|-------|
| `colorPrimary` | `#14b8a6` | `--primary-500` | Primary buttons, active states, FAB icon |
| `colorOnPrimary` | `#FFFFFF` | — | Text on primary surfaces |
| `colorPrimaryContainer` | `#0d9488` | `--primary-600` | Pressed/hover primary, container fills |
| `colorOnPrimaryContainer` | `#f0fdfa` | `--primary-50` | Text on primary containers |
| `colorSecondary` | `#f97316` | `--secondary-500` | FAB background, CTA accents |
| `colorOnSecondary` | `#FFFFFF` | — | Text on secondary surfaces |
| `colorSecondaryContainer` | `#ffedd5` | `--secondary-100` | Secondary button backgrounds |
| `colorOnSecondaryContainer` | `#c2410c` | `--secondary-700` | Text on secondary containers |
| `colorTertiary` | `#0ea5e9` | `--water` | Water utility accent |
| `colorError` | `#dc2626` | `--danger` | Error states, urgent alerts |
| `colorOnError` | `#FFFFFF` | — | Text on error surfaces |
| `colorErrorContainer` | `#fee2e2` | `--danger-light` | Error backgrounds |
| `colorOnSurface` | `#1c1917` | `--foreground` | Primary text |
| `colorOnSurfaceVariant` | `#78716c` | `--muted-foreground` | Secondary text |
| `colorSurface` | `#FFFFFF` | `--surface` | Cards, sheets |
| `colorSurfaceContainer` | `#fafaf9` | `--background` | App background |
| `colorSurfaceContainerHigh` | `#FFFFFF` | `--surface-elevated` | Elevated cards |
| `colorOutline` | `#e7e5e4` | `--border` | Borders, dividers |
| `colorOutlineVariant` | `#d6d3d1` | `--border-strong` | Stronger borders (inputs) |

### 2.2. Utility Color Roles (Custom Extension)

M3 does not have native utility color roles. These are custom extensions:

| Custom Role | Hex | Usage |
|------------|-----|-------|
| `colorWater` | `#0ea5e9` | Water meter icons, chart bars |
| `colorWaterContainer` | `#e0f2fe` | Water meter icon backgrounds |
| `colorElectricity` | `#f59e0b` | Electricity meter icons, chart bars |
| `colorElectricityContainer` | `#fef3c7` | Electricity meter icon backgrounds |
| `colorGas` | `#f97316` | Gas meter icons, chart bars |
| `colorGasContainer` | `#ffedd5` | Gas meter icon backgrounds |
| `colorHeating` | `#ef4444` | Heating meter icons, chart bars |
| `colorHeatingContainer` | `#fee2e2` | Heating meter icon backgrounds |
| `colorOsbb` | `#64748b` | OSBB meter icons, chart bars |
| `colorOsbbContainer` | `#f1f5f9` | OSBB meter icon backgrounds |
| `colorCustomSuccess` | `#16a34a` | Success states, positive trends |
| `colorCustomSuccessContainer` | `#dcfce7` | Success backgrounds |
| `colorCustomWarning` | `#f59e0b` | Warning states, approaching deadlines |
| `colorCustomWarningContainer` | `#fef3c7` | Warning backgrounds |

### 2.3. Dark Theme Mapping (Reference Only — OOS-8)

Although dark mode is out of scope (OOS-8), the M3 dark theme mapping is documented for future reference:

| M3 Color Role | Light Hex | Dark Hex (future) |
|---------------|-----------|-------------------|
| `colorPrimary` | `#14b8a6` | `#5eead4` (primary-300) |
| `colorOnPrimary` | `#FFFFFF` | `#003734` (primary-900) |
| `colorPrimaryContainer` | `#0d9488` | `#115e59` (primary-800) |
| `colorSecondary` | `#f97316` | `#fdba74` (secondary-300) |
| `colorOnSecondary` | `#FFFFFF` | `#431307` (darker) |
| `colorSurface` | `#FFFFFF` | `#1c1917` (foreground inverted) |
| `colorOnSurface` | `#1c1917` | `#f5f5f4` (muted inverted) |
| `colorSurfaceContainer` | `#fafaf9` | `#292524` (stone-900) |
| `colorError` | `#dc2626` | `#fca5a5` |
| `colorOutline` | `#e7e5e4` | `#57534e` (stone-600) |

**Note**: Do NOT implement dark mode. This mapping exists for documentation only.

---

## 3. Touch Target & Gesture Patterns

### 3.1. Touch Target Sizes (AC-14.4, NFR-7)

| Element | Min Size | Actual Size | Meets 48dp? |
|---------|---------|-------------|-------------|
| Primary button | 48dp | 48dp (h-12) | ✅ |
| Secondary button | 48dp | 44dp (h-11) | ⚠️ Acceptable (MD3 FilledTonalButton is 40dp min) |
| Meter card (full) | 48dp | ~72dp | ✅ |
| Meter card (compact) | 48dp | ~56dp | ✅ |
| FAB | 56dp | 56dp (h-14) | ✅ |
| Bottom nav item | 48dp | ~48dp | ✅ |
| Toggle switch | 48dp | 44dp track (extended via padding) | ✅ |
| Meter pill | 48dp | 36dp → extend to 44dp min | ⚠️ Add `min-h-[44px]` |
| Back button | 48dp | 32dp → extend via padding | ⚠️ Add `min-h-[44px]` with padding |
| Icon button | 48dp | 40dp (h-10) | ⚠️ Extend to 48dp on Android |

### 3.2. Gesture Patterns

| Gesture | Action | Screen |
|---------|--------|--------|
| Tap | Select meter, capture photo, submit | All |
| Tap (toggle) | Toggle notification on/off | Settings |
| Horizontal swipe | Scroll meter selector pills | History |
| Vertical swipe | Scroll page content | All |
| Back gesture (Android) | Navigate back in submit flow | Submit |
| Pull-to-refresh | (Future) Refresh data | Home, History |

**Android back gesture**: The Android system back gesture/button must be intercepted in the submit flow to match the in-app back button behavior (AC-1.4). Use Capacitor's `backButton` event listener.

### 3.3. Haptic Feedback (Recommended)

| Action | Haptic Type |
|--------|-------------|
| Meter selection | `impactLight` |
| Photo capture | `impactMedium` |
| Successful EPS submission | `notificationSuccess` |
| EPS submission failure | `notificationError` |
| Toggle change | `impactLight` |

Implementation: `@capacitor/haptics` plugin.

---

## 4. Android-Specific Navigation

### 4.1. Bottom Navigation Bar (AC-14.5)

```
┌──────────────────────────────────────┐
│                                      │
│           Page Content               │
│         (scrollable)                 │
│                                      │
│                                      │
├──────┬──────┬───────┬──────┐         │
│  🏠  │  📊  │  📸   │  ⚙️  │         │
│Головна│Істор │Перед │Налаш│         │
│      │      │ (FAB)│      │         │
└──────┴──────┴───────┴──────┘         │
         safe-area-inset-bottom        │
```

**M3 NavigationBar spec:**
- Height: 80dp (including safe area)
- Background: `colorSurface` with 90% opacity + blur
- Border: 1dp top, `colorOutline`
- Active item: `colorPrimary` (icon + label)
- Inactive item: `colorOnSurfaceVariant` (icon + label)
- FAB: centered, -24dp margin top, 56dp circle, `colorSecondary` gradient

**Safe area handling (AC-14.4, AC-14.5):**
```css
.nav-container {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.page-container {
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}

.top-safe {
  padding-top: env(safe-area-inset-top, 0px);
}
```

**No overlap with Android system nav bar**: The `env(safe-area-inset-bottom)` ensures the bottom nav sits above the Android gesture bar / 3-button nav.

### 4.2. App Bar (Top)

The app does not use a traditional Material 3 TopAppBar. Instead, each page has a simple text header:

```
┌──────────────────────────────────────┐
│ pt-safe (notch clearance)             │
│                                      │
│  Привіт, Роман 👋                    │  ← text-2xl font-bold
│  п'ятниця, 22 серпня                  │  ← text-sm text-muted-foreground
│                                      │
```

**No action icons in app bar** — the app is single-user, no settings gear, no search, no overflow menu. Navigation is entirely via bottom nav.

**Exception — Submit flow**: The submit flow uses a back button instead of an app bar:
```
┌──────────────────────────────────────┐
│  ← Назад                              │  ← text-sm, min-h-[44px]
│                                      │
│  Фото лічильника                     │  ← text-2xl font-bold
│  Електроенергія • №2400786276        │  ← text-sm text-muted-foreground
│                                      │
```

### 4.3. Android Back Button / Gesture

| Current Step | Android Back Action |
|-------------|---------------------|
| Home, History, Settings | Exit app (default behavior) |
| Submit → select | Exit app or go to Home |
| Submit → photo | Go to select |
| Submit → ocr | Prevent (show toast "Зачекайте...") |
| Submit → confirm | Go to photo |
| Submit → submitting | Prevent (show toast "Зачекайте...") |
| Submit → done | Go to Home |

Implementation:
```typescript
// capacitor.config.ts or app entry
App.addListener('backButton', ({ canGoBack }) => {
  if (step === 'ocr' || step === 'submitting') {
    // Prevent back, show toast
    return;
  }
  // Default behavior (navigate back or exit)
});
```

---

## 5. Camera Integration UX (US-2, US-3, US-15)

### 5.1. Camera Permission Flow (AC-14.6)

```
[User taps "Зробити фото" — first time]
    │
    ▼
┌──────────────────────────────────────┐
│  Android Permission Rationale Dialog  │
│                                      │
│  📸 Доступ до камери                  │
│                                      │
│  Communal потребує доступ до камери  │
│  для фотографування лічильників.     │
│  Фото не залишають пристрій.         │
│                                      │
│  [Відмовити]    [Дозволити]          │
└──────────────────────────────────────┘
    │
    ├── Allow ──► Camera viewfinder opens
    │
    └── Deny ──► E-CAMERA state:
                 ┌──────────────────────────┐
                 │  ⚠️ Камера недоступна.    │
                 │  Перевірте дозволи       │
                 │  додатка.                │
                 │                          │
                 │  [Ввести вручну →]        │
                 │  [Налаштування →]        │
                 └──────────────────────────┘
```

**Rationale dialog text (AC-14.6):**
- Title: "📸 Доступ до камери"
- Body: "Communal потребує доступ до камери для фотографування лічильників. Фото не залишають пристрій."
- Buttons: "Відмовити" (secondary), "Дозволити" (primary)

**Permission request**: Use `@capacitor/camera` plugin's `checkPermissions()` and `requestPermissions()`.

### 5.2. Camera Viewfinder (AC-2.1)

```
┌──────────────────────────────────────┐
│  ← Назад                             │
│                                      │
│  Фото лічильника                     │
│  Електроенергія • №2400786276        │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │    ┌────────────────────────┐    │ │  ← Live camera feed
│ │    │                        │    │ │    aspect-[3/4]
│ │    │   Scanning Frame        │    │ │    rounded-3xl
│ │    │   ~60% screen height    │    │ │    border-2 border-primary-300
│ │    │                        │    │ │    rounded-2xl inside
│ │    │   (corner indicators)  │    │ │
│ │    │                        │    │ │
│ │    └────────────────────────┘    │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│  Наведіть камеру на дисплей          │
│  лічильника. Цифри мають бути        │
│  чітко видимими.                     │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │  📸  Зробити фото                 │ │  ← Capture button
│ └──────────────────────────────────┘ │    h-14, full width
│                                      │    bg-gradient secondary
│  🔒 Фото залишається на пристрої.   │
│  На сервер передається лише цифра.  │
│                                      │
└──────────────────────────────────────┘
```

**Scanning frame overlay (AC-2.1):**
- Height: ~60% of screen height
- Border: 2px, `colorPrimary` (`#14b8a6`), `rounded-2xl`
- Corner indicators: L-shaped corners at each corner of the frame (optional, for visual polish)
- Background dimming: outside the frame, 50% opacity dark overlay (optional)

**Capture button states:**
| State | Visual |
|-------|--------|
| Default | Full width, h-14, gradient secondary, "📸 Зробити фото" |
| Capturing | Disabled, opacity 50%, spinner inside button, text "Знімаю..." |
| Error | Revert to default, show error toast |

### 5.3. OCR Capture Flow (US-2 → US-3 → US-15)

```
[Capture button tapped]
    │
    ▼
[Button disabled, spinner shown (AC-2.4)]
    │
    ▼
[Photo captured from camera]
    │
    ▼
[Photo passed to ML Kit OCR engine (AC-15.1)]
    │
    ├── Processing (AC-3.1):
    │   ┌──────────────────────────┐
    │   │       ⟳ (spinner)        │
    │   │   "Розпізнаю цифри..."   │
    │   └──────────────────────────┘
    │   (NFR-1: <3 sec on mid-range Android)
    │
    ├── OCR success (AC-3.2–3.6):
    │   ──► Navigate to Confirm step
    │   ──► Display recognized value + confidence
    │
    ├── OCR fail (AC-3.7):
    │   ──► "Не вдалося розпізнати. Введіть значення вручну."
    │   ──► Empty editable input
    │
    └── OCR unavailable (AC-15.4):
        ──► "OCR недоступний. Введіть показник вручну."
        ──► Empty editable input
```

**ML Kit integration (AC-15.1–15.5):**
- Plugin: Capacitor plugin wrapping Google ML Kit Text Recognition v2
- Processing: entirely on-device (AC-15.3)
- Output: numeric value + confidence score (AC-15.2)
- Storage: `ocrEngine: "mlkit"` and `ocrConfidence` stored with reading (AC-15.5)
- No image data transmitted to server (NFR-6, AC-15.3)

### 5.4. Photo Privacy (AC-2.5, NFR-6)

Privacy notice displayed below capture button:
- Text: "🔒 Фото залишається на пристрої. На сервер передається лише цифра."
- Style: `text-xs text-muted-foreground text-center`
- Icon: 🔒 (emoji or `Lock` lucide icon at 12px)

The photo is processed locally by ML Kit and then discarded. Only the recognized numeric value is stored/transmitted.

---

## 6. WebView Interaction Design — EPS Submission (US-4)

### 6.1. EPS Submission Flow (AC-4.1–4.7)

The WebView is **hidden** — the user never sees it. The entire EPS submission happens in the background.

```
[User taps "Передати на EPS" (S-SUBMIT-4)]
    │
    ├── EPS credentials configured? (AC-4.7)
    │   No  ──► Redirect to /settings#eps
    │          Show banner: "Спочатку налаштуйте EPS акаунт."
    │
    │   Yes
    │   │
    │   ▼
    │  [Show spinner: "Передаю на EPS..." (AC-4.1)]
    │  [Open hidden WebView to eps.org.ua (AC-4.2)]
    │  [Inject JS to authenticate using stored credentials]
    │  [Navigate to meter reading submission page]
    │  [Fill in meter number + reading value]
    │  [Submit form]
    │  [Detect success/failure from page response]
    │   │
    │   ├── Success (AC-4.3):
    │   │   ──► Close WebView
    │   │   ──► Store reading in local DB (AC-4.5)
    │   │   ──► Show success screen (S-SUBMIT-6)
    │   │
    │   └── Failure (AC-4.4):
    │       ──► Close WebView
    │       ──► Show error: "Не вдалося передати на EPS..."
    │       ──► Offer "Retry" + "Open EPS manually"
    │
    ▼
[Terminal: Done or Error]
```

### 6.2. WebView Technical Design

| Property | Value |
|----------|-------|
| Plugin | `@capacitor/inappbrowser` or `@capacitor-community/inappbrowser` |
| Visibility | Hidden (off-screen or opacity 0) |
| URL | `https://eps.org.ua` |
| JS injection | Inject authentication + form fill scripts |
| Session | Cookie-based (OQ-4: session duration unknown) |
| Timeout | 30 seconds (NFR-2: <10 sec expected, 30 sec max) |

**JS injection sequence (AC-4.2):**
1. Navigate to eps.org.ua login page
2. Inject JS: fill username + password fields, submit login form
3. Wait for redirect to account page
4. Inject JS: navigate to meter reading submission page
5. Inject JS: fill meter number field + reading value field
6. Inject JS: submit form
7. Detect success/failure from DOM changes or URL redirect

**Error detection**: If page structure changes (Architecture Concern AC-1), the JS injection will fail to find expected DOM elements. The system must:
1. Catch JS execution errors
2. Fall back to E-EPS-FAIL state
3. Offer "Open EPS manually" link (AC-4.4)

### 6.3. EPS Manual Fallback

When EPS submission fails, the user can open eps.org.ua in the device browser:

```
┌──────────────────────────────────────┐
│  ❌                                   │
│                                      │
│  Не вдалося передати на EPS.         │
│  Перевірте підключення та            │
│  спробуйте ще раз.                   │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │  ↻  Повторити                     │ │  ← Primary button
│ └──────────────────────────────────┘ │
│                                      │
│  Відкрити EPS вручну →              │  ← Ghost link
│                                      │    Opens eps.org.ua in browser
└──────────────────────────────────────┘
```

**Implementation**: `@capacitor/browser` plugin's `openUrl()` or Android Intent.

---

## 7. Local Notification Design (US-9)

### 7.1. Notification Permission Flow (AC-14.7)

```
[App first launch]
    │
    ▼
┌──────────────────────────────────────┐
│  Android Notification Rationale       │
│                                      │
│  🔔 Нагадування                       │
│                                      │
│  Communal надсилає нагадування про   │
│  дедлайни подачі показників.         │
│  Нагадування приходять за 3 дні,    │
│  за 1 день та у день дедлайну о      │
│  09:00.                              │
│                                      │
│  [Пізніше]    [Дозволити]             │
└──────────────────────────────────────┘
    │
    ├── Allow ──► Schedule all notifications (AC-9.3)
    │
    └── Later ──► Notifications disabled
                   User can enable in Settings → Нагадування
```

**Rationale text (AC-14.7):**
- Title: "🔔 Нагадування"
- Body: "Communal надсилає нагадування про дедлайни подачі показників. Нагадування приходять за 3 дні, за 1 день та у день дедлайну о 09:00."
- Buttons: "Пізніше" (secondary), "Дозволити" (primary)

### 7.2. Notification Schedule (AC-9.3)

For each meter, schedule 3 notifications:

| Schedule | Timing | Content |
|----------|--------|---------|
| Early reminder | 3 days before deadline, 09:00 | "{serviceName} — передати показники до {date}" |
| Day-before reminder | 1 day before deadline, 09:00 | "{serviceName} — передати показники до {date}" |
| Day-of reminder | On deadline day, 09:00 | "{serviceName} — передати показники до {date}" |

**Notification content format (AC-9.4):**
- Title: `"{serviceName}"`
- Body: `"Передати показники до {date}"`
- Example: Title: "Електроенергія", Body: "Передати показники до 3 вересня"

**Notification channels (Android):**

| Channel ID | Name | Importance | Description |
|-----------|------|-----------|-------------|
| `reading_reminders` | Нагадування про показники | `HIGH` | Deadline reminders for meter readings |
| `payment_reminders` | Нагадування про оплату | `DEFAULT` | Bill payment reminders |
| `tariff_changes` | Зміна тарифів | `DEFAULT` | Tariff change notifications |
| `usage_anomalies` | Аномалії витрати | `HIGH` | Unusual usage detection alerts |

### 7.3. Notification Toggle Behavior (AC-9.5–9.7)

| Toggle | When ON | When OFF |
|--------|---------|----------|
| Нагадування про показники (AC-9.5) | Schedule all upcoming reading deadline notifications (AC-9.7) | Cancel all `reading_reminders` channel notifications (AC-9.6) |
| Нагадування про оплату | Schedule payment reminders | Cancel all `payment_reminders` notifications |
| Зміна тарифів | Enable tariff change alerts | Cancel all `tariff_changes` notifications |
| Аномалії витрати | Enable anomaly detection alerts | Cancel all `usage_anomalies` notifications |

**Implementation**: `@capacitor/local-notifications` plugin.

```typescript
// Schedule notifications for a meter
async function scheduleMeterReminders(meter: Meter) {
  const deadlines = calculateDeadlineDates(meter.submitDeadlineDay);

  for (const deadline of deadlines) {
    await LocalNotifications.schedule({
      notifications: [{
        id: generateId(),
        title: meter.serviceName,
        body: `Передати показники до ${formatDate(deadline.date)}`,
        schedule: { at: new Date(deadline.date.getTime() + 9 * 60 * 60 * 1000) }, // 09:00
        channelId: 'reading_reminders',
      }],
    });
  }
}

// Cancel by channel
async function cancelChannelNotifications(channelId: string) {
  const pending = await LocalNotifications.getPending();
  const toCancel = pending.notifications
    .filter(n => n.channelId === channelId)
    .map(n => ({ id: n.id }));
  await LocalNotifications.cancel({ notifications: toCancel });
}
```

### 7.4. Notification Visual Design

**Notification appearance on Android (lock screen + notification shade):**

```
┌──────────────────────────────────────┐
│  📊 Communal                    09:00 │
│                                      │
│  Електроенергія                      │
│  Передати показники до 3 вересня     │
│                                      │
│  [Передати зараз]  [Пізніше]          │
└──────────────────────────────────────┘
```

- Small icon: `BarChart3` silhouette in `colorPrimary` (white on colored background for Android 13+)
- App name: "Communal"
- Title: meter service name
- Body: "Передати показники до {date}"
- Action buttons (optional): "Передати зараз" (opens app to /submit), "Пізніше" (dismisses)

---

## 8. Responsive Behavior on Android

### 8.1. Android Phone (360px–428px)

All screens render identically to the mobile web design (375px baseline). The Capacitor WebView handles scaling.

**Density considerations:**
- Text sizes remain in CSS pixels (Tailwind units)
- Touch targets meet 48dp minimum (see §3.1)
- Safe areas respected via `env(safe-area-inset-*)`

**Viewport meta (layout.tsx):**
```typescript
export const viewport: Viewport = {
  themeColor: "#14b8a6", // primary-500, NOT #0891b2
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // enables safe-area-inset
};
```

### 8.2. Android Tablet (600px–1024px)

| Screen | Phone Layout | Tablet Layout |
|--------|-------------|---------------|
| Home | Single column | Single column, max-w-lg centered, bottom nav |
| Submit | Single column | Single column, max-w-lg centered |
| History | Single column | Single column, max-w-lg centered |
| Settings | Single column | Single column, max-w-lg centered |

**Note**: On tablet, the bottom navigation remains (Android convention). The content area is centered with `max-w-lg` (512px) to prevent excessive line lengths.

### 8.3. Orientation

| Orientation | Behavior |
|-------------|----------|
| Portrait | Default layout, all screens |
| Landscape | Content area constrained to max-w-md (448px), centered. Camera viewfinder adjusts aspect ratio. |

**Camera viewfinder in landscape**:
```
┌────────────────────────────────────────────────────┐
│  ← Назад                                            │
│  Фото лічильника • Електроенергія • №2400786276    │
│                                                    │
│ ┌──────────────────┐  ┌─────────────────────────┐  │
│ │                  │  │  Наведіть камеру на     │  │
│ │  Camera          │  │  дисплей лічильника.    │  │
│ │  Viewfinder      │  │  Цифри мають бути       │  │
│ │  (centered)      │  │  чітко видимими.        │  │
│ │                  │  │                          │  │
│ │                  │  │  [📸 Зробити фото]       │  │
│ └──────────────────┘  │                          │  │
│                       │  🔒 Фото на пристрої.    │  │
│                       └─────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

## 9. Android Theme Configuration

### 9.1. colors.xml (from DESIGN_SYSTEM.md §7)

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Primary (M3 colorPrimary) -->
    <color name="primary_50">#f0fdfa</color>
    <color name="primary_100">#ccfbf1</color>
    <color name="primary_200">#99f6e4</color>
    <color name="primary_300">#5eead4</color>
    <color name="primary_400">#2dd4bf</color>
    <color name="primary_500">#14b8a6</color>
    <color name="primary_600">#0d9488</color>
    <color name="primary_700">#0f766e</color>
    <color name="primary_800">#115e59</color>
    <color name="primary_900">#134e4a</color>

    <!-- Secondary (M3 colorSecondary) -->
    <color name="secondary_50">#fff7ed</color>
    <color name="secondary_100">#ffedd5</color>
    <color name="secondary_200">#fed7aa</color>
    <color name="secondary_300">#fdba74</color>
    <color name="secondary_400">#fb923c</color>
    <color name="secondary_500">#f97316</color>
    <color name="secondary_600">#ea580c</color>
    <color name="secondary_700">#c2410c</color>

    <!-- Utility -->
    <color name="water">#0ea5e9</color>
    <color name="water_light">#e0f2fe</color>
    <color name="electricity">#f59e0b</color>
    <color name="electricity_light">#fef3c7</color>
    <color name="gas">#f97316</color>
    <color name="gas_light">#ffedd5</color>
    <color name="heating">#ef4444</color>
    <color name="heating_light">#fee2e2</color>
    <color name="osbb">#64748b</color>
    <color name="osbb_light">#f1f5f9</color>

    <!-- Surfaces (M3 colorSurface, colorOnSurface) -->
    <color name="background">#fafaf9</color>
    <color name="surface">#ffffff</color>
    <color name="foreground">#1c1917</color>
    <color name="muted_foreground">#78716c</color>
    <color name="border">#e7e5e4</color>
    <color name="border_strong">#d6d3d1</color>

    <!-- Status (M3 colorError, custom success/warning) -->
    <color name="success">#16a34a</color>
    <color name="success_light">#dcfce7</color>
    <color name="warning">#f59e0b</color>
    <color name="warning_light">#fef3c7</color>
    <color name="danger">#dc2626</color>
    <color name="danger_light">#fee2e2</color>
    <color name="info">#0ea5e9</color>
    <color name="info_light">#e0f2fe</color>
</resources>
```

### 9.2. themes.xml

```xml
<resources>
    <style name="Theme.Communal" parent="Theme.Material3.Light.NoActionBar">
        <!-- Primary -->
        <item name="colorPrimary">@color/primary_500</item>
        <item name="colorOnPrimary">@android:color/white</item>
        <item name="colorPrimaryContainer">@color/primary_600</item>
        <item name="colorOnPrimaryContainer">@color/primary_50</item>

        <!-- Secondary -->
        <item name="colorSecondary">@color/secondary_500</item>
        <item name="colorOnSecondary">@android:color/white</item>
        <item name="colorSecondaryContainer">@color/secondary_100</item>
        <item name="colorOnSecondaryContainer">@color/secondary_700</item>

        <!-- Error -->
        <item name="colorError">@color/danger</item>
        <item name="colorOnError">@android:color/white</item>
        <item name="colorErrorContainer">@color/danger_light</item>

        <!-- Surfaces -->
        <item name="android:colorBackground">@color/background</item>
        <item name="colorSurface">@color/surface</item>
        <item name="colorOnSurface">@color/foreground</item>
        <item name="colorOnSurfaceVariant">@color/muted_foreground</item>
        <item name="colorOutline">@color/border</item>

        <!-- Status bar -->
        <item name="android:statusBarColor">@color/background</item>
        <item name="android:windowLightStatusBar">true</item>
    </style>
</resources>
```

### 9.3. AndroidManifest.xml Key Settings

```xml
<application
    android:name=".CommunalApplication"
    android:label="Communal"
    android:theme="@style/Theme.Communal"
    android:icon="@mipmap/ic_launcher"
    android:usesCleartextTraffic="false">

    <!-- Camera permission (AC-14.6) -->
    <uses-permission android:name="android.permission.CAMERA" />

    <!-- Notification permission (AC-14.7, Android 13+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Internet for EPS + DB -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

</application>
```

### 9.4. capacitor.config.ts

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jagm.communal',
  appName: 'Communal',
  webDir: 'out', // Next.js static export directory
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#14b8a6',
      sound: 'notification.wav',
    },
    Camera: {
      // No special config needed
    },
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
```

---

## 10. Android Typography

Use `Roboto` as the primary font on Android (native, no download needed) or `Inter` via downloadable fonts.

| M3 Type Role | Size | Weight | Line Height | Usage | Maps to CSS |
|-------------|------|--------|-------------|-------|-------------|
| DisplayMedium | 28sp | 700 | 36sp | Hero bill total | `text-4xl font-bold` (36px on web) |
| HeadlineMedium | 24sp | 700 | 32sp | Page titles | `text-2xl font-bold` |
| TitleLarge | 18sp | 600 | 24sp | Section headings | `text-lg font-semibold` |
| TitleMedium | 16sp | 600 | 24sp | Card titles | `text-base font-semibold` |
| BodyLarge | 15sp | 400 | 24sp | Body copy | `text-[15px]` |
| BodyMedium | 13sp | 400 | 20sp | Secondary labels | `text-[13px]` |
| LabelSmall | 11sp | 500 | 16sp | Captions, badges, nav | `text-[11px] font-medium` |
| LabelLarge | 15sp | 600 | 20sp | Button labels | `text-[15px] font-semibold` |

**Font family in CSS:**
```css
--font-sans: "Inter", "Roboto", system-ui, -apple-system, sans-serif;
```

On Android via Capacitor, `Roboto` is always available as a system font. `Inter` can be loaded via `next/font/google` (web) or Google Fonts downloadable font (native).

---

## 11. Android Component Equivalents

| Web Component | Android M3 Component | Key Differences |
|---------------|---------------------|-----------------|
| Hero card | `Card` with gradient bg | Same gradient, same radius (24dp) |
| Meter card (full) | `Card` (elevated) + `ListItem` | Elevated card, 16dp radius, 1dp border |
| Meter card (compact) | `ListItem` with leading icon | Dense list item, 12dp radius |
| Bottom nav + FAB | `NavigationBar` + centered `FloatingActionButton` | FAB is `ExtendedFloatingActionButton` variant |
| Primary button | `FilledButton` | `colorPrimary` bg, 48dp height, 12dp radius |
| Secondary button | `FilledTonalButton` | `colorSecondaryContainer` bg, 44dp height |
| Ghost button | `TextButton` | Transparent, 40dp height |
| Text input | `OutlinedTextField` | 48dp height, 12dp radius, focus ring |
| Toggle | `Switch` (M3) | 24dp height, 44dp width track |
| Alert (urgent) | `Card` with `colorErrorContainer` | 16dp radius, error icon |
| Alert (upcoming) | `Card` with `colorSurfaceVariant` | Muted style |
| Insight card | `Card` with icon + text | 12dp radius, colored icon container |
| Bar chart | Recharts (WebView) | Same rendering, WebView handles it |
| Badge | `AssistChip` or custom `Surface` | 9999px radius (pill) |
| Skeleton loading | `Shimmer` effect | Same CSS shimmer animation |
| Spinner | `CircularProgressIndicator` | M3 indeterminate spinner, `colorPrimary` |

---

## 12. Android-Specific States

### 12.1. Network Offline

```
┌──────────────────────────────────────┐
│  📡 Немає з'єднання                   │
│                                      │
│  Перевірте інтернет-з'єднання.       │
│  Дані подадуться автоматично,        │
│  коли з'єднання відновиться.         │
│                                      │
│  [Спробувати ще раз]                 │
└──────────────────────────────────────┘
```

- Display when `navigator.onLine === false`
- Show as banner at top of page (not full screen)
- Style: `bg-warning-light border-warning/20 text-warning`

### 12.2. Permission Denied (Camera)

After user denies camera permission and later tries to use OCR:

```
┌──────────────────────────────────────┐
│  ⚠️ Камера недоступна                 │
│                                      │
│  Дозвіл на камеру вимкнено.          │
│  Надайте дозвіл у налаштуваннях.     │
│                                      │
│  [Ввести вручну →]                   │
│  [Відкрити налаштування →]           │
└──────────────────────────────────────┘
```

"Відкрити налаштування" opens Android app settings via `@capacitor/app` plugin.

### 12.3. First Launch Onboarding (Recommended)

Not specified in PRD but recommended for UX:

```
┌──────────────────────────────────────┐
│                                      │
│         🏠 Communal                   │
│                                      │
│  Подавайте показники одним тапом.    │
│  Фото → OCR → EPS.                   │
│                                      │
│  [Почати →]                          │
│                                      │
│  🔒 Фото залишаються на пристрої.   │
└──────────────────────────────────────┘
```

After tapping "Почати":
1. Request notification permission (AC-14.7)
2. Navigate to Home

---

## 13. Android Accessibility

### 13.1. TalkBack Support

All interactive elements must have content descriptions:

| Element | contentDescription / aria-label |
|---------|--------------------------------|
| FAB | "Передати показники, відкрити камеру" |
| Meter card | "{serviceName}, лічильник номер {meterNumber}, останній показник {lastReading} {unit}, кнопка" |
| Capture button | "Зробити фото лічильника" |
| Toggle ON | "{label}, увімкнено" |
| Toggle OFF | "{label}, вимкнено" |
| Trend badge | "Тенденція {up/down} {percent} відсотків" |
| Chart | "Графік витрати за {N} місяців" |
| Urgent alert | "Терміново: {serviceName}, передати до {date}, залишилось {N} днів" |

### 13.2. Touch Exploration

- All interactive elements ≥48dp touch target
- Focus order: top-to-bottom, left-to-right
- Focus indicator: 2dp ring, `colorPrimary` (`#14b8a6`)

### 13.3. Font Scaling

Android font scaling (Settings → Display → Font size) must be respected. Use `sp` units (via CSS `rem` which maps to user font scale in WebView).

**Minimum readable size**: 11sp at 100% font scale = 11px CSS. At 130% font scale = ~14.3px. All text must remain readable at 130%.

---

## 14. PRD Traceability (Android-specific)

| AC ID | Addressed In | Notes |
|-------|-------------|-------|
| AC-9.3 | §7.2 | Notification schedule: 3 days, 1 day, day-of at 09:00 |
| AC-9.4 | §7.2 | Notification content format |
| AC-9.5 | §7.3 | Toggle types in Settings |
| AC-9.6 | §7.3 | Cancel on toggle OFF |
| AC-9.7 | §7.3 | Schedule on toggle ON |
| AC-14.1 | §9.4 | capacitor.config.ts |
| AC-14.2 | §9.4 | Static export, webDir: "out" |
| AC-14.3 | §9.4 | Capacitor HTTP plugin note |
| AC-14.4 | §4.1, §8 | Safe-area-inset CSS |
| AC-14.5 | §4.1 | Bottom nav + system nav bar separation |
| AC-14.6 | §5.1 | Camera permission rationale |
| AC-14.7 | §7.1 | Notification permission rationale |
| AC-15.1 | §5.3 | ML Kit Text Recognition v2 |
| AC-15.2 | §5.3 | Numeric value + confidence output |
| AC-15.3 | §5.3, §5.4 | On-device only, no server upload |
| AC-15.4 | §5.3 | Fallback to manual input |
| AC-15.5 | §5.3 | Store ocrEngine + confidence |

---

## Provenance

| Джерело | Тип | Дата доступу |
|---------|-----|-------------|
| `F:\communal\wiki\products\communal\prd\2026-08-22-communal-prd.md` | PRD | 2026-08-22 |
| `F:\communal\DESIGN_SYSTEM.md` | Design System | 2026-08-22 |
| `F:\communal\wiki\products\communal\design\2026-08-22-communal-design-spec.md` | Design Spec | 2026-08-22 |
| `F:\communal\src\app\layout.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\submit\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\components\BottomNav.tsx` | Code | 2026-08-22 |
| Material Design 3 Guidelines | Reference | 2026-08-22 |
| Capacitor Documentation | Reference | 2026-08-22 |
