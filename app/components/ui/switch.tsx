import "./switch.style.scss";

import * as React from "react";

import { cn } from "#/components/utils";
import {
  type ResponsiveSizeConfig,
  useResponsiveClasses,
} from "#/components/utils/responsive-size";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────
// Switch Component
// ──────────────────────────────────────────────────────────────

/** Switch variants for different styles and sizes */
const switchVariants = createVariants("switch", {
  variants: {
    variant: {
      secondary: "switch--secondary",
      card: "switch--card",
      glass: "switch--glass",
      "glass-card": "switch--glass-card",
      "glass-secondary": "switch--glass-secondary",
      error: "switch--error",
    },
    size: {
      sm: "switch--sm", // Small switch
      md: "switch--md", // Medium switch
      lg: "switch--lg", // Large switch
    },
  },
  defaultVariants: {
    variant: "secondary",
    size: "md",
  },
});

/** Switch input component with custom styling */
export interface SwitchProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange">,
    VariantProps<typeof switchVariants> {
  responsiveSize?: ResponsiveSizeConfig<"sm" | "md" | "lg">;
  /** Callback when switch is toggled */
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, variant, size, responsiveSize, onCheckedChange, ...props }, ref) => {
    // Universal responsive classes hook - eliminates boilerplate
    const { currentSize, responsiveClasses } = useResponsiveClasses(
      responsiveSize,
      "switch",
      size || "md",
    );

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(event.target.checked);
    };

    return (
      <div
        className={cn(switchVariants({ variant, size: currentSize, className }), responsiveClasses)}
      >
        <input
          type="checkbox"
          role="switch"
          className="switch__input"
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        <div className="switch__track">
          <div className="switch__thumb" />
        </div>
      </div>
    );
  },
);
Switch.displayName = "Switch";

export { Switch, switchVariants };
