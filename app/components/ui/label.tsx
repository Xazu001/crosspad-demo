import "./label.style.scss";

import * as React from "react";

import { cn } from "#/components/utils";
import { type ComponentWithModifiers } from "#/components/utils/modifiers";
import {
  type ResponsiveSizeConfig,
  useResponsiveClasses,
} from "#/components/utils/responsive-size";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ================================================================
// -------------------------- LABEL -------------------------------
// ================================================================

const labelVariants = createVariants("label", {
  variants: {
    size: {
      sm: "label--sm",
      md: "label--md",
      lg: "label--lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>, VariantProps<typeof labelVariants> {
  additionalText?: string;
  additionalVariant?: "default" | "destructive";
  additionalIcon?: React.ReactNode;
  additionalSize?: "sm" | "md" | "lg";
  responsiveSize?: ResponsiveSizeConfig<"sm" | "md" | "lg">;
  modifiers?: ComponentWithModifiers<{
    noPaddingBottom?: boolean;
  }>;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      className,
      size,
      responsiveSize,
      additionalText,
      additionalVariant = "default",
      additionalSize = "sm",
      additionalIcon,
      modifiers,
      children,
      ...props
    },
    ref,
  ) => {
    // Universal responsive classes hook - eliminates boilerplate
    const { currentSize, responsiveClasses } = useResponsiveClasses(
      responsiveSize,
      "label",
      size || "md",
    );

    // Generate modifier classes
    const modifierClasses = modifiers
      ? Object.entries(modifiers)
          .filter(([_, value]) => value)
          .map(([key]) => `label--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`)
          .join(" ")
      : "";

    return (
      <div
        className={cn(
          labelVariants({ size: currentSize, className }),
          responsiveClasses,
          modifierClasses,
        )}
      >
        <label ref={ref} {...props}>
          {children}
        </label>
        {(additionalText || additionalIcon) && (
          <span
            className={cn(
              "label__additional",
              `label__additional--${additionalVariant}`,
              `label__additional--${additionalSize}`,
            )}
          >
            {additionalIcon && <span className="label__additional-icon">{additionalIcon}</span>}
            {additionalText}
          </span>
        )}
      </div>
    );
  },
);
Label.displayName = "Label";

export { Label, labelVariants };
