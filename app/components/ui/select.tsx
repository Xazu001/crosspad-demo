import "./select.style.scss";

import * as React from "react";

import { Icon } from "#/components/ui/icon";
import { cn } from "#/components/utils";
import { useResponsiveClasses } from "#/components/utils/responsive-size";
import { type VariantProps, createVariants } from "#/components/utils/variants";
import { useDropdownKeyNav } from "#/lib/hooks/useDropdownKeyNav";

// ──────────────────────────────────────────────────────────────
// Select Context
// ──────────────────────────────────────────────────────────────

type SelectTriggerVariant =
  | "secondary"
  | "card"
  | "outline"
  | "outline-card"
  | "outline-background"
  | "outline-secondary"
  | "outline-popover"
  | "glass"
  | "glass-card"
  | "glass-secondary";

type SelectContentVariant = "popover" | "card" | "secondary" | "outline";

type SelectSize = "sm" | "md" | "lg";

interface SelectContextType {
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  multiple?: boolean;
  itemLabels?: Map<string, string>;
  registerItemLabel?: (value: string, label: string) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  variant?: SelectTriggerVariant | null;
  contentVariant?: SelectContentVariant | null;
  labels?: Record<string, string>;
  size?: SelectSize | null;
  itemsSize?: SelectSize | null;
  direction?: "up" | "down";
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select provider");
  }
  return context;
};

// ──────────────────────────────────────────────────────────────
// Select Component
// ──────────────────────────────────────────────────────────────

/** Dropdown select component with single/multiple selection */
export interface SelectProps {
  children: React.ReactNode;
  /** Current selected value(s) */
  value?: string | string[];
  /** Callback when value changes */
  onValueChange?: (value: string | string[]) => void;
  /** Initial value when uncontrolled */
  defaultValue?: string | string[];
  /** Optional map of values to labels for pre-population */
  labels?: Record<string, string>;
  /** Enable multiple selection */
  multiple?: boolean;
  /** Trigger variant - cascades to SelectTrigger */
  variant?: SelectTriggerVariant;
  /** Override content variant - cascades to SelectContent */
  contentVariant?: SelectContentVariant;
  /** Size - cascades to SelectTrigger */
  size?: SelectSize;
  /** Items size - cascades to SelectItem */
  itemsSize?: SelectSize;
  /** Dropdown direction */
  direction?: "up" | "down";
}

const Select = ({
  children,
  value,
  onValueChange,
  defaultValue,
  labels,
  multiple = false,
  variant,
  contentVariant,
  size,
  itemsSize,
  direction = "down",
}: SelectProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [isOpen, setIsOpen] = React.useState(false);
  const [itemLabels, setItemLabels] = React.useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    if (labels) {
      Object.entries(labels).forEach(([val, label]) => map.set(val, label));
    }
    return map;
  });
  const triggerRef = React.useRef<HTMLElement>(null);
  const currentValue = value ?? internalValue;

  // Update labels if props change
  React.useEffect(() => {
    if (labels) {
      setItemLabels((prev) => {
        const next = new Map(prev);
        Object.entries(labels).forEach(([val, label]) => next.set(val, label));
        return next;
      });
    }
  }, [labels]);

  const registerItemLabel = React.useCallback((value: string, label: string) => {
    setItemLabels((prev) => new Map(prev).set(value, label));
  }, []);

  const handleValueChange = React.useCallback(
    (newValue: string | string[]) => {
      const value = Array.isArray(newValue) ? newValue[0] : newValue;
      if (!value) return;
      if (multiple) {
        const currentValues = Array.isArray(currentValue) ? currentValue : [];
        const isAlreadySelected = currentValues.includes(value);

        let newValues: string[];
        if (isAlreadySelected) {
          newValues = currentValues.filter((v) => v !== value);
        } else {
          newValues = [...currentValues, value];
        }

        if (onValueChange) {
          onValueChange(newValues);
        } else {
          setInternalValue(newValues);
        }
      } else {
        if (onValueChange) {
          onValueChange(value);
        } else {
          setInternalValue(value);
        }
        setIsOpen(false);
      }
    },
    [onValueChange, currentValue, multiple],
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".select-container")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        isOpen,
        setIsOpen,
        multiple,
        itemLabels,
        registerItemLabel,
        triggerRef,
        variant,
        contentVariant,
        labels,
        size,
        itemsSize,
        direction,
      }}
    >
      <div className="select-container">{children}</div>
    </SelectContext.Provider>
  );
};

// ──────────────────────────────────────────────────────────────
// Select Trigger
// ──────────────────────────────────────────────────────────────

const selectTriggerVariants = createVariants("select-trigger", {
  variants: {
    variant: {
      secondary: "select-trigger--secondary",
      card: "select-trigger--card",
      outline: "select-trigger--outline",
      "outline-card": "select-trigger--outline-card",
      "outline-background": "select-trigger--outline-background",
      "outline-secondary": "select-trigger--outline-secondary",
      "outline-popover": "select-trigger--outline-popover",
      glass: "select-trigger--glass",
      "glass-card": "select-trigger--glass-card",
      "glass-secondary": "select-trigger--glass-secondary",
    },
    size: {
      sm: "select-trigger--sm",
      md: "select-trigger--md",
      lg: "select-trigger--lg",
    },
  },
  defaultVariants: {
    variant: "card",
    size: "md",
  },
});

/** Button that opens the select dropdown */
export interface SelectTriggerProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof selectTriggerVariants> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, variant, size, children, ...props }, forwardedRef) => {
    const ctx = useSelectContext();
    const resolvedVariant = variant ?? ctx.variant;
    const resolvedSize = size ?? ctx.size;

    // Universal responsive classes hook - eliminates boilerplate
    const { currentSize, responsiveClasses } = useResponsiveClasses(
      undefined, // Select doesn't use responsiveSize prop
      "select-trigger",
      resolvedSize || "md",
    );

    const mergedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
        (ctx.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      },
      [forwardedRef, ctx.triggerRef],
    );

    // Map trigger size to icon size
    const getIconSize = (triggerSize?: string | null): "sm" | "md" | "lg" => {
      switch (triggerSize) {
        case "sm":
          return "sm";
        case "md":
          return "md";
        case "lg":
          return "lg";
        default:
          return "lg";
      }
    };

    return (
      <button
        ref={mergedRef}
        type="button"
        className={cn(
          selectTriggerVariants({
            variant: resolvedVariant,
            size: resolvedSize,
            className,
          }),
        )}
        onClick={() => ctx.setIsOpen(!ctx.isOpen)}
        aria-expanded={ctx.isOpen}
        aria-haspopup="listbox"
        {...props}
      >
        {children}
        <Icon.ChevronDown
          size={getIconSize(resolvedSize)}
          className={cn("select-trigger__icon", ctx.isOpen && "select-trigger__icon--open")}
        />
      </button>
    );
  },
);
SelectTrigger.displayName = "SelectTrigger";

// ──────────────────────────────────────────────────────────────
// Select Value
// ──────────────────────────────────────────────────────────────

/** Displays the current selected value */
export interface SelectValueProps {
  /** Text to show when no value is selected */
  placeholder?: string;
  /** Whether to show the raw value as fallback if no label is found */
  showValueAsFallback?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const SelectValue = ({
  placeholder = "Select an option",
  showValueAsFallback = true,
  className,
  children,
}: SelectValueProps) => {
  const { value, multiple, itemLabels, labels } = useSelectContext();

  // Format display value based on selection state
  const getDisplayValue = () => {
    if (children) return children;
    if (!value) return placeholder;

    const resolveLabel = (val: string) => {
      // Prioritize labels passed via prop
      const propLabel = labels?.[val];
      if (propLabel) return propLabel;

      // Fallback to labels registered by SelectItem
      const registeredLabel = itemLabels?.get(val);
      if (registeredLabel) return registeredLabel;

      return showValueAsFallback ? val : placeholder;
    };

    if (multiple) {
      const values = Array.isArray(value) ? value : [value];
      if (values.length === 0) return placeholder;
      if (values.length === 1) {
        return resolveLabel(values[0]);
      }
      return `${values.length} selected`;
    }

    const singleValue = Array.isArray(value) ? value[0] : value;
    return resolveLabel(singleValue);
  };

  return <span className={cn("select-trigger__value", className)}>{getDisplayValue()}</span>;
};

// ──────────────────────────────────────────────────────────────
// Select Content
// ──────────────────────────────────────────────────────────────

const selectContentVariants = createVariants("select-content", {
  variants: {
    variant: {
      popover: "select-content--popover",
      card: "select-content--card",
      secondary: "select-content--secondary",
      outline: "select-content--outline",
    },
  },
  defaultVariants: {
    variant: "popover",
  },
});

export interface SelectContentProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof selectContentVariants> {}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, variant, children, ...props }, ref) => {
    const ctx = useSelectContext();
    const resolvedVariant = variant ?? ctx.contentVariant;

    const [shouldDisplayUpward, setShouldDisplayUpward] = React.useState(false);
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (!ctx.isOpen) return;

      const updatePosition = () => {
        const content = contentRef.current;

        if (content) {
          // If direction is explicitly set, use it
          if (ctx.direction) {
            setShouldDisplayUpward(ctx.direction === "up");
            return;
          }

          const container = content.closest(".select-container");
          const trigger = container?.querySelector(".select-trigger") as HTMLElement;

          if (trigger) {
            const triggerRect = trigger.getBoundingClientRect();
            const contentHeight = content.offsetHeight;
            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const spaceAbove = triggerRect.top;

            if (spaceBelow < contentHeight && spaceAbove > contentHeight) {
              setShouldDisplayUpward(true);
            } else {
              setShouldDisplayUpward(false);
            }
          }
        }
      };

      updatePosition();

      window.addEventListener("resize", updatePosition);
      return () => window.removeEventListener("resize", updatePosition);
    }, [ctx.isOpen]);

    const handleClose = React.useCallback(() => ctx.setIsOpen(false), [ctx.setIsOpen]);

    useDropdownKeyNav({
      contentRef,
      triggerRef: ctx.triggerRef,
      isOpen: ctx.isOpen,
      onClose: handleClose,
    });

    if (!ctx.isOpen) return null;

    return (
      <div
        ref={contentRef}
        className={cn(
          selectContentVariants({ variant: resolvedVariant }),
          shouldDisplayUpward && "select-content--upward",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <div className="select-content__viewport">{children}</div>
      </div>
    );
  },
);
SelectContent.displayName = "SelectContent";

// ──────────────────────────────────────────────────────────────
// Select Group
// ──────────────────────────────────────────────────────────────

/** Groups related select items together */
export interface SelectGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectGroup = React.forwardRef<HTMLDivElement, SelectGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("select-group", className)} role="group" {...props}>
        {children}
      </div>
    );
  },
);
SelectGroup.displayName = "SelectGroup";

// ──────────────────────────────────────────────────────────────
// Select Item
// ──────────────────────────────────────────────────────────────

const selectItemVariants = createVariants("select-item", {
  variants: {
    size: {
      sm: "select-item--sm",
      md: "select-item--md",
      lg: "select-item--lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

/** Individual selectable option in the dropdown */
export interface SelectItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof selectItemVariants> {
  /** Value of the option */
  value: string;
}

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, size, children, value, ...props }, ref) => {
    const {
      value: selectedValue,
      onValueChange,
      multiple,
      registerItemLabel,
      itemsSize,
    } = useSelectContext();
    const resolvedSize = size ?? itemsSize ?? "md";

    const isSelected = multiple
      ? Array.isArray(selectedValue) && selectedValue.includes(value)
      : value === selectedValue;

    const handleClick = () => {
      onValueChange?.(value);
    };

    // Register the item label when the component mounts or children change
    React.useEffect(() => {
      if (registerItemLabel) {
        const label = typeof children === "string" ? children : String(children);
        registerItemLabel(value, label);
      }
    }, [value, children, registerItemLabel]);

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          selectItemVariants({ size: resolvedSize }),
          isSelected && "select-item--selected",
          multiple && "select-item--multiple",
          className,
        )}
        onClick={handleClick}
        role="option"
        aria-selected={isSelected}
        {...props}
      >
        <span className="select-item__text">{children}</span>
        {multiple ? (
          <div
            className={cn("select-item__checkbox", isSelected && "select-item__checkbox--checked")}
          >
            {isSelected && <Icon.Check size="sm" />}
          </div>
        ) : (
          isSelected && <Icon.Check size="sm" className="select-item__check" />
        )}
      </button>
    );
  },
);
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  selectContentVariants,
  selectItemVariants,
  selectTriggerVariants,
};
