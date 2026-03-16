---
trigger: model_decision
description: When writing or modifying SCSS styles. Covers units (rem), colors (OKLCH), BEM methodology, file co-location, and common mistakes.
---

# SCSS Standards

## Core Rules

| Rule          | Details                                                                |
| ------------- | ---------------------------------------------------------------------- |
| Units         | `rem` for everything (except animations: `cqw`)                        |
| Media queries | `@include media('>=tablet')` — always `>=` syntax                      |
| Colors        | `color.change()` for transparency — **never** `rgba()` with OKLCH vars |
| Spacing       | `padding` (internal), `margin` (between components), `gap` (flex/grid) |

## SCSS File Template

```scss
@use "@abstracts" as *;
@use "sass:color" as color;

.component {
  // Base styles

  &__element {
  }
  &--modifier {
  }
  &:hover {
  }
  @include interaction-state {
  }
}
```

## Import Order

1. `@use "@abstracts" as *;` — always first, alias not relative
2. `@use "sass:color" as color;` — when using color functions
3. `@use "sass:list" as list;` — when using list functions

**Always use namespaced functions** — global functions are deprecated (Dart Sass 3.0).

## Color Rules

```scss
// ✅ Transparency with OKLCH variables
background-color: color.change($color-primary, $alpha: 80%);

// ✅ Hover tokens (prefer over inline color.scale)
&:hover {
  background-color: $color-primary-hover;
}

// ❌ Never use rgba() with OKLCH
// background-color: rgba($color-primary, 0.8); // BROKEN
```

## File Co-location

All new styles are co-located with their component/route:

| Source                            | Style file                         |
| --------------------------------- | ---------------------------------- |
| `app/components/ui/button.tsx`    | `button.style.scss` (same dir)     |
| `app/routes/legal/index.tsx`      | `index.style.scss` (same dir)      |
| `app/routes/legal/index.hero.tsx` | `index.hero.style.scss` (same dir) |

Import: `import "./button.style.scss";`

Legacy styles in `app/style/` still exist — new code uses co-located styles.

## Common Mistakes

| Wrong               | Correct                             |
| ------------------- | ----------------------------------- |
| `$font-size-2xl`    | `$text-2xl`                         |
| `$font-weight-bold` | `$font-weight-semibold`             |
| `rgba($color, 0.5)` | `color.change($color, $alpha: 50%)` |
| `nth($list, 1)`     | `list.nth($list, 1)`                |

## ⚠️ IMPORTANT: Always Reference tokens.md

**Before using ANY token, check `tokens.md` to verify it exists.**

Common non-existent tokens that cause Sass errors:

- `$spacing-xs`, `$spacing-sm`, `$spacing-md`, `$spacing-lg` — Use hardcoded `rem` values instead
- `@include text-style(...)` — Use `font-size: $text-lg;` directly
- `$color-muted-foreground` — Use `$color-foreground-muted` (correct order)

**Only tokens explicitly listed in `tokens.md` exist.** Do not invent or assume tokens.

## Quick Reference

| Need                 | Solution                            |
| -------------------- | ----------------------------------- |
| Internal space       | `padding`                           |
| Flex/grid items      | `gap`                               |
| Component separation | `margin`                            |
| Color transparency   | `color.change($color, $alpha: 50%)` |
| Responsive           | `@include media('>=tablet')`        |
| Font size            | `$text-md` (CSS variable)           |
| Border radius        | `$radius-md`                        |
| Shadow               | `$shadow-md`                        |
