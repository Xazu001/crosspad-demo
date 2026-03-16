---
trigger: model_decision
description: When creating or modifying any code files. Covers naming conventions (kebab-case, camelCase, PascalCase, BEM), export patterns, and type safety.
---

# Core Standards

## Naming

| Context             | Convention   | Example                                    |
| ------------------- | ------------ | ------------------------------------------ |
| Files & directories | `kebab-case` | `split-layout.tsx`, `_button.scss`         |
| SCSS variables      | `kebab-case` | `$color-primary`, `$text-lg`               |
| CSS classes         | **BEM**      | `.card`, `.card__title`, `.card--featured` |
| TS/JS variables     | `camelCase`  | `userName`, `handleSubmit`                 |
| React components    | `PascalCase` | `const Button = () => {}`                  |
| SCSS partials       | `_` prefix   | `_hero.scss`, `_tokens.scss`               |

### BEM

- **Block**: `.button` — **Element**: `.button__icon` — **Modifier**: `.button--primary`
- Lists: `.block__list` / `.block__item`

## Exports

- **Components**: Named export → `export { Button };`
- **Routes**: Default export → `export default function Index()`
- **Utilities/services**: Named exports

## Type Safety

- Route types from `+types` dirs: `import type { Route } from "./+types/index";`
- Shared UI types in `#/components/uiTypes`
- Define `interface Props` for component props, extend HTML attributes when wrapping native elements
