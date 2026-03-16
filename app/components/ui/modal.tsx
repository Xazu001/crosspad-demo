import "./modal.style.scss";

import * as React from "react";

import { createPortal } from "react-dom";

import { Icon } from "#/components/ui/icon";
import { cn } from "#/components/utils";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────
// Modal Context
// ──────────────────────────────────────────────────────────────

interface ModalContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isClosing: boolean;
}

const ModalContext = React.createContext<ModalContextType | undefined>(undefined);

const useModalContext = () => {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error("Modal components must be used within a Modal provider");
  }
  return context;
};

// ──────────────────────────────────────────────────────────────
// Modal Component
// ──────────────────────────────────────────────────────────────

/** Modal dialog with overlay and keyboard support */
export interface ModalProps {
  children: React.ReactNode;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

const Modal = ({ children, defaultOpen = false, open, onOpenChange }: ModalProps) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const [isClosing, setIsClosing] = React.useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = React.useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === "function" ? value(internalOpen) : value;

      if (newValue === false && isOpen) {
        // Start closing animation
        setIsClosing(true);
        setTimeout(() => {
          setIsClosing(false);
          if (onOpenChange) {
            onOpenChange(false);
          } else {
            setInternalOpen(false);
          }
        }, 250); // Match CSS transition duration
      } else if (onOpenChange) {
        onOpenChange(newValue);
      } else {
        setInternalOpen(newValue);
      }
    },
    [onOpenChange, internalOpen, isOpen],
  );

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    // Handle escape key and body scroll lock
    if (isOpen && !isClosing) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else if (!isOpen && !isClosing) {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (!isClosing) {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, setIsOpen, isClosing]);

  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen, isClosing }}>
      {children}
    </ModalContext.Provider>
  );
};

// ──────────────────────────────────────────────────────────────
// Modal Trigger
// ──────────────────────────────────────────────────────────────

/** Button that opens the modal */
export interface ModalTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const ModalTrigger = React.forwardRef<HTMLDivElement, ModalTriggerProps>(
  ({ className, children, asChild = false, ...props }, ref) => {
    const { setIsOpen } = useModalContext();

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        onClick: (e: React.MouseEvent) => {
          (children.props as any).onClick?.(e);
          setIsOpen(true);
        },
        ref,
      });
    }

    return (
      <div
        className={cn("modal-trigger", className)}
        ref={ref}
        onClick={() => setIsOpen(true)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
ModalTrigger.displayName = "ModalTrigger";

// ──────────────────────────────────────────────────────────────
// Modal Content
// ──────────────────────────────────────────────────────────────

const modalContentVariants = createVariants("modal-content", {
  variants: {
    variant: {
      popover: "modal-content--popover", // Popover-style modal
      "kit-play-card": "modal-content--kit-play-card", // Kit play card style
    },
    size: {
      sm: "modal-content--sm", // Small modal
      md: "modal-content--md", // Medium modal
      lg: "modal-content--lg", // Large modal
      xl: "modal-content--xl", // Extra large modal
      full: "modal-content--full", // Full screen modal
    },
  },
  defaultVariants: {
    variant: "popover",
    size: "md",
  },
});

/** Modal content container with overlay */
export interface ModalContentProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof modalContentVariants> {}

const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    const { isOpen, setIsOpen, isClosing } = useModalContext();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);

    // Handle overlay click to close
    const handleOverlayClick = () => {
      setIsOpen(false);
    };

    if (!isOpen && !isClosing) return null;

    const content = (
      <>
        <div
          className={cn("modal-overlay", isClosing && "modal-overlay--closing")}
          onClick={handleOverlayClick}
        />

        <div className="modal-wrapper">
          <div
            className={cn(
              modalContentVariants({ variant, size, className }),
              isClosing && "modal-content--closing",
            )}
            ref={ref}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {!isClosing && <ModalClose />}
            {children}
          </div>
        </div>
      </>
    );

    if (!mounted) return null;

    return createPortal(content, document.body);
  },
);
ModalContent.displayName = "ModalContent";

// ──────────────────────────────────────────────────────────────
// Modal Close
// ──────────────────────────────────────────────────────────────

/** Button to close the modal */
export interface ModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const ModalClose = React.forwardRef<HTMLButtonElement, ModalCloseProps>(
  ({ className, children, ...props }, ref) => {
    const { setIsOpen } = useModalContext();

    return (
      <button
        className={cn("modal-close", className)}
        ref={ref}
        onClick={() => setIsOpen(false)}
        {...props}
      >
        {children || <Icon.X size="md" />}
      </button>
    );
  },
);
ModalClose.displayName = "ModalClose";

export { Modal, ModalClose, ModalContent, ModalTrigger, modalContentVariants };
