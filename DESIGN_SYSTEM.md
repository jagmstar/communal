# Communal — Design System

## 1. Design Concept & Theme

**Theme: "Тепло домівки" / "Home Warmth"**

The visual metaphor for Communal is a **digital receipt from a trusted, modern home**. The interface should feel like opening a well-organized household folder on a bright kitchen table — calm, orderly, and reassuring. We use a warm, grounded palette inspired by Ukrainian interiors: soft cream walls, terracotta accents, gentle greens of houseplants, and the warm amber of evening light. This is not a bank app and not a generic SaaS dashboard; it is a personal tool for real families managing real money.

Users should feel **in control, not anxious**. Utility bills are stressful by nature, so the design must reduce cognitive load through generous whitespace, clear hierarchy, and predictable patterns. Every element should signal: "We have done the math for you, the deadlines are visible, and nothing is hidden." For Ukrainian users specifically, the app must feel local and respectful — Cyrillic-first typography, hryvnia formatting, date patterns that match Ukrainian conventions, and a color personality that avoids cold institutional blues in favor of warmer, more human tones.

## 2. Color Palette

### Primary — Warm Teal / Home Green
A distinctive teal-green that feels fresh, trustworthy, and domestic without being corporate blue.

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary-50` | `#f0fdfa` | Very light tints, hover backgrounds |
| `--primary-100` | `#ccfbf1` | Light accents, soft fills |
| `--primary-200` | `#99f6e4` | Decorative backgrounds |
| `--primary-300` | `#5eead4` | Highlights, focus rings |
| `--primary-400` | `#2dd4bf` | Interactive hover states |
| `--primary-500` | `#14b8a6` | **Primary base** — buttons, active nav |
| `--primary-600` | `#0d9488` | Primary hover / pressed |
| `--primary-700` | `#0f766e` | Strong emphasis text |
| `--primary-800` | `#115e59` | Headings on primary backgrounds |
| `--primary-900` | `#134e4a` | Deep accents |

### Secondary Accent — Warm Terracotta / Clay
Used for calls-to-action, urgent but friendly emphasis, and warmth.

| Token | Hex | Usage |
|-------|-----|-------|
| `--secondary-50` | `#fff7ed` | Light backgrounds |
| `--secondary-100` | `#ffedd5` | Soft fills |
| `--secondary-200` | `#fed7aa` | Hover backgrounds |
| `--secondary-300` | `#fdba74` | Decorative |
| `--secondary-400` | `#fb923c` | Highlights |
| `--secondary-500` | `#f97316` | **Secondary base** — CTA accents |
| `--secondary-600` | `#ea580c` | Hover / pressed |
| `--secondary-700` | `#c2410c` | Emphasis text |

### Utility Type Colors
Each utility must be instantly recognizable. Avoid pure primary blue for water; use a deeper, more sophisticated cyan-teal.

| Utility | Base Hex | Light Hex | Dark Text | Usage |
|---------|----------|-----------|-----------|-------|
| **Water** | `#0ea5e9` | `#e0f2fe` | `#075985` | Icons, badges, chart bars for water |
| **Electricity** | `#f59e0b` | `#fef3c7` | `#92400e` | Icons, badges, chart bars for electricity |
| **Gas** | `#f97316` | `#ffedd5` | `#9a3412` | Icons, badges, chart bars for gas |
| **Heating** | `#ef4444` | `#fee2e2` | `#991b1b` | Icons, badges, chart bars for heating |
| **OSBB / Other** | `#64748b` | `#f1f5f9` | `#334155` | Neutral service fallback |

### Backgrounds, Surfaces, Text, Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#fafaf9` | App canvas (warm off-white) |
| `--surface` | `#ffffff` | Cards, sheets, modals |
| `--surface-elevated` | `#ffffff` | Elevated cards with shadow |
| `--foreground` | `#1c1917` | Primary text (warm near-black) |
| `--muted-foreground` | `#78716c` | Secondary text, placeholders |
| `--disabled` | `#d6d3d1` | Disabled text / icons |
| `--border` | `#e7e5e4` | Subtle borders, dividers |
| `--border-strong` | `#d6d3d1` | Stronger borders for inputs |
| `--ring` | `#14b8a6` | Focus rings |

### Status Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#16a34a` | Positive change, paid, confirmed |
| `--success-light` | `#dcfce7` | Success backgrounds |
| `--warning` | `#f59e0b` | Attention, approaching deadline |
| `--warning-light` | `#fef3c7` | Warning backgrounds |
| `--danger` | `#dc2626` | Critical deadline, error, overdue |
| `--danger-light` | `#fee2e2` | Danger backgrounds |
| `--info` | `#0ea5e9` | Informational tips |
| `--info-light` | `#e0f2fe` | Info backgrounds |

### Gradients

```css
/* Primary hero gradient — used on main bill card */
--gradient-primary: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);

/* Secondary CTA gradient — used on floating action / submit */
--gradient-secondary: linear-gradient(135deg, #f97316 0%, #ea580c 100%);

/* Soft surface gradient — used on insight cards or empty states */
--gradient-soft: linear-gradient(180deg, #ffffff 0%, #fafaf9 100%);

/* Warm glow behind hero */
--gradient-warm-glow: radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.08) 0%, transparent 40%);
```

## 3. Typography

### Font Recommendations with Cyrillic Support

**Primary font: Inter**
- Excellent Cyrillic support, modern, highly legible on mobile.
- Use weights 400, 500, 600, 700.
- Fallback stack: `"Inter", "Roboto", "Open Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

**Alternative / local-first option: Roboto**
- Native on Android, strong Cyrillic coverage, pairs cleanly with Material Design 3.

**Monospace (for meter readings / numbers): IBM Plex Mono or SF Mono**
- Use for numeric values to improve tabular alignment.
- Fallback: `"IBM Plex Mono", "Roboto Mono", ui-monospace, monospace`.

### Type Scale (mobile-first, base 16px)

| Token | Size | Line Height | Letter Spacing | Weight | Usage |
|-------|------|-------------|----------------|--------|-------|
| `--text-display` | 2.25rem (36px) | 2.5rem | -0.02em | 700 | Hero bill total |
| `--text-h1` | 1.5rem (24px) | 2rem | -0.01em | 700 | Page titles |
| `--text-h2` | 1.125rem (18px) | 1.5rem | 0 | 600 | Section headings |
| `--text-h3` | 1rem (16px) | 1.5rem | 0 | 600 | Card titles |
| `--text-body` | 0.9375rem (15px) | 1.5rem | 0 | 400 | Body copy |
| `--text-small` | 0.8125rem (13px) | 1.25rem | 0 | 400 | Secondary labels |
| `--text-xs` | 0.6875rem (11px) | 1rem | 0.01em | 500 | Captions, badges |
| `--text-button` | 0.9375rem (15px) | 1.25rem | 0 | 600 | Button labels |

### Weights
- **400** Regular: body, descriptions.
- **500** Medium: labels, small text.
- **600** Semibold: section titles, card titles, buttons.
- **700** Bold: hero numbers, page titles, totals.

## 4. Spacing & Layout

### 4pt Grid System
All spacing values are multiples of 4px.

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |

### Border Radius Conventions

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Small buttons, badges, input fields |
| `--radius-md` | 12px | Cards, list items, medium buttons |
| `--radius-lg` | 16px | Large cards, modals, bottom sheets |
| `--radius-xl` | 24px | Hero card, primary CTA button |
| `--radius-full` | 9999px | Pills, avatars, floating action button |

### Shadows / Elevation

```css
/* Resting card shadow */
--shadow-sm: 0 1px 2px rgba(28, 25, 23, 0.05);

/* Default card shadow */
--shadow-md: 0 4px 6px -1px rgba(28, 25, 23, 0.06), 0 2px 4px -1px rgba(28, 25, 23, 0.04);

/* Elevated cards / FAB */
--shadow-lg: 0 10px 15px -3px rgba(28, 25, 23, 0.08), 0 4px 6px -2px rgba(28, 25, 23, 0.03);

/* Bottom nav / modal */
--shadow-xl: 0 -4px 20px rgba(28, 25, 23, 0.08);
```

### Safe Areas for Mobile

```css
/* Bottom nav must respect safe area insets */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Page content must clear bottom nav + safe area */
.page-container {
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}

/* Top safe area for notched devices */
.pt-safe {
  padding-top: env(safe-area-inset-top, 0px);
}
```

## 5. Component Library

### Cards

#### Bill Hero Card
The most important surface. Must feel premium and trustworthy.

```jsx
<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 p-5 text-white shadow-lg shadow-primary-500/20">
  {/* Decorative soft circles */}
  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
  <div className="absolute -right-12 -bottom-8 h-32 w-32 rounded-full bg-white/5" />

  <div className="relative">
    <p className="text-sm font-medium text-primary-50">Прогноз рахунку за серпень</p>
    <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">2 398,52 ₴</p>
    <div className="mt-3 flex items-center gap-3 text-xs text-primary-100">
      <span>4 лічильники</span>
      <span>•</span>
      <span>Оновлено сьогодні</span>
    </div>
  </div>
</div>
```

#### Insight Card
Light, readable, with a colored icon container.

```jsx
<div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm">
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-light text-warning">
    <Icon className="h-5 w-5" />
  </div>
  <div className="min-w-0 flex-1">
    <p className="text-sm font-semibold text-foreground">Зеконом ₴340/рік</p>
    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
      Перенеси 20% електро на нічний тариф...
    </p>
  </div>
</div>
```

#### Alert Card

- **Urgent**: `bg-danger-light border-danger/20 text-danger` with `AlertCircle` icon.
- **Warning**: `bg-warning-light border-warning/20 text-warning` with `AlertTriangle` icon.
- **Info**: `bg-info-light border-info/20 text-info` with `Info` icon.
- **Success**: `bg-success-light border-success/20 text-success` with `CheckCircle` icon.

### Buttons

#### Primary Button
```jsx
<button className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary-500 px-6 text-base font-semibold text-white shadow-md shadow-primary-500/20 transition-colors hover:bg-primary-600 active:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:bg-disabled disabled:text-disabled-foreground">
  Передати показники
</button>
```

#### Secondary Button
```jsx
<button className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary-100 px-4 text-sm font-semibold text-secondary-700 hover:bg-secondary-200 active:bg-secondary-300">
  Детальніше
</button>
```

#### Ghost Button
```jsx
<button className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground hover:bg-muted active:bg-muted/80">
  <Icon className="h-4 w-4" />
  Скасувати
</button>
```

#### Icon Button
```jsx
<button className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-foreground shadow-sm hover:bg-muted active:scale-95">
  <Icon className="h-5 w-5" />
</button>
```

#### Floating Action Button (FAB)
```jsx
<Link href="/submit" className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-secondary-500 to-secondary-600 text-white shadow-lg shadow-secondary-500/30 transition-transform active:scale-95">
  <Camera className="h-6 w-6" strokeWidth={2.5} />
</Link>
```

### Inputs and Form Elements

#### Text Input
```jsx
<div className="space-y-1.5">
  <label className="text-sm font-medium text-foreground">Показник лічильника</label>
  <input
    type="number"
    inputMode="decimal"
    className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
    placeholder="Наприклад, 12453"
  />
  <p className="text-xs text-muted-foreground">Останній показник: 12 453 кВт·год</p>
</div>
```

#### Meter Reading Card (Selectable)
```jsx
<button className="flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-surface p-4 text-left transition-colors hover:border-primary-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 data-[selected=true]:border-primary-500 data-[selected=true]:bg-primary-50">
  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-water-light text-water">
    <Droplet className="h-6 w-6" />
  </div>
  <div className="min-w-0 flex-1">
    <p className="font-semibold text-foreground">Вода (гаряча)</p>
    <p className="text-xs text-muted-foreground">Лічильник №14091126</p>
  </div>
  <ChevronRight className="h-5 w-5 text-muted-foreground" />
</button>
```

### Bottom Navigation

```jsx
<nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/90 backdrop-blur-lg shadow-xl">
  <div className="mx-auto flex max-w-md items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
    {/* Regular tab */}
    <Link href="/" className="flex flex-col items-center gap-1 px-3 py-2 text-primary-600">
      <Home className="h-5 w-5" strokeWidth={2} />
      <span className="text-[11px] font-medium">Головна</span>
    </Link>

    {/* Center FAB tab */}
    <Link href="/submit" className="flex flex-col items-center gap-1">
      <div className="flex h-14 w-14 -mt-6 items-center justify-center rounded-full bg-gradient-to-br from-secondary-500 to-secondary-600 text-white shadow-lg shadow-secondary-500/30">
        <Camera className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <span className="text-[11px] font-medium text-secondary-600">Передати</span>
    </Link>

    {/* Regular tabs */}
    <Link href="/history" className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground">
      <BarChart3 className="h-5 w-5" strokeWidth={2} />
      <span className="text-[11px] font-medium">Історія</span>
    </Link>
    <Link href="/settings" className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground">
      <Settings className="h-5 w-5" strokeWidth={2} />
      <span className="text-[11px] font-medium">Налаштування</span>
    </Link>
  </div>
</nav>
```

### Meter Reading Cards
See "Meter Reading Card (Selectable)" above. Full version includes a footer row:

```jsx
<div className="border-t border-border bg-muted/30 px-4 py-3">
  <div className="flex items-end justify-between">
    <div>
      <p className="text-xs text-muted-foreground">Останній показник</p>
      <p className="text-lg font-bold tabular-nums text-foreground">
        182.34 <span className="text-sm font-normal text-muted-foreground">м³</span>
      </p>
    </div>
    <div className="text-right">
      <p className="text-xs text-muted-foreground">Передати до</p>
      <p className="text-sm font-medium text-foreground">31 числа</p>
    </div>
  </div>
</div>
```

### Alert / Notification Banners

```jsx
{/* Urgent deadline banner */}
<div className="flex items-center gap-3 rounded-2xl border border-danger/15 bg-danger-light p-3">
  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger/10">
    <AlertCircle className="h-5 w-5 text-danger" />
  </div>
  <div className="flex-1">
    <p className="text-sm font-semibold text-danger-foreground">Газ — передати до 5 серпня</p>
    <p className="text-xs text-danger/80">Залишилось 4 дні</p>
  </div>
</div>
```

### Charts

Use Recharts on web. Bars use the utility color with subtle opacity gradients.

```jsx
<Bar dataKey="usage" radius={[6, 6, 0, 0]}>
  {data.map((_, index) => (
    <Cell
      key={index}
      fill={utilityColor}
      fillOpacity={0.3 + (index / data.length) * 0.7}
    />
  ))}
</Bar>
```

- Axis text: `--muted-foreground`, 11px.
- Grid lines: none or `--border` at 0.5 opacity.
- Tooltip: `--surface` background, `--border` border, 12px radius, 12px font size.

## 6. Bill Type Visual Language

Each utility must be distinguishable by **color, icon, and subtle background pattern**.

### Water
- **Color**: `#0ea5e9` (deep sky blue, not generic corporate blue)
- **Icon**: `Droplet` (filled or outline)
- **Pattern**: soft horizontal wave lines in background
- **Light surface**: `#e0f2fe`
- **Text on light**: `#075985`

### Electricity
- **Color**: `#f59e0b` (warm amber)
- **Icon**: `Zap` / lightning bolt
- **Pattern**: small dot grid or zig-zag energy line
- **Light surface**: `#fef3c7`
- **Text on light**: `#92400e`

### Gas
- **Color**: `#f97316` (terracotta orange)
- **Icon**: `Flame`
- **Pattern**: soft radial glow / flame shape
- **Light surface**: `#ffedd5`
- **Text on light**: `#9a3412`

### Heating
- **Color**: `#ef4444` (warm red)
- **Icon**: `Thermometer` or `Radiator` (use `Flame` if no radiator icon available)
- **Pattern**: vertical radiator lines
- **Light surface**: `#fee2e2`
- **Text on light**: `#991b1b`

### OSBB / Building
- **Color**: `#64748b` (slate)
- **Icon**: `Building`
- **Light surface**: `#f1f5f9`
- **Text on light**: `#334155`

### Icon Container Rules
- Always place utility icon inside a rounded square (`rounded-xl`, 12px radius).
- Container size: 48x48px on full cards, 40x40px on compact rows.
- Container fill: the utility's `--*-light` color.
- Icon color: the utility base color.
- Stroke width: 2px.

## 7. Android App Mapping

### Material Design 3 Translation

| Web Token | Material 3 Token | Notes |
|-----------|------------------|-------|
| `--primary-500` | `colorPrimary` | Teal primary |
| `--primary-600` | `colorPrimaryContainer` | Container variant |
| `--primary-50` | `colorOnPrimaryContainer` text bg | Lightest primary |
| `--secondary-500` | `colorSecondary` | Terracotta accent |
| `--background` | `colorSurface` / window background | `#fafaf9` |
| `--surface` | `colorSurface` | Cards |
| `--surface-elevated` | `colorSurfaceContainerHigh` | Elevated surfaces |
| `--foreground` | `colorOnSurface` | Primary text |
| `--muted-foreground` | `colorOnSurfaceVariant` | Secondary text |
| `--border` | `colorOutline` | Outlines |
| `--danger` | `colorError` | Error |
| `--success` | Custom `colorCustomSuccess` | Extend theme |

### colors.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Primary -->
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

    <!-- Secondary -->
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

    <!-- Surfaces -->
    <color name="background">#fafaf9</color>
    <color name="surface">#ffffff</color>
    <color name="foreground">#1c1917</color>
    <color name="muted_foreground">#78716c</color>
    <color name="border">#e7e5e4</color>
    <color name="border_strong">#d6d3d1</color>

    <!-- Status -->
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

### Component Equivalents

| Web Component | Android Equivalent |
|---------------|--------------------|
| Hero card | `Card` with custom gradient background |
| Meter card | `Card` (elevated) with `ListItem` inside |
| Bottom nav + FAB | `NavigationBar` + centered `FloatingActionButton` |
| Primary button | `FilledButton` with `colorPrimary` |
| Secondary button | `FilledTonalButton` with `colorSecondaryContainer` |
| Input | `OutlinedTextField` |
| Alert banner | `Snackbar` or custom `Card` with `colorErrorContainer` |
| Insight card | `Card` with `Row` + `Icon` + `Column` |
| Chart | MPAndroidChart or Compose `Canvas` bar chart |

### Android Typography
Use `Roboto` or `Inter` via downloadable font. Scale matches web type scale using Material 3 `display`, `headline`, `title`, `body`, `label` roles.

## 8. Implementation Notes

### Tailwind CSS Classes for Key Elements

| Element | Classes |
|---------|---------|
| Page container | `min-h-screen bg-background px-4 pt-12 pb-[calc(80px+env(safe-area-inset-bottom))]` |
| Section title | `text-lg font-semibold text-foreground` |
| Card | `rounded-2xl border border-border bg-surface p-4 shadow-sm` |
| Hero card | `relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 p-5 text-white shadow-lg shadow-primary-500/20` |
| Primary button | `h-12 w-full rounded-xl bg-primary-500 px-6 text-base font-semibold text-white shadow-md hover:bg-primary-600 active:bg-primary-700` |
| Secondary button | `h-11 rounded-xl bg-secondary-100 px-4 text-sm font-semibold text-secondary-700 hover:bg-secondary-200` |
| Ghost button | `h-10 rounded-lg px-3 text-sm font-medium text-foreground hover:bg-muted` |
| Input | `h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:ring-4 focus:ring-primary-100` |
| Utility icon container | `flex h-12 w-12 items-center justify-center rounded-xl bg-water-light text-water` |
| Bottom nav | `fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/90 backdrop-blur-lg shadow-xl` |
| FAB | `flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-secondary-500 to-secondary-600 text-white shadow-lg shadow-secondary-500/30` |

### CSS Variables Structure

Replace the contents of `F:\communal\src\app\globals.css` with the following structure:

```css
@import "tailwindcss";

:root {
  /* Primary — Warm Teal */
  --primary-50: #f0fdfa;
  --primary-100: #ccfbf1;
  --primary-200: #99f6e4;
  --primary-300: #5eead4;
  --primary-400: #2dd4bf;
  --primary-500: #14b8a6;
  --primary-600: #0d9488;
  --primary-700: #0f766e;
  --primary-800: #115e59;
  --primary-900: #134e4a;

  /* Secondary — Terracotta */
  --secondary-50: #fff7ed;
  --secondary-100: #ffedd5;
  --secondary-200: #fed7aa;
  --secondary-300: #fdba74;
  --secondary-400: #fb923c;
  --secondary-500: #f97316;
  --secondary-600: #ea580c;
  --secondary-700: #c2410c;

  /* Utility colors */
  --water: #0ea5e9;
  --water-light: #e0f2fe;
  --water-dark: #075985;
  --electricity: #f59e0b;
  --electricity-light: #fef3c7;
  --electricity-dark: #92400e;
  --gas: #f97316;
  --gas-light: #ffedd5;
  --gas-dark: #9a3412;
  --heating: #ef4444;
  --heating-light: #fee2e2;
  --heating-dark: #991b1b;
  --osbb: #64748b;
  --osbb-light: #f1f5f9;
  --osbb-dark: #334155;

  /* Surfaces */
  --background: #fafaf9;
  --surface: #ffffff;
  --surface-elevated: #ffffff;
  --foreground: #1c1917;
  --muted-foreground: #78716c;
  --disabled: #d6d3d1;
  --border: #e7e5e4;
  --border-strong: #d6d3d1;

  /* Status */
  --success: #16a34a;
  --success-light: #dcfce7;
  --warning: #f59e0b;
  --warning-light: #fef3c7;
  --danger: #dc2626;
  --danger-light: #fee2e2;
  --info: #0ea5e9;
  --info-light: #e0f2fe;

  /* Primary/secondary semantic aliases for Tailwind v4 theme */
  --primary: var(--primary-500);
  --primary-foreground: #ffffff;
  --secondary: var(--secondary-500);
  --secondary-foreground: #ffffff;
  --accent: var(--primary-100);
  --accent-foreground: var(--primary-700);
  --card: var(--surface);
  --card-foreground: var(--foreground);
  --muted: #f5f5f4;
  --ring: var(--primary-300);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-border: var(--border);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-primary-50: var(--primary-50);
  --color-primary-100: var(--primary-100);
  --color-primary-200: var(--primary-200);
  --color-primary-300: var(--primary-300);
  --color-primary-400: var(--primary-400);
  --color-primary-500: var(--primary-500);
  --color-primary-600: var(--primary-600);
  --color-primary-700: var(--primary-700);
  --color-primary-800: var(--primary-800);
  --color-primary-900: var(--primary-900);

  --color-secondary-50: var(--secondary-50);
  --color-secondary-100: var(--secondary-100);
  --color-secondary-200: var(--secondary-200);
  --color-secondary-300: var(--secondary-300);
  --color-secondary-400: var(--secondary-400);
  --color-secondary-500: var(--secondary-500);
  --color-secondary-600: var(--secondary-600);
  --color-secondary-700: var(--secondary-700);

  --color-water: var(--water);
  --color-water-light: var(--water-light);
  --color-water-dark: var(--water-dark);
  --color-electricity: var(--electricity);
  --color-electricity-light: var(--electricity-light);
  --color-electricity-dark: var(--electricity-dark);
  --color-gas: var(--gas);
  --color-gas-light: var(--gas-light);
  --color-gas-dark: var(--gas-dark);
  --color-heating: var(--heating);
  --color-heating-light: var(--heating-light);
  --color-heating-dark: var(--heating-dark);
  --color-osbb: var(--osbb);
  --color-osbb-light: var(--osbb-light);
  --color-osbb-dark: var(--osbb-dark);

  --color-success: var(--success);
  --color-success-light: var(--success-light);
  --color-warning: var(--warning);
  --color-warning-light: var(--warning-light);
  --color-danger: var(--danger);
  --color-danger-light: var(--danger-light);
  --color-info: var(--info);
  --color-info-light: var(--info-light);

  --font-sans: var(--font-inter), system-ui, -apple-system, sans-serif;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--muted-foreground);
}

/* Animations */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}
.animate-slide-up {
  animation: slide-up 0.5s ease-out;
}
.animate-pulse-soft {
  animation: pulse-soft 2s ease-in-out infinite;
}

/* Glass effect */
.glass {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Card hover */
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(28, 25, 23, 0.06);
}
.card-hover:active {
  transform: translateY(0);
}

/* Shimmer loading */
.shimmer {
  background: linear-gradient(90deg, var(--muted) 25%, var(--border) 50%, var(--muted) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Specific Changes to `F:\communal\src\app\globals.css`

1. **Replace the entire `:root` block** with the new CSS variables above.
2. **Update `@theme inline`** to expose the full primary/secondary scale and all utility/status colors to Tailwind v4.
3. **Change body background** from `#f8fafc` to `#fafaf9` (warm off-white).
4. **Remove or replace the `.gradient-text` utility** — do not use a blue gradient text; instead use `--foreground` or `--primary-700` for emphasis.
5. **Update `.card-hover:hover` shadow** to use warm stone tint `rgba(28, 25, 23, 0.06)` instead of blue-tinted shadow.
6. **Add `heating` colors** to support future heating meters.
7. **Add `--color-*` mappings** for every new semantic color so Tailwind classes like `bg-water-light`, `text-gas`, `bg-danger-light` work.

## 9. Design Verification Checklist

### Contrast & Accessibility (WCAG AA)
- [ ] Hero card white text on `--primary-500` / `--primary-600` gradient passes 4.5:1.
- [ ] All body text (`--foreground` on `--background` / `--surface`) passes 4.5:1.
- [ ] Utility light surfaces (`--water-light`, `--gas-light`, etc.) with their dark text pass 4.5:1.
- [ ] Danger text on `--danger-light` passes 4.5:1.
- [ ] Warning text on `--warning-light` passes 4.5:1.
- [ ] All interactive elements have a visible focus state (`focus:ring-4 focus:ring-primary-100`).
- [ ] Touch targets are at least 44x44px (buttons, nav items, meter cards).
- [ ] Color is not the only way to distinguish utility types — icons and labels always present.

### Visual Cohesion
- [ ] No pure `#0000ff` or default Tailwind blue appears as a brand color.
- [ ] Primary teal and secondary terracotta are used consistently across web and Android.
- [ ] All cards use the same border radius scale (`rounded-2xl` or `rounded-3xl`).
- [ ] All shadows use the warm stone tint, not blue/purple tints.
- [ ] Bottom nav uses safe-area insets and does not overlap content.

### Screenshots to Take
1. **Home dashboard** at 375px width (iPhone SE / small Android).
2. **Home dashboard** at 428px width (large phone).
3. **Meter detail / submit reading** screen.
4. **History chart** screen.
5. **Settings** screen.
6. **Bottom nav active / pressed states**.
7. **Keyboard open** on an input field to verify no overlap.

### Functional Verification
- [ ] Tab through the page with keyboard; every interactive element is reachable.
- [ ] Screen reader can announce bill total, deadlines, and meter readings clearly.
- [ ] Numbers use Ukrainian locale formatting (`2 398,52 ₴`, not `2,398.52 UAH`).
- [ ] Dates render in Ukrainian (`п'ятниця, 21 серпня`).
- [ ] No dark mode artifacts (no `dark:` classes, no system dark mode switching).

### Cross-Platform Check
- [ ] Android colors.xml matches web CSS variables exactly.
- [ ] Android component equivalents use the same radius and elevation values.
- [ ] Android typography uses the same weights and scale.

### Designer Review Gate
- [ ] A non-developer (or the designer who wrote this system) reviews the screenshots and signs off.
- [ ] No one says "it looks fine" without checking contrast, alignment, and type scale against this document.
