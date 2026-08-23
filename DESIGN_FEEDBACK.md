# Design Feedback — Communal Current Screenshot

## Overview

The current interface is functional but visibly "developer-made." It relies on default-looking Tailwind colors (especially the saturated blue hero card), inconsistent spacing, and mixed visual metaphors. The screenshot shows a dashboard that tries to be modern but ends up looking like a generic admin panel rather than a trustworthy household finance tool for Ukrainian users.

---

## Specific Problems in the Current Screenshot

### 1. Generic Corporate Blue Hero Card
**Problem:** The main bill card uses a bright blue gradient (`from-blue-600 to-blue-500`) that looks like every fintech or SaaS dashboard. It is cold, impersonal, and exactly the kind of color Roman rejected.

**Why it looks developer-made:** Developers often reach for Tailwind's default `blue-500` / `blue-600` because it is safe and familiar, but it has no relationship to home, warmth, or Ukrainian utility context.

**Fix:** Replace with the design system's warm teal gradient (`from-primary-500 [#14b8a6] to-primary-600 [#0d9488]`). Keep the soft white decorative circles but reduce their opacity so they feel subtle, not distracting.

### 2. Two Different "Submit" Actions with Conflicting Styles
**Problem:** There is a blue quick-action row labeled "Передати показники" AND a floating blue camera button in the bottom navigation. They compete for attention, use different shapes (rounded-2xl row vs. circular FAB), and both use slightly different blues.

**Why it looks developer-made:** A developer added a quick shortcut and a nav shortcut without considering whether one is enough or how they relate. The result is visual clutter and confusion about the primary action.

**Fix:** Remove the blue quick-action row from the dashboard. Keep only the centered FAB in the bottom navigation, but change it to the secondary terracotta gradient (`from-secondary-500 [#f97316] to-secondary-600 [#ea580c]`). This makes the camera/submit action the single, obvious CTA.

### 3. Inconsistent Alert Styling
**Problem:** The urgent deadline cards use `bg-orange-50` / `border-orange-200` with `AlertCircle` icons, while the "2 термінових" badge uses `bg-orange-100` / `text-orange-700`. The upcoming water reminder uses a gray muted style. There is no clear severity system.

**Why it looks developer-made:** The colors were probably picked ad-hoc from Tailwind's orange palette without a unified alert language. The dark-mode classes (`dark:bg-orange-900`) are also present even though the app is supposed to be light-only.

**Fix:** Establish a clear severity scale:
- **Urgent / overdue**: `bg-danger-light` + `border-danger/15` + `text-danger` + `AlertCircle`
- **Warning / approaching**: `bg-warning-light` + `border-warning/15` + `text-warning` + `AlertTriangle`
- **Info / upcoming**: `bg-info-light` + `border-info/15` + `text-info` + `Bell`

Remove all `dark:` classes since Roman explicitly wants light theme only.

### 4. Mismatched Utility Colors
**Problem:** Water is shown in bright blue (`#3b82f6`), electricity in amber, and gas in orange. The water color is too close to the hero card's corporate blue, making the visual hierarchy muddy. The bill breakdown uses tiny 8px dots that are hard to scan.

**Why it looks developer-made:** Default Tailwind `blue-500` was used for water because "water = blue," but it clashes with the brand. The dots are a quick developer shortcut instead of proper icon containers.

**Fix:** Use the design system's deeper sky-teal for water (`#0ea5e9`) so it is distinct from the primary teal. In the bill breakdown, replace the 8px dots with the same 40x40px rounded icon containers used on meter cards. This creates consistency and much better scannability.

### 5. Inconsistent Card Padding and Border Radius
**Problem:** Some cards use `rounded-3xl` (hero), some `rounded-2xl` (meter cards, alerts, quick action), and the bill breakdown uses `rounded-2xl` but with internal rows that have no radius. The "Розумні підказки" cards have extra colored backgrounds that bleed inconsistently.

**Why it looks developer-made:** Different components were built at different times without a shared radius/padding contract. The result feels patched together.

**Fix:** Adopt a strict radius convention:
- Hero / primary surfaces: `rounded-3xl` (24px)
- Standard cards / list items: `rounded-2xl` (16px)
- Inputs / small buttons: `rounded-xl` (12px)
- Pills / badges: `rounded-full`

Standardize card padding to `p-4` (16px) or `p-5` (20px) consistently.

---

## What Makes the Current Design Look "Developer-Made" Rather Than Designer-Made

1. **Default color reliance:** The saturated blues and oranges come straight from Tailwind defaults. A designer would choose a more distinctive, thematically appropriate palette.
2. **No visual metaphor:** There is no unifying idea. A designer would build around a concept like "home warmth" or "clear receipt" and let that drive colors, shapes, and copy tone.
3. **Inconsistent iconography:** Some icons are filled, some outlined, some are emojis (`📸`), and some are Lucide icons. A designer would lock a single icon style.
4. **No typographic hierarchy:** The hero number is large, but section titles, labels, and body text are all very close in weight and size. A designer would create clearer contrast.
5. **Copy-paste component patterns:** The dashboard stacks unrelated blocks (hero, alerts, quick action, insights, meters, breakdown, explanation) with the same `space-y-6` gap. A designer would vary spacing to create rhythm and group related information.
6. **Emoji in UI:** The `📸` emoji in the quick action looks unprofessional and inconsistent with the Lucide icons elsewhere.

---

## Priority Order for Fixes

### P0 — Fix Immediately
1. **Replace the hero card blue gradient** with the warm teal gradient defined in the design system.
2. **Remove the duplicate blue quick-action row** and make the bottom-nav FAB the single submit CTA.
3. **Remove all `dark:` classes** — the app must be strictly light theme.

### P1 — Fix Before User Testing
4. **Standardize alert severity colors** (danger / warning / info) and remove ad-hoc oranges.
5. **Update utility colors**, especially water, and use consistent icon containers in the bill breakdown.
6. **Lock border radius and padding** across all cards and buttons.

### P2 — Polish
7. **Replace the emoji** in any remaining components with a consistent Lucide icon.
8. **Refine typographic hierarchy** — increase contrast between hero numbers, section titles, and secondary text.
9. **Add safe-area insets** to the bottom nav and page padding.
10. **Run the Design Verification Checklist** from `DESIGN_SYSTEM.md` and capture screenshots at 375px and 428px widths.
