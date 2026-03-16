import "./mobile-input-modal.style.scss";

import * as React from "react";

import { createPortal } from "react-dom";

import { cn } from "#/components/utils";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────

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
    variant: "secondary",
    size: "md",
  },
});

// ──────────────────────────────────────────────────────────────

export interface MobileInputModalProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
}

// ──────────────────────────────────────────────────────────────

/** Mobile input modal component */
export const MobileInputModal = React.forwardRef<HTMLInputElement, MobileInputModalProps>(
  ({ className, variant, size, isOpen, onClose, ...props }, ref) => {
    // Don't render on server
    if (typeof window === "undefined" || !isOpen) return null;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onClose();
      }
    };

    return createPortal(
      <div className="mobile-input-modal-background" onClick={onClose}>
        <div className="mobile-input-modal-card" onClick={(e) => e.stopPropagation()}>
          <input
            ref={ref}
            className={cn(inputVariants({ variant, size, className }))}
            onBlur={onClose}
            onKeyDown={handleKeyDown}
            autoFocus
            {...props}
          />
        </div>
      </div>,
      document.body,
    );
  },
);

MobileInputModal.displayName = "MobileInputModal";
