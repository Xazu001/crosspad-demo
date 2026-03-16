import "./checkbox.style.scss";

import * as React from "react";

import { Check } from "lucide-react";

import { cn } from "#/components/utils";
import {
  type ResponsiveSizeConfig,
  useResponsiveClasses,
} from "#/components/utils/responsive-size";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────
// Checkbox Component
// ──────────────────────────────────────────────────────────────

/** Checkbox variants for different styles and sizes */
const checkboxVariants = createVariants("checkbox", {
  variants: {
    variant: {
      secondary: "checkbox--secondary",
      card: "checkbox--card",
      glass: "checkbox--glass",
      "glass-card": "checkbox--glass-card",
      "glass-secondary": "checkbox--glass-secondary",
      error: "checkbox--error",
    },
    size: {
      sm: "checkbox--sm", // Small checkbox
      md: "checkbox--md", // Medium checkbox
      lg: "checkbox--lg", // Large checkbox
    },
  },
  defaultVariants: {
    variant: "secondary",
    size: "md",
  },
});

/** Checkbox input component with custom styling */
export interface CheckboxProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof checkboxVariants> {
  responsiveSize?: ResponsiveSizeConfig<"sm" | "md" | "lg">;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, variant, size, responsiveSize, ...props }, ref) => {
    // Universal responsive classes hook - eliminates boilerplate
    const { currentSize, responsiveClasses } = useResponsiveClasses(
      responsiveSize,
      "checkbox",
      size || "md",
    );

    return (
      <div
        className={cn(
          checkboxVariants({ variant, size: currentSize, className }),
          responsiveClasses,
        )}
      >
        <input type="checkbox" className="checkbox__input" ref={ref} {...props} />
        <div className="checkbox__box">
          <Check className="checkbox__icon" />
        </div>
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox, checkboxVariants };
