---
trigger: model_decision
description: When working with React components (.tsx files). Covers component patterns, variants, layouts, client components, a11y, and SSR.
---

# React Component Standards

## Component Categories

| Category   | Location                 | Purpose                                              | Styles                            |
| ---------- | ------------------------ | ---------------------------------------------------- | --------------------------------- |
| **UI**     | `app/components/ui/`     | Generic reusable primitives (Button, Input, Modal)   | `component.style.scss` co-located |
| **Custom** | `app/components/custom/` | Business-specific (KitCard, Navigation, Beams)       | `component.style.scss` co-located |
| **Pages**  | `app/components/pages/`  | Page-specific groups (`pages/home/`, `pages/legal/`) | `component.style.scss` co-located |

## File Naming

| Type                | Component          | Styles                  |
| ------------------- | ------------------ | ----------------------- |
| Component           | `button.tsx`       | `button.style.scss`     |
| Route               | `index.tsx`        | `index.style.scss`      |
| Split route section | `index.hero.tsx`   | `index.hero.style.scss` |
| Client-only         | `beams.client.tsx` | `beams.style.scss`      |

Always import styles directly: `import "./button.style.scss";`

## Splitting Rules

- **>300 lines** → split into sub-components
- **Complex state** → extract to custom hook in `app/lib/hooks/`
- **Shared UI** → move to `components/ui/` with CVA variants
- **Heavy deps** → lazy load with `React.lazy()`

## Variants System (CVA)

```tsx
import { createVariants } from "#/lib/utils/variants";

const buttonVariants = createVariants("btn", {
  variants: {
    variant: { primary: "btn--primary", secondary: "btn--secondary" },
    size: { sm: "btn--sm", md: "btn--md", lg: "btn--lg" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});
```

### Variant Cascade (Multi-part Components)

Components like Select, Menubar cascade variants via React Context:

- Root accepts `variant`, `size`, optional `contentVariant`
- Sub-components read from context, own props override
- **Priority**: Sub-component prop > Root override > Root variant

## Props Pattern

```tsx
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={loading || props.disabled}
      {...props}
    />
  ),
);
```

- Always `forwardRef` for interactive/focusable components
- Extend HTML attributes when wrapping native elements
- Sizes: `"sm" | "md" | "lg"` (avoid `"default"`)

## Client-Only Components

- Suffix: `.client.tsx` for browser-only components
- Wrap: `<ClientOnly fallback={...}>` from `#/components/custom/client-only`
- When: browser APIs, WebGL/Three.js, audio, localStorage

## Layout System

### Section Pattern (always follow)

```tsx
<section id="unique-id" className="component-name">
  <div className="component-name__container">{/* content */}</div>
</section>
```

### Layout Types

- **Component layouts** (`app/components/custom/layouts/`) — Reusable blocks (SplitLayout, BackgroundLayout)
- **Route layouts** (`app/routes/*/layout.tsx`) — Page orchestrators (auth, navigation, sidebar)

### Layout Mixins

| Mixin                         | Usage                       |
| ----------------------------- | --------------------------- |
| `@include layout-cols(12)`    | Standard centered container |
| `@include layout-cols`        | Full-width container        |
| `@include section-full-width` | Breakout to viewport width  |

## React Keys

- **Always** use unique stable IDs: `key={`kit-${kit.kit_id}`}`
- **Prefix** with context: `kit-`, `user-`, `comment-`
- **Composite** when needed: `key={`comment-${post.id}-${comment.id}`}`
- **Never** use array index or `Math.random()`

## Accessibility

- Semantic HTML first, ARIA only when needed
- Icon buttons → `aria-label`
- Form inputs → `<Label htmlFor>`
- Modals → `role="dialog"`, focus trap

## SSR

- Never use `window.*` → use `useLocation()` instead
- Client-only code → `.client.tsx` suffix + `<ClientOnly>` wrapper
