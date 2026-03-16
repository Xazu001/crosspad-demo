import "./badge.style.scss";

import * as React from "react";

import { cn } from "#/components/utils";
import {
  type ResponsiveSizeConfig,
  useResponsiveClasses,
} from "#/components/utils/responsive-size";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────
// Badge Component
// ──────────────────────────────────────────────────────────────

/** Badge variants for different styles and sizes */
const badgeVariants = createVariants("badge", {
  variants: {
    variant: {
      card: "badge--card", // Default gray badge
      primary: "badge--primary", // Primary brand color
      destructive: "badge--destructive", // Error/danger
      success: "badge--success", // Success state
      outline: "badge--outline", // Bordered only
      "outline-card": "badge--outline-card",
      "outline-background": "badge--outline-background",
      "outline-secondary": "badge--outline-secondary",
      "outline-popover": "badge--outline-popover",
    },
    size: {
      sm: "badge--sm", // Small badge
      md: "badge--md", // Medium badge
      lg: "badge--lg", // Large badge
    },
  },
  defaultVariants: {
    variant: "card",
    size: "md",
  },
});

/** Badge component for status indicators and labels */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Optional icon to display before the badge text */
  icon?: React.ReactNode;
  responsiveSize?: ResponsiveSizeConfig<"sm" | "md" | "lg">;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, responsiveSize, icon, children, ...props }, ref) => {
    // Universal responsive classes hook - eliminates boilerplate
    const { currentSize, responsiveClasses } = useResponsiveClasses(
      responsiveSize,
      "badge",
      size || "md",
    );

    return (
      <span
        className={cn(badgeVariants({ variant, size: currentSize, className }), responsiveClasses)}
        ref={ref}
        {...props}
      >
        {icon && <span className="badge__icon">{icon}</span>}
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
