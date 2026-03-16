---
trigger: model_decision
description: When using design tokens or UI components. Reference for typography, colors (OKLCH), spacing, radius, shadows, and all available UI components with their variants.
---

# Design Tokens & UI Components

## Typography

| Token                   | Value                    |
| ----------------------- | ------------------------ |
| `$font-body`            | "Montserrat", sans-serif |
| `$font-header`          | "Syne", sans-serif       |
| `$font-weight-light`    | 300                      |
| `$font-weight-regular`  | 400                      |
| `$font-weight-medium`   | 500                      |
| `$font-weight-semibold` | 600                      |

**Font Sizes** (CSS variables): `$text-0`, `$text-sm`, `$text-md`, `$text-lg`, `$text-xl`, `$text-2xl`, `$text-3xl`, `$text-4xl`, `$text-5xl`

**Line Heights**: `$line-height-none` (1), `$line-height-snug` (1.375), `$line-height-regular`/`$line-height-normal` (1.5), `$line-height-relaxed` (1.625), `$line-height-loose` (2)

**Letter Spacing**: `$letter-spacing-none` (0), `$letter-spacing-tight` (-0.05em), `$letter-spacing-normal` (100%), `$letter-spacing-wide` (0.05em)

## Radius

`$radius-sm` (1rem), `$radius-md` (1.25rem), `$radius-lg` (1.5rem), `$radius-xl` (2rem), `$radius-full` (9999px)

## Spacing

- `$spacing-x-site`: var(--spacing-x-site)
- `$spacing-top-site`: 24rem
- Hardcoded: 0.25rem (2xs), 0.5rem (xs), 0.75rem, 1rem (sm), 1.5rem (md), 2rem (lg)

## Layout

- `$container-max-width`: var(--container-max-width)

## Colors (OKLCH)

### Surface Colors

Each surface has: base, foreground, foreground-muted, background, hover, active tokens.

| Surface             | Base                        | Description                 |
| ------------------- | --------------------------- | --------------------------- |
| `$color-background` | oklch(18% 0.019 274.6deg)   | Dark blue-tinted background |
| `$color-foreground` | oklch(95% 0.005 250deg)     | Blue-tinted white text      |
| `$color-primary`    | oklch(81.1% 0.213 130.6deg) | Green for CTAs              |
| `$color-secondary`  | oklch(30% 0.024 273.4deg)   | Elevated surfaces           |
| `$color-card`       | oklch(22.1% 0.024 273.4deg) | First elevation level       |
| `$color-popover`    | oklch(22% 0.02 275.8deg)    | Second elevation level      |
| `$color-border`     | oklch(38.5% 0.021 274.3deg) | Subtle borders              |

### Semantic Colors

| Token                | Description                                     |
| -------------------- | ----------------------------------------------- |
| `$color-destructive` | Red for errors/dangerous actions                |
| `$color-success`     | Green for confirmations                         |
| `$color-info`        | Blue for informational content                  |
| `$color-ghost`       | Inverted (foreground as bg, background as text) |

Each semantic color has: base, foreground, hover, active, background tokens.

### Glass Variants

`$color-glass-card-*`, `$color-glass-secondary-*`, `$color-glass-popover-*`, `$color-glass-destructive-*`, `$color-glass-success-*`, `$color-glass-info-*` — Each with base, foreground, foreground-muted, hover, active, background using `color.change($base, $alpha)`.

### Hover Tokens

Pre-defined hover tokens replace inline `color.scale()`:
`$color-primary-hover`, `$color-secondary-hover`, `$color-card-hover`, `$color-popover-hover`, `$color-border-hover`, `$color-foreground-hover`, `$color-destructive-hover`, `$color-success-hover`, `$color-info-hover`

## Shadows & Motion

- `$shadow-sm`, `$shadow-md`, `$shadow-lg`, `$shadow-inner`
- `$transition-duration-unit`: 300ms
- `$transition-ease-in-out`: cubic-bezier(0.4, 0, 0.2, 1)

## Breakpoints

| Name           | Width  |
| -------------- | ------ |
| phone          | 480px  |
| tablet         | 768px  |
| desktop        | 1024px |
| large-desktop  | 1440px |
| xlarge-desktop | 1720px |
| huge           | 1920px |

Usage: `@include media(">=tablet")`

## UI Components

| Component        | Sizes                | Key Variants                                                                                                                                                               |
| ---------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button**       | sm, md, lg           | primary, secondary, outline, outline-background, outline-card, outline-secondary, outline-popover, ghost, glass, glass-card, glass-secondary, kit-play-main, kit-play-card |
| **Button Group** | —                    | card, primary, secondary, outline, outline-background, glass, glass-card, glass-secondary                                                                                  |
| **Input**        | sm, md, lg           | secondary, outline, outline-background, outline-card, outline-secondary, outline-popover, glass, glass-card, glass-secondary, clean                                        |
| **Select**       | sm, md, lg           | same as Input + content variants: popover, card, secondary                                                                                                                 |
| **Textarea**     | sm, md, lg           | same as Input                                                                                                                                                              |
| **Modal**        | sm, md, lg, xl, full | default, popover                                                                                                                                                           |
| **Menubar**      | sm, md, lg           | popover                                                                                                                                                                    |
| **Checkbox**     | sm, md, lg           | primary, secondary, glass                                                                                                                                                  |
| **Alert**        | —                    | secondary, glass, glass-destructive, glass-success, text-destructive, text-success                                                                                         |
| **Avatar**       | sm, md, lg, xl, 2xl  | circle, square                                                                                                                                                             |
| **Badge**        | —                    | default, primary, secondary, destructive, success, outline                                                                                                                 |
| **Label**        | sm, md, lg           | —                                                                                                                                                                          |
| **Aside Menu**   | —                    | Panel: glass-popover, popover. hideAbove: tablet, desktop                                                                                                                  |
| **Breadcrumbs**  | —                    | —                                                                                                                                                                          |
| **File Audio**   | —                    | —                                                                                                                                                                          |
| **File Drop**    | —                    | —                                                                                                                                                                          |
| **File Input**   | —                    | —                                                                                                                                                                          |
| **Image**        | —                    | —                                                                                                                                                                          |
| **Slider**       | —                    | kit-play                                                                                                                                                                   |
| **Ripple**       | —                    | —                                                                                                                                                                          |

### Component Tips

- **Button states**: `data-state="disabled"`, `data-state="loading"` (animated dots)
- **Interactive states**: `@include interaction-state` mixin for hover/focus
- **Glass effect**: `@include glass` mixin with backdrop blur
- **Kit Play theme**: CSS vars `--kit-play-color-main`, `--kit-play-color-card`, etc.

## Token Gotchas

| Wrong                                                    | Correct                 |
| -------------------------------------------------------- | ----------------------- |
| `$font-size-2xl`                                         | `$text-2xl`             |
| `$font-weight-bold`                                      | `$font-weight-semibold` |
| Font sizes are **CSS variables**, not SCSS variables     |
| Colors use **OKLCH** — use `color.change()` not `rgba()` |
