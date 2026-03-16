import "./input.style.scss";

import * as React from "react";

import { Icon } from "#/components/ui/icon";
import { cn } from "#/components/utils";
import {
  type ResponsiveSizeConfig,
  useResponsiveClasses,
} from "#/components/utils/responsive-size";
import { type VariantProps, createVariants } from "#/components/utils/variants";
import { useBreakpoint } from "#/lib/hooks/useIsMobile";

import { MobileInputModal } from "./mobile-input-modal";

// ================================================================
// -------------------------- INPUT -------------------------------
// ================================================================

const inputVariants = createVariants("input", {
  variants: {
    variant: {
      secondary: "input--secondary",
      card: "input--card",
      outline: "input--outline",
      "outline-card": "input--outline-card",
      "outline-background": "input--outline-background",
      "outline-secondary": "input--outline-secondary",
      "outline-popover": "input--outline-popover",
      glass: "input--glass",
      "glass-card": "input--glass-card",
      "glass-secondary": "input--glass-secondary",
      ghost: "input--ghost",
      clean: "input--clean",
    },
    size: {
      sm: "input--sm",
      md: "input--md",
      lg: "input--lg",
    },
  },
  defaultVariants: {
    variant: "card",
    size: "md",
  },
});

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  showPasswordToggle?: boolean;
  displayModalOnMobile?: boolean;
  responsiveSize?: ResponsiveSizeConfig<"sm" | "md" | "lg">;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      responsiveSize,
      type,
      showPasswordToggle,
      displayModalOnMobile,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    const isMobile = useBreakpoint("tablet");
    const modalInputRef = React.useRef<HTMLInputElement>(null);

    // Universal responsive classes hook - eliminates boilerplate
    const { currentSize, responsiveClasses } = useResponsiveClasses(
      responsiveSize,
      "input",
      size || "md",
    );

    const handleOpenModal = () => {
      console.log(
        "handleOpenModal - displayModalOnMobile:",
        displayModalOnMobile,
        "isMobile:",
        isMobile,
        "isModalOpen:",
        isModalOpen,
      );
      if (displayModalOnMobile && isMobile) {
        console.log("Setting isModalOpen to true");
        setIsModalOpen(true);
        // Focus modal input after it's rendered
        setTimeout(() => {
          modalInputRef.current?.focus();
        }, 50);
      }
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
    };

    // Render modal if open on mobile
    if (displayModalOnMobile && isMobile && isModalOpen) {
      return (
        <MobileInputModal
          ref={modalInputRef}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          variant={variant}
          size={currentSize}
          className={className}
          type={type}
          value={props.value}
          onChange={props.onChange}
          placeholder={props.placeholder}
          min={props.min}
          max={props.max}
        />
      );
    }

    if (isPassword && showPasswordToggle) {
      return (
        <div className="input__wrapper">
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant, size: currentSize, className }),
              responsiveClasses,
            )}
            ref={ref}
            onFocus={handleOpenModal}
            onClick={handleOpenModal}
            {...props}
          />
          <button
            type="button"
            className="input__toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <Icon.EyeOff className="input__toggle-icon" />
            ) : (
              <Icon.Eye className="input__toggle-icon" />
            )}
          </button>
        </div>
      );
    }

    return (
      <input
        type={inputType}
        className={cn(inputVariants({ variant, size: currentSize }), responsiveClasses, className)}
        ref={ref}
        onFocus={handleOpenModal}
        onClick={handleOpenModal}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
