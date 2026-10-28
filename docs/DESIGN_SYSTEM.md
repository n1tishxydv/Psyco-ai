# Psyco AI — Design System & Brand Identity

**Version:** 1.0.0 (Phase 0 Foundation)  
**Font Family:** Inter (Google Fonts)  
**Primary Aesthetic:** Calm, Human-Centered, Professional Healthcare SaaS  
**Default Theme:** Dark Theme (Authenticated), Light Theme (Fully Supported)

---

## 1. Brand Philosophy and Visual Ethos

Psyco AI rejects hyper-saturated "neon AI" dashboard aesthetics, noisy animations, and distracting decorative gauges. Mental health software demands visual serenity, clarity, and rock-solid trustworthiness.

* **Calm & Dignified:** Deep oceanic slates and warm jades provide visual stability.
* **Readable & Accessible:** High contrast text tokens ensuring WCAG 2.1 AA compliance (contrast ratio $\ge 4.5:1$).
* **Restrained Modernism:** Subtle borders, controlled elevation shadows, and micro-interactions that reassure clinicians rather than distract them.

---

## 2. Core Color Palette Tokens

| Token Name | Hex Code | Semantic Role | Dark Surface Use | Light Surface Equivalent |
| :--- | :--- | :--- | :--- | :--- |
| **`midnightNavy`** | `#111B2B` | Primary Canvas & Background | App shell base background | Deep contrasting text (`#0E1724`) |
| **`deepBlueGray`** | `#172536` | Card & Panel Surface | Containers, sidebars, headers | Light elevated card (`#FFFFFF`) |
| **`elevatedSlate`** | `#1D3042` | Interactive Element Surface | Hover states, input fields, modals | Subdued background (`#F0F4F8`) |
| **`softTeal`** | `#79CBB8` | Primary Accent & Highlights | Action icons, active tab underlines | Brand accent (`#1B7566`) |
| **`deepJade`** | `#2D8276` | Primary Interactive / Brand | Primary buttons, brand identity | Primary button base (`#246E63`) |
| **`primaryText`** | `#F4F7F6` | Heading & Primary Body Text | High-contrast readable content | Contrast dark body (`#111B2B`) |
| **`secondaryText`** | `#A7B5BE` | Muted Subtext & Form Labels | Metadata, placeholders, labels | Subdued text (`#5A6E7D`) |
| **`mutedAmber`** | `#E6B96C` | Warning & Pending State | Pending intake, unsaved notes | Warning banner base (`#B8842E`) |
| **`calmGreen`** | `#65B891` | Success & Confirmed State | Completed sessions, verified status | Success confirmation (`#2B7F59`) |
| **`mutedCoral`** | `#D87575` | Danger, Error & Risk Alert | Cancellation, critical risk flag | Critical error flag (`#B54848`) |

---

## 3. Typography Scale (Inter)

Base font family: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.

| Element | Tailwind Class | Font Size / Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Heading** | `text-4xl md:text-5xl font-bold tracking-tight` | 36px / 44px (desktop: 48px / 56px) | 700 | Marketing hero, major announcements |
| **Page Title** | `text-2xl md:text-3xl font-semibold` | 24px / 32px (desktop: 30px / 38px) | 600 | Portal page headers |
| **Section Heading** | `text-lg md:text-xl font-medium` | 18px / 26px (desktop: 20px / 28px) | 500 | Card titles, modal titles |
| **Body (Default)** | `text-sm md:text-base font-normal` | 14px / 20px (desktop: 16px / 24px) | 400 | General paragraphs, intake prompts |
| **Supporting / Meta**| `text-xs md:text-sm font-normal` | 12px / 16px (desktop: 14px / 20px) | 400 | Timestamps, badge text, helper hints |
| **Form Labels** | `text-xs md:text-sm font-medium tracking-wide` | 12px / 16px | 500 | Input labels, table column headers |
| **Button Text** | `text-sm font-medium` | 14px / 20px | 500 | Buttons, tabs, interactive chips |

---

## 4. Logo Vector Concept & Specifications

The Psyco AI logo unites two essential motifs:
1. **The Interlocking Dialogue Bubbles:** Denoting human therapeutic conversation, empathy, and active listening.
2. **The Flowing Neural/Heart Curve:** A clean continuous line motif weaving through the center, symbolizing mental clarity and clinical care.

### Color Execution:
* Symbol glyph: Gradients spanning `softTeal` (`#79CBB8`) to `deepJade` (`#2D8276`).
* Wordmark: **`Psyco`** in `primaryText` (`#F4F7F6`) paired with **`AI`** encased in a subtle jade-bordered badge or soft teal accent.
* Formats: Pure vector SVG embedded directly into the codebase (`components/common/Logo.jsx`).

---

## 5. Standard Component Interactive States

All components must implement explicit visual states:

1. **Default:** Stable surface with clear boundary contrast.
2. **Hover:** 10% brightness increase, subtle border elevation (`border-softTeal/40`).
3. **Focus-Visible:** High-visibility outline (`ring-2 ring-softTeal ring-offset-2 ring-offset-midnightNavy`).
4. **Active / Pressed:** Subtle scale down (`scale-[0.99]`) and deepened background.
5. **Disabled:** Reduced opacity (`opacity-50 cursor-not-allowed pointer-events-none`).
6. **Loading:** Spinner animation with accessible `aria-busy="true"` and label preserved for screen readers.
7. **Success:** Soft green boundary and calm icon indicator.
8. **Warning:** Muted amber alert pill and clear contextual message.
9. **Error:** Muted coral border and actionable remediation advice.
10. **Empty State:** Illustrated minimalist icon, descriptive prompt, and clean primary action.

---

## 6. Accessibility & Motion Guidelines

* **Keyboard Navigation:** Every clickable or focusable item has a visible focus ring that is never removed via `outline: none`.
* **Reduced Motion:** All transitions and keyframe animations respect `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
* **Color Independence:** Status indicators must never rely on color alone; always pair colors with text labels or standard iconography.
