import "./textarea.style.scss";

import * as React from "react";

import { cn } from "#/components/utils";
import {
  type ResponsiveSizeConfig,
  useResponsiveClasses,
} from "#/components/utils/responsive-size";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────
// Textarea Component
// ──────────────────────────────────────────────────────────────

const textareaVariants = createVariants("textarea", {
  variants: {
    variant: {
      secondary: "textarea--secondary", // Default style
      card: "textarea--card",
      outline: "textarea--outline", // Bordered style
      "outline-card": "textarea--outline-card",
      "outline-background": "textarea--outline-background",
      "outline-secondary": "textarea--outline-secondary",
      "outline-popover": "textarea--outline-popover",
      glass: "textarea--glass",
      "glass-card": "textarea--glass-card",
      "glass-secondary": "textarea--glass-secondary",
    },
    size: {
      sm: "textarea--sm", // Small textarea
      md: "textarea--md", // Medium textarea
      lg: "textarea--lg", // Large textarea
    },
  },
  defaultVariants: {
    variant: "card",
    size: "md",
  },
});

/** Multi-line text input component */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, VariantProps<typeof textareaVariants> {
  responsiveSize?: ResponsiveSizeConfig<"sm" | "md" | "lg">;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, responsiveSize, ...props }, ref) => {
    // Universal responsive classes hook - eliminates boilerplate
    const { currentSize, responsiveClasses } = useResponsiveClasses(
      responsiveSize,
      "textarea",
      size || "md",
    );

    return (
      <textarea
        className={cn(
          textareaVariants({ variant, size: currentSize, className }),
          responsiveClasses,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
