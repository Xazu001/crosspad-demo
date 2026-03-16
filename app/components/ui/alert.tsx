import "./alert.style.scss";

import * as React from "react";

import { cn } from "#/components/utils";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────
// Alert Component
// ──────────────────────────────────────────────────────────────

/** Alert variants for different notification types */
const alertVariants = createVariants("alert", {
  variants: {
    variant: {
      popover: "alert--popover", // Default alert style
      glassDestructive: "alert--glass-destructive", // Error with glass
      glassSuccess: "alert--glass-success", // Success with glass
    },
    textVariant: {
      default: "", // Default text
      destructive: "alert--text-destructive", // Error text
      success: "alert--text-success", // Success text
    },
  },
  defaultVariants: {
    variant: "popover",
    textVariant: "default",
  },
});

/** Alert container component for notifications */
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, textVariant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant, textVariant, className }))}
    {...props}
  />
));
Alert.displayName = "Alert";

/** Alert title heading */
const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("alert__title", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

/** Alert description content */
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("alert__description", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription, AlertTitle };
