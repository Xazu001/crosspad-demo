import "./button.style.scss";

import * as React from "react";

import { Link } from "react-router";

import { cn } from "#/components/utils";
import { type ComponentWithModifiers } from "#/components/utils/modifiers";
import {
  type ResponsiveSizeConfig,
  useResponsiveClasses,
} from "#/components/utils/responsive-size";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ================================================================
// -------------------------- BUTTON ------------------------------
// ================================================================

const buttonVariants = createVariants("btn", {
  variants: {
    variant: {
      primary: "btn--primary",
      card: "btn--card",
      secondary: "btn--secondary",
      outline: "btn--outline",
      "outline-card": "btn--outline-card",
      "outline-background": "btn--outline-background",
      "outline-secondary": "btn--outline-secondary",
      "outline-popover": "btn--outline-popover",
      ghost: "btn--ghost",
      glass: "btn--glass",
      "glass-card": "btn--glass-card",
      "glass-secondary": "btn--glass-secondary",
      "glass-destructive": "btn--glass-destructive",
      "glass-success": "btn--glass-success",
      "kit-play-main": "btn--kit-play-main",
      "kit-play-card": "btn--kit-play-card",
      destructive: "btn--destructive",
    },
    size: {
      sm: "btn--sm",
      md: "btn--md",
      lg: "btn--lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  state?: "default" | "disabled" | "loading";
  isActive?: boolean;
  to?: string; // When provided, renders as Link
  prefetch?: "intent" | "render" | "none" | "viewport"; // Link prefetch prop
  aspectSquare?: boolean;
  responsiveSize?: ResponsiveSizeConfig<"sm" | "md" | "lg">;
  modifiers?: ComponentWithModifiers<{
    noPaddingInline?: boolean;
    radiusFull?: boolean;
  }>;
}

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      responsiveSize,
      state = "default",
      isActive,
      to,
      prefetch,
      aspectSquare,
      modifiers,
      children,
      ...props
    },
    ref,
  ) => {
    const finalState = state === "default" && props.disabled ? "disabled" : state;

    // Universal responsive classes hook - eliminates boilerplate
    const { currentSize, responsiveClasses } = useResponsiveClasses(
      responsiveSize,
      "btn",
      size || "md",
    );

    // Generate modifier classes
    const modifierClasses = modifiers
      ? Object.entries(modifiers)
          .filter(([_, value]) => value)
          .map(([key]) => `btn--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`)
          .join(" ")
      : "";

    const buttonClasses = cn(
      buttonVariants({ variant, size: currentSize, className }),
      responsiveClasses,
      isActive && "btn--active",
      aspectSquare && "btn--aspect-square",
      modifierClasses,
    );

    const buttonContent =
      finalState === "loading" ? (
        <>
          {children}
          <span className="btn__dots" aria-hidden="true">
            <span className="btn__dot"></span>
            <span className="btn__dot"></span>
            <span className="btn__dot"></span>
          </span>
        </>
      ) : (
        children
      );

    if (to) {
      return (
        <Link
          to={to}
          className={buttonClasses}
          data-state={finalState}
          prefetch={prefetch}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {buttonContent}
        </Link>
      );
    }

    return (
      <button
        className={buttonClasses}
        data-state={finalState}
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={finalState === "disabled" || finalState === "loading"}
        {...props}
      >
        {buttonContent}
      </button>
    );
  },
);

export { Button, buttonVariants };
