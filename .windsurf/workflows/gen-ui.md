---
description: Generate a new UI component with variants and co-located styles
auto_execution_mode: 3
---

# Generate UI Component

Create a reusable UI component in `app/components/ui/`.

## Steps

1. Read `.windsurf/rules/components.md` and `.windsurf/rules/tokens.md`

2. Create component file `app/components/ui/component-name.tsx`:

```tsx
import "./component-name.style.scss";

import * as React from "react";

import { type VariantProps, cn, createVariants } from "#/lib/utils/component-utils";

const componentVariants = createVariants("component-name", {
  variants: {
    variant: {
      primary: "component-name--primary",
      secondary: "component-name--secondary",
    },
    size: {
      sm: "component-name--sm",
      md: "component-name--md",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

interface ComponentNameProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof componentVariants> {}

const ComponentName = React.forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div ref={ref} className={cn(componentVariants({ variant, size, className }))} {...props} />
  ),
);
ComponentName.displayName = "ComponentName";

export { ComponentName, componentVariants };
```

3. Create co-located styles `app/components/ui/component-name.style.scss`:

```scss
@use "@abstracts" as *;

.component-name {
  // Base styles

  &--primary {
    background-color: $color-primary;
    color: $color-primary-foreground;
  }

  &--secondary {
    background-color: $color-secondary;
    color: $color-secondary-foreground;
  }

  &--sm {
    padding: 0.5rem;
  }
  &--md {
    padding: 1rem;
  }
}
```
