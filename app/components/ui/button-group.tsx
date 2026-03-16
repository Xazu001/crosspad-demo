import "./button-group.style.scss";

import * as React from "react";

import { cn } from "#/components/utils";
import {
  type ResponsiveSizeConfig,
  useResponsiveClasses,
} from "#/components/utils/responsive-size";

// ──────────────────────────────────────────────────────────────
// Button Group Context
// ──────────────────────────────────────────────────────────────

interface ButtonGroupContextType {
  variant?:
    | "primary"
    | "card"
    | "secondary"
    | "outline"
    | "outline-background"
    | "glass"
    | "glass-card"
    | "glass-secondary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  responsiveSize?: ResponsiveSizeConfig<"sm" | "md" | "lg">;
}

const ButtonGroupContext = React.createContext<ButtonGroupContextType | undefined>(undefined);

const useButtonGroupContext = () => {
  const context = React.useContext(ButtonGroupContext);
  return context;
};

// ──────────────────────────────────────────────────────────────
// Button Group Component
// ──────────────────────────────────────────────────────────────

/** Container for grouping related buttons */
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant for all buttons in the group */
  variant?:
    | "primary"
    | "card"
    | "secondary"
    | "outline"
    | "outline-background"
    | "glass"
    | "glass-card"
    | "glass-secondary";
  /** Size for all buttons in the group */
  size?: "sm" | "md" | "lg";
  /** Responsive size configuration */
  responsiveSize?: ResponsiveSizeConfig<"sm" | "md" | "lg">;
  /** Layout direction of buttons */
  direction?: "row" | "column";
  /** Disable all buttons in the group */
  disabled?: boolean;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      responsiveSize,
      direction = "row",
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {
    // Universal responsive classes hook - eliminates boilerplate
    const { currentSize, responsiveClasses } = useResponsiveClasses(
      responsiveSize,
      "btn-group",
      size || "md",
    );

    return (
      <ButtonGroupContext.Provider value={{ variant, size: currentSize, disabled, responsiveSize }}>
        <div
          ref={ref}
          className={cn(
            "btn-group",
            direction && `btn-group--${direction}`,
            disabled && "btn-group--disabled",
            responsiveClasses,
            className,
          )}
          role="group"
          {...props}
        >
          {children}
        </div>
      </ButtonGroupContext.Provider>
    );
  },
);
ButtonGroup.displayName = "ButtonGroup";

// ================================================================
// ---------------------- BUTTON GROUP ITEM -----------------------
// ================================================================

export interface ButtonGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

const ButtonGroupItem = React.forwardRef<HTMLButtonElement, ButtonGroupItemProps>(
  ({ className, isActive, children, ...props }, ref) => {
    const context = useButtonGroupContext();
    const isDisabled = context?.disabled || props.disabled;

    return (
      <button
        ref={ref}
        className={cn(
          "btn-group__item",
          context?.variant && `btn-group__item--${context.variant}`,
          context?.size && `btn-group__item--${context.size}`,
          isActive && "btn-group__item--active",
          isDisabled && "btn-group__item--disabled",
          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);
ButtonGroupItem.displayName = "ButtonGroupItem";

export { ButtonGroup, ButtonGroupItem };
