# Communal — Developer Handoff

| Поле | Значення |
|------|----------|
| **Документ** | Developer Handoff |
| **Продукт** | Communal |
| **Автор** | Senior UI/UX Designer (JAGM-TWIN-146) |
| **Дата** | 2026-08-22 |
| **Статус** | Ready for Implementation |
| **Версія** | 1.0 |
| **PRD** | [2026-08-22-communal-prd.md](../prd/2026-08-22-communal-prd.md) |
| **Design System** | [DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md) |
| **Design Spec** | [2026-08-22-communal-design-spec.md](2026-08-22-communal-design-spec.md) |
| **Android Spec** | [2026-08-22-communal-android-spec.md](2026-08-22-communal-android-spec.md) |

---

## 1. Critical Fix: Color Token Alignment (AC-7, Architecture Concern AC-7)

### 1.1. Problem

The current codebase uses `blue-500`/`blue-600` (Tailwind default blue) and `cyan-500` throughout. The DESIGN_SYSTEM.md mandates `primary-500` (#14b8a6 teal) and `secondary-500` (#f97316 terracotta). Every blue reference must be replaced.

### 1.2. Complete Replacement Map

#### `src/app/page.tsx`

| Current Class | Replacement Class | Context |
|---------------|-------------------|---------|
| `from-blue-600 to-blue-500` | `from-primary-500 to-primary-600` | Hero card gradient |
| `shadow-blue-500/20` | `shadow-primary-500/20` | Hero card shadow |
| `text-blue-100` | `text-white/80` | Hero card meta text (improved contrast) |
| `text-blue-50` | `text-primary-50` | Hero card label |
| `text-blue-600` (Sparkles icon) | `text-primary-100` | Sparkles icon in hero |
| `bg-orange-100` | `bg-secondary-100` | Urgent count badge bg |
| `text-orange-700` | `text-secondary-700` | Urgent count badge text |
| `text-orange-500` (AlertTriangle) | `text-secondary-500` | AlertTriangle icon |
| `border-blue-200 bg-blue-50` | `border-primary-200 bg-primary-50` | Quick action card |
| `from-blue-600 to-blue-500` (quick action) | `from-primary-500 to-primary-600` | Quick action icon container |
| `text-blue-600` (ArrowRight) | `text-primary-600` | ArrowRight in quick action |

#### `src/app/submit/page.tsx`

| Current Class | Replacement Class | Context |
|---------------|-------------------|---------|
| `from-blue-600 to-blue-500` (camera icon) | `from-primary-500 to-primary-600` | Camera placeholder icon |
| `shadow-blue-500/20` | `shadow-primary-500/20` | Camera placeholder shadow |
| `border-blue-400` (scanning frame) | `border-primary-300` | Scanning frame border |
| `from-blue-600 to-blue-500` (capture btn) | `from-secondary-500 to-secondary-600` | Capture button (use secondary for CTA) |
| `shadow-blue-500/20` (capture btn) | `shadow-secondary-500/30` | Capture button shadow |
| `from-cyan-500 to-teal-600` (EPS btn) | `from-primary-500 to-primary-600` | EPS submit button |
| `shadow-cyan-500/20` (EPS btn) | `shadow-primary-500/20` | EPS submit button shadow |
| `from-green-400 to-emerald-600` (success) | `from-success to-success` (or keep green) | Success checkmark circle |
| `shadow-green-500/20` | `shadow-success/20` | Success shadow |
| `border-red-200 bg-red-50` (warning) | `border-danger/20 bg-danger-light` | Monotonicity warning |
| `text-red-500` (AlertCircle) | `text-danger` | AlertCircle icon |
| `text-red-700` (warning text) | `text-danger` | Warning text |
| `bg-green-100` (confidence badge) | `bg-success-light` | Confidence badge bg |
| `text-green-600` (Check icon) | `text-success` | Check icon in badge |
| `text-green-700` (confidence text) | `text-success` | Confidence text |
| `dark:bg-green-900/30` | (remove) | Dark mode — not supported |
| `dark:bg-red-900 dark:bg-red-950/30` | (remove) | Dark mode — not supported |
| `dark:text-red-300` | (remove) | Dark mode — not supported |
| `dark:bg-green-900/30` | (remove) | Dark mode — not supported |
| `dark:text-green-400` | (remove) | Dark mode — not supported |
| `dark:text-green-300` | (remove) | Dark mode — not supported |

#### `src/app/history/page.tsx`

| Current Class | Replacement Class | Context |
|---------------|-------------------|---------|
| `bg-orange-100 text-orange-700` (trend up) | `bg-secondary-100 text-secondary-700` | Trend up badge |
| `dark:bg-orange-900/30 dark:text-orange-300` | (remove) | Dark mode |
| `bg-green-100 text-green-700` (trend down) | `bg-success-light text-success` | Trend down badge |
| `dark:bg-green-900/30 dark:text-green-300` | (remove) | Dark mode |

#### `src/app/settings/page.tsx`

| Current Class | Replacement Class | Context |
|---------------|-------------------|---------|
| `from-cyan-500 to-teal-600` (avatar) | `from-primary-500 to-primary-600` | Profile avatar gradient |
| `bg-cyan-100` (EPS icon bg) | `bg-primary-100` | EPS icon container |
| `dark:bg-cyan-900/30` | (remove) | Dark mode |
| `text-cyan-600` (EPS icon) | `text-primary-600` | EPS icon color |
| `dark:text-cyan-400` | (remove) | Dark mode |
| `bg-green-100` (Підключено badge) | `bg-success-light` | Connected badge bg |
| `text-green-700` (badge text) | `text-success` | Connected badge text |
| `dark:bg-green-900/30 dark:text-green-300` | (remove) | Dark mode |
| `text-green-500` (Shield icon) | `text-success` | Privacy shield icon |

#### `src/components/BottomNav.tsx`

| Current Class | Replacement Class | Context |
|---------------|-------------------|---------|
| `from-blue-600 to-blue-500` (FAB) | `from-secondary-500 to-secondary-600` | FAB gradient |
| `shadow-blue-500/30` (FAB) | `shadow-secondary-500/30` | FAB shadow |
| `text-primary` (FAB label) | `text-secondary-600` | FAB label (should be secondary, not primary) |
| `bg-card/80` (nav bg) | `bg-surface/90` | Nav background (use surface token) |

#### `src/components/DeadlineAlert.tsx`

| Current Class | Replacement Class | Context |
|---------------|-------------------|---------|
| `border-orange-200 bg-orange-50` (urgent) | `border-danger/15 bg-danger-light` | Urgent alert |
| `dark:border-orange-900 dark:bg-orange-950/30` | (remove) | Dark mode |
| `bg-orange-100` (icon bg) | `bg-danger/10` | Urgent icon container |
| `dark:bg-orange-900` | (remove) | Dark mode |
| `text-orange-600` (icon) | `text-danger` | AlertCircle icon |
| `dark:text-orange-400` | (remove) | Dark mode |
| `text-orange-900` (title) | `text-danger` | Alert title |
| `dark:text-orange-200` | (remove) | Dark mode |
| `text-orange-700` (subtitle) | `text-danger/80` | Alert subtitle |
| `dark:text-orange-300` | (remove) | Dark mode |

#### `src/components/SmartInsights.tsx`

| Current Class | Replacement Class | Context |
|---------------|-------------------|---------|
| `text-amber-500` (Lightbulb) | `text-warning` | Section header icon |

#### `src/components/BillExplanation.tsx`

| Current Class | Replacement Class | Context |
|---------------|-------------------|---------|
| `text-orange-600` (increase) | `text-secondary-600` | Increase amount |
| `text-green-600` (decrease) | `text-success` | Decrease amount |
| `text-orange-500` (ArrowUp) | `text-secondary-500` | Up arrow |
| `text-green-500` (ArrowDown) | `text-success` | Down arrow |

#### `src/lib/types.ts`

| Current Value | Replacement Value | Context |
|---------------|-------------------|---------|
| `water.color: "#3b82f6"` | `"#0ea5e9"` | Water color (blue-500 → sky-500) |
| `water.colorLight: "#dbeafe"` | `"#e0f2fe"` | Water light (blue-100 → sky-100) |
| `water.gradient: "from-blue-500 to-cyan-500"` | `"from-primary-500 to-primary-600"` | Water gradient |
| `osbb.color: "#8b5cf6"` | `"#64748b"` | OSBB color (violet → slate) |
| `osbb.colorLight: "#ede9fe"` | `"#f1f5f9"` | OSBB light |
| `osbb.gradient: "from-violet-500 to-purple-500"` | `"from-osbb to-osbb"` | OSBB gradient |

**Also add `heating` to ServiceType and SERVICE_CONFIG:**
```typescript
export type ServiceType = "water" | "electricity" | "gas" | "heating" | "osbb" | "other";

// Add to SERVICE_CONFIG:
heating: {
  label: "Heating",
  labelUa: "Опалення",
  unit: "Гкал",
  color: "#ef4444",
  colorLight: "#fee2e2",
  icon: "thermometer",
  gradient: "from-heating to-heating",
},
```

#### `src/lib/mockData.ts`

| Current Value | Replacement Value | Context |
|---------------|-------------------|---------|
| `color: "#3b82f6"` (m1, m2) | `"#0ea5e9"` | Water meter color |
| `colorLight: "#dbeafe"` (m1, m2) | `"#e0f2fe"` | Water meter light |

#### `src/app/layout.tsx`

| Current Value | Replacement Value | Context |
|---------------|-------------------|---------|
| `themeColor: "#0891b2"` | `"#14b8a6"` | Viewport theme color (primary-500) |
| `Geist` font import | `Inter` font import | Font family per DESIGN_SYSTEM.md |
| `Geist_Mono` font import | `IBM_Plex_Mono` font import | Monospace font for numbers |
| `--font-geist-sans` variable | `--font-inter` variable | CSS variable name |
| `--font-geist-mono` variable | `--font-ibm-plex-mono` variable | CSS variable name |

**layout.tsx font replacement:**
```typescript
import { Inter, IBM_Plex_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
```

**Note**: `Inter` requires `cyrillic` subset for Ukrainian text. `Geist` does not include Cyrillic subset — this is a bug in the current code.

---

## 2. Color Token → Tailwind Class Mapping

### 2.1. Primary (Teal)

| Token | Hex | Tailwind Class (bg-) | Tailwind Class (text-) | Tailwind Class (border-) |
|-------|-----|---------------------|------------------------|--------------------------|
| primary-50 | #f0fdfa | `bg-primary-50` | `text-primary-50` | `border-primary-50` |
| primary-100 | #ccfbf1 | `bg-primary-100` | `text-primary-100` | `border-primary-100` |
| primary-200 | #99f6e4 | `bg-primary-200` | `text-primary-200` | `border-primary-200` |
| primary-300 | #5eead4 | `bg-primary-300` | `text-primary-300` | `border-primary-300` |
| primary-400 | #2dd4bf | `bg-primary-400` | `text-primary-400` | `border-primary-400` |
| primary-500 | #14b8a6 | `bg-primary-500` | `text-primary-500` | `border-primary-500` |
| primary-600 | #0d9488 | `bg-primary-600` | `text-primary-600` | `border-primary-600` |
| primary-700 | #0f766e | `bg-primary-700` | `text-primary-700` | `border-primary-700` |
| primary-800 | #115e59 | `bg-primary-800` | `text-primary-800` | `border-primary-800` |
| primary-900 | #134e4a | `bg-primary-900` | `text-primary-900` | `border-primary-900` |

### 2.2. Secondary (Terracotta)

| Token | Hex | Tailwind Class (bg-) | Tailwind Class (text-) | Tailwind Class (border-) |
|-------|-----|---------------------|------------------------|--------------------------|
| secondary-50 | #fff7ed | `bg-secondary-50` | `text-secondary-50` | `border-secondary-50` |
| secondary-100 | #ffedd5 | `bg-secondary-100` | `text-secondary-100` | `border-secondary-100` |
| secondary-200 | #fed7aa | `bg-secondary-200` | `text-secondary-200` | `border-secondary-200` |
| secondary-300 | #fdba74 | `bg-secondary-300` | `text-secondary-300` | `border-secondary-300` |
| secondary-400 | #fb923c | `bg-secondary-400` | `text-secondary-400` | `border-secondary-400` |
| secondary-500 | #f97316 | `bg-secondary-500` | `text-secondary-500` | `border-secondary-500` |
| secondary-600 | #ea580c | `bg-secondary-600` | `text-secondary-600` | `border-secondary-600` |
| secondary-700 | #c2410c | `bg-secondary-700` | `text-secondary-700` | `border-secondary-700` |

### 2.3. Utility Colors

| Token | Hex | Tailwind Class (bg-) | Tailwind Class (text-) |
|-------|-----|---------------------|------------------------|
| water | #0ea5e9 | `bg-water` | `text-water` |
| water-light | #e0f2fe | `bg-water-light` | `text-water-light` |
| electricity | #f59e0b | `bg-electricity` | `text-electricity` |
| electricity-light | #fef3c7 | `bg-electricity-light` | `text-electricity-light` |
| gas | #f97316 | `bg-gas` | `text-gas` |
| gas-light | #ffedd5 | `bg-gas-light` | `text-gas-light` |
| heating | #ef4444 | `bg-heating` | `text-heating` |
| heating-light | #fee2e2 | `bg-heating-light` | `text-heating-light` |
| osbb | #64748b | `bg-osbb` | `text-osbb` |
| osbb-light | #f1f5f9 | `bg-osbb-light` | `text-osbb-light` |

### 2.4. Status Colors

| Token | Hex | Tailwind Class (bg-) | Tailwind Class (text-) | Tailwind Class (border-) |
|-------|-----|---------------------|------------------------|--------------------------|
| success | #16a34a | `bg-success` | `text-success` | `border-success` |
| success-light | #dcfce7 | `bg-success-light` | `text-success-light` | `border-success-light` |
| warning | #f59e0b | `bg-warning` | `text-warning` | `border-warning` |
| warning-light | #fef3c7 | `bg-warning-light` | `text-warning-light` | `border-warning-light` |
| danger | #dc2626 | `bg-danger` | `text-danger` | `border-danger` |
| danger-light | #fee2e2 | `bg-danger-light` | `text-danger-light` | `border-danger-light` |
| info | #0ea5e9 | `bg-info` | `text-info` | `border-info` |
| info-light | #e0f2fe | `bg-info-light` | `text-info-light` | `border-info-light` |

### 2.5. Surface Colors

| Token | Hex | Tailwind Class |
|-------|-----|---------------|
| background | #fafaf9 | `bg-background` |
| surface | #ffffff | `bg-surface` |
| foreground | #1c1917 | `text-foreground` |
| muted-foreground | #78716c | `text-muted-foreground` |
| disabled | #d6d3d1 | `text-disabled`, `bg-disabled` |
| border | #e7e5e4 | `border-border` |
| border-strong | #d6d3d1 | `border-border-strong` |
| muted | #f5f5f4 | `bg-muted` |

---

## 3. Typography Scale with Exact Tailwind Classes

| Token | Size | Tailwind Class | Weight Class | Line Height | Usage |
|-------|------|---------------|-------------|-------------|-------|
| display | 36px | `text-4xl` | `font-bold` | `leading-10` (40px) | Hero bill total |
| h1 | 24px | `text-2xl` | `font-bold` | `leading-8` (32px) | Page titles |
| h2 | 18px | `text-lg` | `font-semibold` | `leading-6` (24px) | Section headings |
| h3 | 16px | `text-base` | `font-semibold` | `leading-6` (24px) | Card titles |
| body | 15px | `text-[15px]` | `font-normal` | `leading-6` (24px) | Body copy |
| small | 13px | `text-[13px]` | `font-normal` | `leading-5` (20px) | Secondary labels |
| xs | 11px | `text-[11px]` | `font-medium` | `leading-4` (16px) | Captions, badges, nav |
| button | 15px | `text-[15px]` | `font-semibold` | `leading-5` (20px) | Button labels |
| number | varies | `tabular-nums` | varies | varies | All numeric values |

**Font family CSS:**
```css
font-family: var(--font-inter), "Roboto", system-ui, -apple-system, sans-serif;
```

**Monospace (for meter readings):**
```css
font-family: var(--font-ibm-plex-mono), "Roboto Mono", ui-monospace, monospace;
```

---

## 4. Spacing System with Exact Values

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| 4px | 4px | `gap-1`, `p-1`, `m-1` | Icon spacing, tight gaps |
| 8px | 8px | `gap-2`, `p-2`, `m-2` | Small gaps, badge padding |
| 12px | 12px | `gap-3`, `p-3`, `m-3` | Compact card padding, icon gaps |
| 16px | 16px | `gap-4`, `p-4`, `m-4` | Standard card padding, page px |
| 20px | 20px | `p-5` | Hero card padding |
| 24px | 24px | `gap-6`, `space-y-6` | Section spacing |
| 32px | 32px | `pt-8` | Large top padding |
| 40px | 40px | `pt-10` | Spinner top offset |
| 48px | 48px | `pt-12` | Page top padding |

**Page container (all pages):**
```
px-4 pt-12 pb-[calc(80px+env(safe-area-inset-bottom))]
```
Or equivalently: `min-h-screen bg-background px-4 pt-12 pb-[calc(80px+env(safe-area-inset-bottom))]`

**Section spacing:** `space-y-6` between major sections on each page.

**Card internal spacing:** `p-4` (standard), `p-3` (compact), `p-5` (hero).

---

## 5. Component State Matrix

### 5.1. Primary Button

| State | Background | Text | Shadow | Ring | Scale | Tailwind |
|-------|-----------|------|--------|------|-------|----------|
| Default | `primary-500` | white | `shadow-md shadow-primary-500/20` | none | 100% | `bg-primary-500 text-white shadow-md shadow-primary-500/20` |
| Hover | `primary-600` | white | same | none | 100% | `hover:bg-primary-600` |
| Active | `primary-700` | white | same | none | 95% | `active:bg-primary-700 active:scale-95` |
| Focus | `primary-500` | white | same | `ring-2 ring-primary-300` | 100% | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300` |
| Disabled | `disabled` | `muted-foreground` | none | none | 100% | `disabled:bg-disabled disabled:text-muted-foreground disabled:shadow-none` |

### 5.2. Secondary Button

| State | Background | Text | Tailwind |
|-------|-----------|------|----------|
| Default | `secondary-100` | `secondary-700` | `bg-secondary-100 text-secondary-700` |
| Hover | `secondary-200` | `secondary-700` | `hover:bg-secondary-200` |
| Active | `secondary-300` | `secondary-700` | `active:bg-secondary-300` |
| Focus | `secondary-100` | `secondary-700` | `focus-visible:ring-2 focus-visible:ring-primary-300` |
| Disabled | `muted` | `muted-foreground` | `disabled:bg-muted disabled:text-muted-foreground` |

### 5.3. Ghost Button

| State | Background | Text | Tailwind |
|-------|-----------|------|----------|
| Default | transparent | `foreground` | `text-foreground` |
| Hover | `muted` | `foreground` | `hover:bg-muted` |
| Active | `muted/80` | `foreground` | `active:bg-muted/80` |
| Focus | transparent | `foreground` | `focus-visible:ring-2 focus-visible:ring-primary-300` |
| Disabled | transparent | `muted-foreground` | `disabled:text-muted-foreground` |

### 5.4. Text Input

| State | Border | Background | Ring | Tailwind |
|-------|-------|-----------|------|----------|
| Default | `border-strong` | `surface` | none | `border border-border-strong bg-surface` |
| Focus | `primary-500` | `surface` | `ring-4 ring-primary-100` | `focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100` |
| Error | `danger` | `danger-light/30` | none | `border-danger bg-danger-light/30` |
| Disabled | `border` | `muted` | none | `bg-muted text-muted-foreground` |

### 5.5. Toggle Switch

| State | Track BG | Knob Position | Knob BG | Tailwind |
|-------|---------|-------------|---------|----------|
| ON | `primary-500` | `translate-x-5` | white | `bg-primary-500` + `translate-x-5` |
| OFF | `border` | `translate-x-0.5` | white | `bg-border` + `translate-x-0.5` |
| ON Disabled | `primary-500/50` | `translate-x-5` | white | `bg-primary-500/50` |
| OFF Disabled | `muted` | `translate-x-0.5` | white | `bg-muted` |

### 5.6. Meter Card (Full)

| State | Border | Background | Shadow | Transform | Tailwind |
|-------|--------|-----------|--------|-----------|----------|
| Default | `border` | `surface` | `shadow-sm` | none | `border border-border bg-surface shadow-sm` |
| Hover (web) | `border` | `surface` | `shadow-lg` | `translateY(-2px)` | `card-hover` class |
| Active | `border` | `surface` | `shadow-sm` | none | `card-hover:active` |
| Focus | `primary-500` | `surface` | `shadow-sm` | none | `focus:border-primary-500 focus:ring-4 focus:ring-primary-100` |
| Selected | `primary-500` | `primary-50` | `shadow-sm` | none | `data-[selected=true]:border-primary-500 data-[selected=true]:bg-primary-50` |

### 5.7. Meter Card (Compact)

| State | Border | Background | Tailwind |
|-------|--------|-----------|----------|
| Default | `border` | `surface` | `border border-border bg-surface` |
| Hover (web) | `primary-300` | `surface` | `hover:border-primary-300` |
| Active | `primary-500` | `primary-50` | `active:border-primary-500 active:bg-primary-50` |
| Focus | `primary-500` | `surface` | `focus:border-primary-500 focus:ring-4 focus:ring-primary-100` |

### 5.8. FAB

| State | Background | Shadow | Scale | Tailwind |
|-------|-----------|--------|-------|----------|
| Default | gradient `secondary-500 → secondary-600` | `shadow-lg shadow-secondary-500/30` | 100% | `bg-gradient-to-br from-secondary-500 to-secondary-600 shadow-lg shadow-secondary-500/30` |
| Active | same | same | 95% | `active:scale-95` |
| Focus | same | same | 100% | `focus-visible:ring-2 focus-visible:ring-primary-300` |

### 5.9. Bottom Nav Item

| State | Icon/Label Color | Tailwind |
|-------|-----------------|----------|
| Active | `primary-600` | `text-primary-600` |
| Inactive | `muted-foreground` | `text-muted-foreground` |
| FAB Label | `secondary-600` | `text-secondary-600` |

### 5.10. Meter Selector Pill

| State | Background | Text | Border | Shadow | Tailwind |
|-------|-----------|------|--------|--------|----------|
| Selected | `meter.color` (inline) | white | none | `shadow-md` | `text-white shadow-md` + `style={{ backgroundColor: meter.color }}` |
| Unselected | `surface` | `muted-foreground` | `border` | none | `border border-border bg-surface text-muted-foreground` |

### 5.11. Badge

| Type | Background | Text | Tailwind |
|------|-----------|------|----------|
| Success | `success-light` | `success` | `bg-success-light text-success` |
| Gray | `muted` | `muted-foreground` | `bg-muted text-muted-foreground` |
| Urgent count | `secondary-100` | `secondary-700` | `bg-secondary-100 text-secondary-700` |
| Confidence | `success-light` | `success` | `bg-success-light text-success` |

All badges: `rounded-full px-2 py-0.5 text-xs font-medium`

### 5.12. Alert Card

| Type | Border | Background | Icon | Text | Tailwind |
|------|--------|-----------|------|------|----------|
| Urgent (danger) | `danger/15` | `danger-light` | AlertCircle, `danger` | `danger` | `border-danger/15 bg-danger-light` |
| Upcoming (muted) | `border` | `muted/50` | Bell, `muted-foreground` | `foreground` | `border-border bg-muted/50` |
| Warning | `warning/20` | `warning-light` | AlertTriangle, `warning` | `warning` | `border-warning/20 bg-warning-light` |
| Info | `info/20` | `info-light` | Info, `info` | `info` | `border-info/20 bg-info-light` |
| Success | `success/20` | `success-light` | CheckCircle, `success` | `success` | `border-success/20 bg-success-light` |

---

## 6. Screen-by-Screen Implementation Notes

### 6.1. Home Page (`src/app/page.tsx`)

**Required changes:**

1. **Replace all blue classes** with primary/secondary tokens (see §1.2)
2. **Replace `orange-*` classes** with secondary tokens
3. **Remove all `dark:` classes**
4. **Change body text** from `text-sm` to `text-[15px]` where body copy is used
5. **Hero card**: Change gradient to `from-primary-500 to-primary-600`, shadow to `shadow-primary-500/20`
6. **Hero meta text**: Change from `text-blue-100` to `text-white/80` for contrast
7. **Quick action card**: Change from blue to primary tokens
8. **Urgent count badge**: Change from `bg-orange-100 text-orange-700` to `bg-secondary-100 text-secondary-700`
9. **Bill breakdown**: Ensure color dots use `meter.color` from updated types.ts (water = #0ea5e9)
10. **Add skeleton loading state** (AC-13.6): Wrap content in conditional that shows shimmer placeholders while `isLoading`
11. **Add error state** (AC-13.7): Show error card with retry button if API call fails
12. **Add "Немає даних" handling** (AC-7.6): For meters with no readings, show "Немає даних" instead of predicted amount

**Structure:**
```tsx
<div className="px-4 pt-12 pb-[calc(80px+env(safe-area-inset-bottom))] space-y-6">
  <header className="animate-fade-in">...</header>
  {isLoading ? <HomeSkeleton /> : error ? <ErrorState onRetry={refetch} /> : (
    <>
      <HeroCard />
      <DeadlineAlerts />
      <QuickAction />
      <SmartInsights />
      <MeterList />
      <BillBreakdown />
      <BillExplanation />
    </>
  )}
</div>
```

### 6.2. Submit Page (`src/app/submit/page.tsx`)

**Required changes:**

1. **Replace all blue/cyan classes** with primary/secondary tokens
2. **Remove all `dark:` classes**
3. **Camera placeholder**: Change to `from-primary-500 to-primary-600`
4. **Scanning frame**: Change `border-blue-400` to `border-primary-300`
5. **Capture button**: Change to `from-secondary-500 to-secondary-600` (secondary = CTA action)
6. **EPS submit button**: Change to `from-primary-500 to-primary-600`
7. **Success circle**: Change to `from-success to-success` or use solid `bg-success`
8. **Monotonicity warning**: Change to `border-danger/20 bg-danger-light text-danger`
9. **Confidence badge**: Change to `bg-success-light text-success`
10. **Add camera unavailable state** (E-CAMERA, AC-2.6)
11. **Add OCR failed state** (E-OCR-FAIL, AC-3.7)
12. **Add OCR unavailable state** (E-OCR-UNAVAILABLE, AC-15.4)
13. **Add EPS credentials check** (E-EPS-NO-CREDS, AC-4.7): Before showing EPS submit button, check if credentials are configured
14. **Add EPS failure state** (E-EPS-FAIL, AC-4.4): With retry and manual fallback
15. **Back button**: Add `min-h-[44px]` for touch target compliance
16. **Capture button**: Disable during capture (AC-2.4), show spinner inside button

### 6.3. History Page (`src/app/history/page.tsx`)

**Required changes:**

1. **Remove all `dark:` classes**
2. **Trend up badge**: Change from `bg-orange-100 text-orange-700` to `bg-secondary-100 text-secondary-700`
3. **Trend down badge**: Change from `bg-green-100 text-green-700` to `bg-success-light text-success`
4. **Meter pills**: Add `min-h-[44px]` for touch target compliance (AC-14.4)
5. **Add skeleton loading state** (AC-13.6)
6. **Add error state** (AC-13.7)
7. **Add empty state** (AC-5.7): "Поки немає даних. Передайте перший показник, щоб побачити графік." with link to /submit
8. **Tariff display** (AC-5.3): Ensure tariff is shown below meter info header. For gas with 2 tariffs, show summed value.
9. **Cost calculation** (AC-6.2, AC-6.3): Ensure cost = (last - prev) × sum of all tariffs for service type

### 6.4. Settings Page (`src/app/settings/page.tsx`)

**Required changes:**

1. **Remove all `dark:` classes**
2. **Profile avatar**: Change from `from-cyan-500 to-teal-600` to `from-primary-500 to-primary-600`
3. **EPS icon**: Change from `bg-cyan-100 text-cyan-600` to `bg-primary-100 text-primary-600`
4. **Connected badge**: Change from `bg-green-100 text-green-700` to `bg-success-light text-success`
5. **Shield icon**: Change from `text-green-500` to `text-success`
6. **Add EPS not-connected state** (AC-10.2, AC-10.3): Show "Не підключено" gray badge + "Налаштувати" button
7. **Add EPS credentials form** (AC-10.3): Modal or inline form with username, password, save + validate
8. **Add validation feedback** (AC-10.6): Show success/failure after attempting login
9. **Make toggles functional** (AC-9.5–9.7): Wire up to Capacitor Local Notifications
10. **Add skeleton loading state** (AC-13.6)
11. **Add error state** (AC-13.7)
12. **Version footer**: Ensure format is "Communal v{version} • Зроблено з ❤️ для України" (AC-11.3)

### 6.5. BottomNav (`src/components/BottomNav.tsx`)

**Required changes:**

1. **FAB gradient**: Change from `from-blue-600 to-blue-500` to `from-secondary-500 to-secondary-600`
2. **FAB shadow**: Change from `shadow-blue-500/30` to `shadow-secondary-500/30`
3. **FAB label**: Change from `text-primary` to `text-secondary-600`
4. **Nav background**: Change from `bg-card/80` to `bg-surface/90`
5. **Add `shadow-xl`** to nav container (per DESIGN_SYSTEM.md)
6. **Add `border-t`** (already present, verify it uses `border-border`)

### 6.6. MeterCard (`src/components/MeterCard.tsx`)

**Required changes:**

1. **No color class changes needed** (uses inline styles from meter.color/colorLight)
2. **Colors will be correct once types.ts and mockData.ts are updated**
3. **Add `focus:border-primary-500 focus:ring-4 focus:ring-primary-100`** to button element
4. **Add `data-[selected=true]:border-primary-500 data-[selected=true]:bg-primary-50`** for selected state
5. **Add `min-h-[44px]`** to compact variant for touch target

### 6.7. DeadlineAlert (`src/components/DeadlineAlert.tsx`)

**Required changes:**

1. **Replace all `orange-*` classes** with danger tokens
2. **Remove all `dark:` classes**
3. **Urgent alert**: `border-danger/15 bg-danger-light`, icon `text-danger`, title `text-danger`, subtitle `text-danger/80`
4. **Icon container**: `bg-danger/10` instead of `bg-orange-100`

### 6.8. SmartInsights (`src/components/SmartInsights.tsx`)

**Required changes:**

1. **Section header icon**: Change from `text-amber-500` to `text-warning`
2. **Remove any `dark:` classes** if present
3. **Insight colors**: Already using inline styles from `getSmartInsights()` — verify colors match DESIGN_SYSTEM.md:
   - Streak: `#f97316` (secondary-500) ✅
   - Anomaly up: `#ef4444` (danger/heating) → should be `#dc2626` (danger) ⚠️
   - Anomaly down: `#22c55e` → should be `#16a34a` (success) ⚠️
   - CO₂: `#22c55e` → should be `#16a34a` (success) ⚠️
   - Saving: `#f59e0b` (warning) ✅
   - Seasonal: `#0891b2` → should be `#14b8a6` (primary-500) ⚠️

**Fix insight colors in `mockData.ts` `getSmartInsights()`:**

| Insight | Current color | Correct color | Current bgColor | Correct bgColor |
|---------|--------------|---------------|-----------------|-----------------|
| Streak | `#f97316` | `#f97316` ✅ | `#fff7ed` | `#fff7ed` ✅ |
| Anomaly up | `#ef4444` | `#dc2626` (danger) | `#fef2f2` | `#fee2e2` (danger-light) |
| Anomaly down | `#22c55e` | `#16a34a` (success) | `#f0fdf4` | `#dcfce7` (success-light) |
| CO₂ | `#22c55e` | `#16a34a` (success) | `#f0fdf4` | `#dcfce7` (success-light) |
| Saving | `#f59e0b` | `#f59e0b` ✅ | `#fef3c7` | `#fef3c7` ✅ |
| Seasonal | `#0891b2` | `#14b8a6` (primary-500) | `#ecfeff` | `#f0fdfa` (primary-50) |

### 6.9. BillExplanation (`src/components/BillExplanation.tsx`)

**Required changes:**

1. **Increase color**: Change from `text-orange-600` to `text-secondary-600`
2. **Decrease color**: Change from `text-green-600` to `text-success`
3. **Arrow up**: Change from `text-orange-500` to `text-secondary-500`
4. **Arrow down**: Change from `text-green-500` to `text-success`
5. **Info icon**: Change from `text-primary` to `text-primary-500` (explicit)

### 6.10. UsageChart (`src/components/UsageChart.tsx`)

**Required changes:**

1. **Default color**: Change from `#0891b2` to `#14b8a6` (primary-500)
2. **Axis tick color**: Already `#78716c` (muted-foreground) ✅
3. **Tooltip border**: Already `#e7e5e4` (border) ✅
4. **No other changes needed** — chart uses inline color from meter data

### 6.11. layout.tsx

**Required changes:**

1. **Font**: Replace `Geist`/`Geist_Mono` with `Inter`/`IBM_Plex_Mono`
2. **Font subsets**: Add `"cyrillic"` to Inter subsets (critical for Ukrainian text)
3. **Theme color**: Change from `#0891b2` to `#14b8a6`
4. **CSS variables**: Update `--font-geist-sans` → `--font-inter`, `--font-geist-mono` → `--font-ibm-plex-mono`

### 6.12. globals.css

**Required changes:**

1. Follow DESIGN_SYSTEM.md §8 "CSS Variables Structure" — replace entire `:root` block
2. Update `@theme inline` to expose all color tokens to Tailwind v4
3. Change body background from `#f8fafc` to `#fafaf9`
4. Remove any `.gradient-text` utility using blue
5. Update `.card-hover:hover` shadow to use warm stone tint `rgba(28, 25, 23, 0.06)`
6. Add `heating` colors
7. Add `--color-*` mappings for all semantic colors
8. Add `@media (prefers-reduced-motion: reduce)` block

---

## 7. Animation / Transition Specs

### 7.1. CSS Keyframes (in globals.css)

```css
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

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### 7.2. Animation Utility Classes

| Class | Animation | Duration | Easing | Usage |
|-------|-----------|----------|--------|-------|
| `.animate-fade-in` | fade-in | 400ms | ease-out | Page mount, card appearance |
| `.animate-slide-up` | slide-up | 500ms | ease-out | Hero card on home page |
| `.animate-pulse-soft` | pulse-soft | 2s infinite | ease-in-out | Alert pulsing (reserved) |
| `.animate-spin` | spin | 1s infinite | linear | Loading spinners (Tailwind built-in) |
| `.shimmer` | shimmer | 1.5s infinite | linear | Skeleton loading |
| `.card-hover` | transition | 200ms | ease | Card hover/press |

### 7.3. Transition Specs

| Element | Property | Duration | Easing | Tailwind |
|---------|----------|----------|--------|----------|
| Button press | transform | 100ms | ease | `active:scale-95 transition-transform` |
| Button color | background-color | 150ms | ease | `transition-colors` |
| Card hover | transform, shadow | 200ms | ease | `.card-hover` class |
| Toggle | background-color, transform | 200ms | ease | `transition-colors transition-transform` |
| Meter pill | all | 200ms | ease | `transition-all` |
| Page content | opacity, transform | 400ms | ease-out | `.animate-fade-in` |

### 7.4. Reduced Motion

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

---

## 8. Icon Specification

All icons from [Lucide React](https://lucide.dev/). Import individually for tree-shaking.

### 8.1. Navigation Icons

| Context | Icon Name | Import | Size | strokeWidth | Color (active) | Color (inactive) |
|---------|-----------|--------|------|-------------|----------------|-------------------|
| Home tab | Home | `import { Home } from "lucide-react"` | 20px (`h-5 w-5`) | 2 | `text-primary-600` | `text-muted-foreground` |
| History tab | BarChart3 | `import { BarChart3 } from "lucide-react"` | 20px | 2 | `text-primary-600` | `text-muted-foreground` |
| Submit FAB | Camera | `import { Camera } from "lucide-react"` | 24px (`h-6 w-6`) | 2.5 | `text-white` | — |
| Settings tab | Settings | `import { Settings } from "lucide-react"` | 20px | 2 | `text-primary-600` | `text-muted-foreground` |

### 8.2. Utility Meter Icons

| Utility | Icon Name | Import | Size (full) | Size (compact) | strokeWidth | Color |
|---------|-----------|--------|-------------|----------------|-------------|-------|
| Water | Droplet | `import { Droplet } from "lucide-react"` | 24px (`h-6 w-6`) | 20px (`h-5 w-5`) | 2 | `#0ea5e9` |
| Electricity | Zap | `import { Zap } from "lucide-react"` | 24px | 20px | 2 | `#f59e0b` |
| Gas | Flame | `import { Flame } from "lucide-react"` | 24px | 20px | 2 | `#f97316` |
| Heating | Thermometer | `import { Thermometer } from "lucide-react"` | 24px | 20px | 2 | `#ef4444` |
| OSBB | Building | `import { Building } from "lucide-react"` | 24px | 20px | 2 | `#64748b` |
| Other | Receipt | `import { Receipt } from "lucide-react"` | 24px | 20px | 2 | `#64748b` |

### 8.3. Action Icons

| Context | Icon Name | Import | Size | strokeWidth | Color |
|---------|-----------|--------|------|-------------|-------|
| Back button | ArrowLeft | `import { ArrowLeft } from "lucide-react"` | 16px (`h-4 w-4`) | 2 | `text-muted-foreground` |
| Chevron right | ChevronRight | `import { ChevronRight } from "lucide-react"` | 16px/20px | 2 | `text-muted-foreground` |
| Upload (submit) | Upload | `import { Upload } from "lucide-react"` | 20px (`h-5 w-5`) | 2 | `text-white` |
| External link | ExternalLink | `import { ExternalLink } from "lucide-react"` | 16px (`h-4 w-4`) | 2 | `text-primary` |
| Retry | RotateCcw | `import { RotateCcw } from "lucide-react"` | 20px | 2 | `text-white` |

### 8.4. Status Icons

| Context | Icon Name | Import | Size | strokeWidth | Color |
|---------|-----------|--------|------|-------------|-------|
| Urgent alert | AlertCircle | `import { AlertCircle } from "lucide-react"` | 20px (`h-5 w-5`) | 2 | `text-danger` |
| Upcoming alert | Bell | `import { Bell } from "lucide-react"` | 16px (`h-4 w-4`) | 2 | `text-muted-foreground` |
| Warning triangle | AlertTriangle | `import { AlertTriangle } from "lucide-react"` | 16px | 2 | `text-secondary-500` |
| Success check | Check | `import { Check } from "lucide-react"` | 48px (`h-12 w-12`) | 3 | `text-white` |
| Check (badge) | Check | same | 12px (`h-3 w-3`) | 2 | `text-success` |
| Error | XCircle | `import { XCircle } from "lucide-react"` | 48px | 2 | `text-danger` |
| Info | Info | `import { Info } from "lucide-react"` | 16px | 2 | `text-primary-500` |
| Shield (privacy) | Shield | `import { Shield } from "lucide-react"` | 20px | 2 | `text-success` |
| Spinner | Loader2 | `import { Loader2 } from "lucide-react"` | 48px (`h-12 w-12`) | 2 | `text-primary-500` |

### 8.5. Insight Icons

| Insight Type | Icon Name | Import | Size | strokeWidth | Color |
|-------------|-----------|--------|------|-------------|-------|
| Streak | Flame | `import { Flame } from "lucide-react"` | 16px (`h-4 w-4`) | 2 | `#f97316` (secondary-500) |
| Anomaly ↑ | AlertCircle | `import { AlertCircle } from "lucide-react"` | 16px | 2 | `#dc2626` (danger) |
| Anomaly ↓ | TrendingDown | `import { TrendingDown } from "lucide-react"` | 16px | 2 | `#16a34a` (success) |
| CO₂ | Leaf | `import { Leaf } from "lucide-react"` | 16px | 2 | `#16a34a` (success) |
| Saving | Zap | `import { Zap } from "lucide-react"` | 16px | 2 | `#f59e0b` (warning) |
| Seasonal | Lightbulb | `import { Lightbulb } from "lucide-react"` | 16px | 2 | `#14b8a6` (primary-500) |

### 8.6. Data Icons

| Context | Icon Name | Import | Size | strokeWidth | Color |
|---------|-----------|--------|------|-------------|-------|
| Sparkles (hero) | Sparkles | `import { Sparkles } from "lucide-react"` | 16px | 2 | `text-primary-50` |
| Trend up | TrendingUp | `import { TrendingUp } from "lucide-react"` | 12px (`h-3 w-3`) | 2 | `text-secondary-600` |
| Trend down | TrendingDown | `import { TrendingDown } from "lucide-react"` | 12px | 2 | `text-success` |
| Arrow up (factor) | ArrowUp | `import { ArrowUp } from "lucide-react"` | 14px (`h-3.5 w-3.5`) | 2 | `text-secondary-500` |
| Arrow down (factor) | ArrowDown | `import { ArrowDown } from "lucide-react"` | 14px | 2 | `text-success` |
| Arrow right | ArrowRight | `import { ArrowRight } from "lucide-react"` | 20px (`h-5 w-5`) | 2 | `text-primary-600` |

---

## 9. Skeleton / Loading State Implementation

### 9.1. Shimmer CSS

```css
.shimmer {
  background: linear-gradient(
    90deg,
    var(--muted) 25%,
    var(--border) 50%,
    var(--muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### 9.2. Skeleton Components

**Home skeleton:**
```tsx
<div className="px-4 pt-12 space-y-6">
  {/* Hero shimmer */}
  <div className="h-[120px] rounded-3xl shimmer" />
  {/* Alert shimmers */}
  <div className="space-y-2">
    <div className="h-[56px] rounded-2xl shimmer" />
    <div className="h-[56px] rounded-2xl shimmer" />
  </div>
  {/* Insight shimmers */}
  <div className="space-y-2">
    <div className="h-[64px] rounded-2xl shimmer" />
    <div className="h-[64px] rounded-2xl shimmer" />
    <div className="h-[64px] rounded-2xl shimmer" />
  </div>
  {/* Meter card shimmers */}
  <div className="space-y-3">
    <div className="h-[120px] rounded-2xl shimmer" />
    <div className="h-[120px] rounded-2xl shimmer" />
    <div className="h-[120px] rounded-2xl shimmer" />
    <div className="h-[120px] rounded-2xl shimmer" />
  </div>
</div>
```

**Submit skeleton:**
```tsx
<div className="px-4 pt-12 space-y-4">
  <div className="h-[32px] w-[60%] rounded-lg shimmer" />
  <div className="h-[20px] w-[80%] rounded shimmer" />
  <div className="space-y-3">
    <div className="h-[56px] rounded-2xl shimmer" />
    <div className="h-[56px] rounded-2xl shimmer" />
    <div className="h-[56px] rounded-2xl shimmer" />
    <div className="h-[56px] rounded-2xl shimmer" />
  </div>
</div>
```

**History skeleton:**
```tsx
<div className="px-4 pt-12 space-y-6">
  <div className="h-[32px] w-[40%] rounded-lg shimmer" />
  {/* Pill shimmers */}
  <div className="flex gap-2">
    <div className="h-[36px] w-[80px] rounded-full shimmer" />
    <div className="h-[36px] w-[80px] rounded-full shimmer" />
    <div className="h-[36px] w-[80px] rounded-full shimmer" />
    <div className="h-[36px] w-[80px] rounded-full shimmer" />
  </div>
  {/* Chart shimmer */}
  <div className="h-[200px] rounded-2xl shimmer" />
  {/* List shimmers */}
  <div className="space-y-2">
    <div className="h-[48px] rounded-2xl shimmer" />
    <div className="h-[48px] rounded-2xl shimmer" />
    <div className="h-[48px] rounded-2xl shimmer" />
  </div>
</div>
```

**Settings skeleton:**
```tsx
<div className="px-4 pt-12 space-y-6">
  <div className="h-[32px] w-[40%] rounded-lg shimmer" />
  <div className="h-[80px] rounded-2xl shimmer" />
  <div className="h-[120px] rounded-2xl shimmer" />
  <div className="h-[180px] rounded-2xl shimmer" />
  <div className="h-[80px] rounded-2xl shimmer" />
  <div className="h-[120px] rounded-2xl shimmer" />
</div>
```

### 9.3. Error State Component

```tsx
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-light">
        <AlertCircle className="h-8 w-8 text-danger" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Не вдалося завантажити</p>
        <p className="text-xs text-muted-foreground mt-1">Перевірте підключення та спробуйте ще раз</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-primary-500 px-6 text-[15px] font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-600 active:bg-primary-700 active:scale-95 transition-all"
      >
        Спробувати ще раз
      </button>
    </div>
  );
}
```

---

## 10. Implementation Checklist

### 10.1. Color Migration (Priority: P0, AC-7)

- [ ] Update `globals.css` with DESIGN_SYSTEM.md §8 CSS variables
- [ ] Update `@theme inline` to expose all color tokens
- [ ] Replace all `blue-*` classes in `page.tsx` with `primary-*` / `secondary-*`
- [ ] Replace all `blue-*` / `cyan-*` classes in `submit/page.tsx`
- [ ] Replace all `orange-*` classes in `page.tsx` with `secondary-*`
- [ ] Replace all `orange-*` / `green-*` classes in `history/page.tsx`
- [ ] Replace all `cyan-*` / `green-*` classes in `settings/page.tsx`
- [ ] Replace `blue-*` in `BottomNav.tsx` with `secondary-*`
- [ ] Replace `orange-*` in `DeadlineAlert.tsx` with `danger-*`
- [ ] Replace `amber-500` in `SmartInsights.tsx` with `warning`
- [ ] Replace `orange-*` / `green-*` in `BillExplanation.tsx` with `secondary-*` / `success`
- [ ] Replace `#0891b2` in `UsageChart.tsx` with `#14b8a6`
- [ ] Update `types.ts`: water color `#3b82f6` → `#0ea5e9`, OSBB color `#8b5cf6` → `#64748b`
- [ ] Update `mockData.ts`: water meter colors
- [ ] Update `mockData.ts`: insight colors (anomaly, CO₂, seasonal)
- [ ] Update `layout.tsx`: themeColor `#0891b2` → `#14b8a6`

### 10.2. Dark Mode Removal (Priority: P0, OOS-8)

- [ ] Remove all `dark:` classes from `page.tsx`
- [ ] Remove all `dark:` classes from `submit/page.tsx`
- [ ] Remove all `dark:` classes from `history/page.tsx`
- [ ] Remove all `dark:` classes from `settings/page.tsx`
- [ ] Remove all `dark:` classes from `DeadlineAlert.tsx`
- [ ] Remove all `dark:` classes from `SmartInsights.tsx`
- [ ] Remove all `dark:` classes from any other component

### 10.3. Font Migration (Priority: P0)

- [ ] Replace `Geist`/`Geist_Mono` with `Inter`/`IBM_Plex_Mono` in `layout.tsx`
- [ ] Add `"cyrillic"` subset to Inter font config
- [ ] Update CSS variables: `--font-geist-sans` → `--font-inter`, `--font-geist-mono` → `--font-ibm-plex-mono`
- [ ] Update `globals.css` `--font-sans` to use `var(--font-inter)`

### 10.4. Body Text Size (Priority: P1, NFR-7)

- [ ] Change body text from `text-sm` (14px) to `text-[15px]` where body copy is used
- [ ] Keep `text-sm` for secondary/tertiary text where 14px is acceptable
- [ ] Keep `text-xs` for captions/badges

### 10.5. Touch Target Compliance (Priority: P1, AC-14.4)

- [ ] Add `min-h-[44px]` to meter selector pills in `history/page.tsx`
- [ ] Add `min-h-[44px]` to back button in `submit/page.tsx`
- [ ] Verify all buttons meet 48px height minimum

### 10.6. Missing States (Priority: P0)

- [ ] Add camera unavailable state (E-CAMERA) to submit flow
- [ ] Add OCR failed state (E-OCR-FAIL) to submit flow
- [ ] Add OCR unavailable state (E-OCR-UNAVAILABLE) to submit flow
- [ ] Add EPS credentials check + redirect (E-EPS-NO-CREDS) to submit flow
- [ ] Add EPS failure state (E-EPS-FAIL) with retry + manual fallback
- [ ] Add skeleton loading states to all pages (AC-13.6)
- [ ] Add error states with retry to all pages (AC-13.7)
- [ ] Add empty state to history page (AC-5.7)
- [ ] Add "Немає даних" to bill breakdown for meters without readings (AC-7.6)
- [ ] Add EPS not-connected state to settings (AC-10.2, AC-10.3)
- [ ] Add EPS credentials form to settings (AC-10.3, AC-10.6)

### 10.7. Type System (Priority: P1)

- [ ] Add `"heating"` to `ServiceType` union in `types.ts`
- [ ] Add `heating` entry to `SERVICE_CONFIG` in `types.ts`
- [ ] Add `Thermometer` to icon maps in `MeterCard.tsx` and `history/page.tsx`

### 10.8. Accessibility (Priority: P1, NFR-7)

- [ ] Add `aria-label` to FAB
- [ ] Add `role="button"` and `aria-label` to meter cards
- [ ] Add `role="switch"` and `aria-checked` to toggles
- [ ] Add `role="alert"` to urgent alerts
- [ ] Add `aria-live="polite"` to loading spinners
- [ ] Add `role="status"` to success screen
- [ ] Add `role="img"` and `aria-label` to charts
- [ ] Add `focus-visible:ring-2 focus-visible:ring-primary-300` to all interactive elements
- [ ] Add `@media (prefers-reduced-motion: reduce)` to globals.css

---

## 11. Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/app/globals.css` | Complete CSS variable overhaul per DESIGN_SYSTEM.md §8 |
| `src/app/layout.tsx` | Font replacement (Geist → Inter), themeColor fix |
| `src/app/page.tsx` | Color migration, dark mode removal, body text size, skeleton/error states |
| `src/app/submit/page.tsx` | Color migration, dark mode removal, missing error/fallback states, touch targets |
| `src/app/history/page.tsx` | Color migration, dark mode removal, empty state, touch targets, skeleton/error states |
| `src/app/settings/page.tsx` | Color migration, dark mode removal, EPS not-connected state, credentials form, skeleton/error states |
| `src/components/BottomNav.tsx` | FAB color migration, nav background token |
| `src/components/MeterCard.tsx` | Focus states, selected state, touch target (compact) |
| `src/components/DeadlineAlert.tsx` | Color migration (orange → danger), dark mode removal |
| `src/components/SmartInsights.tsx` | Header icon color, dark mode removal |
| `src/components/BillExplanation.tsx` | Color migration (orange/green → secondary/success) |
| `src/components/UsageChart.tsx` | Default color fix (#0891b2 → #14b8a6) |
| `src/lib/types.ts` | Water/OSBB color fix, add heating ServiceType + SERVICE_CONFIG |
| `src/lib/mockData.ts` | Water meter color fix, insight color fixes |

---

## Provenance

| Джерело | Тип | Дата доступу |
|---------|-----|-------------|
| `F:\communal\wiki\products\communal\prd\2026-08-22-communal-prd.md` | PRD | 2026-08-22 |
| `F:\communal\DESIGN_SYSTEM.md` | Design System | 2026-08-22 |
| `F:\communal\wiki\products\communal\design\2026-08-22-communal-design-spec.md` | Design Spec | 2026-08-22 |
| `F:\communal\wiki\products\communal\design\2026-08-22-communal-android-spec.md` | Android Spec | 2026-08-22 |
| `F:\communal\src\app\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\submit\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\history\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\settings\page.tsx` | Code | 2026-08-22 |
| `F:\communal\src\app\layout.tsx` | Code | 2026-08-22 |
| `F:\communal\src\components\*.tsx` | Code | 2026-08-22 |
| `F:\communal\src\lib\types.ts` | Code | 2026-08-22 |
| `F:\communal\src\lib\mockData.ts` | Code | 2026-08-22 |
