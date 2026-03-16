import "./menubar.style.scss";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { cn } from "#/components/utils";
import { type VariantProps, createVariants } from "#/components/utils/variants";
import { useDropdownKeyNav } from "#/lib/hooks/useDropdownKeyNav";

// ──────────────────────────────────────────────────────────────
// Menubar Context
// ──────────────────────────────────────────────────────────────

interface MenubarContextValue {
  close: () => void;
}

const MenubarContext = React.createContext<MenubarContextValue | null>(null);

// ──────────────────────────────────────────────────────────────
// Menubar
// ──────────────────────────────────────────────────────────────

type MenubarVariant = "popover" | "card" | "secondary";

const menubarVariants = createVariants("menubar", {
  variants: {
    variant: {
      popover: "menubar--popover",
      secondary: "menubar--secondary",
      card: "menubar--card",
    },
    size: {
      sm: "menubar--sm",
      md: "menubar--md",
      lg: "menubar--lg",
    },
    direction: {
      row: "menubar--row",
      col: "menubar--col",
    },
  },
  defaultVariants: {
    variant: "popover",
    size: "md",
    direction: "col",
  },
});

const menubarContentVariantMap: Record<MenubarVariant, string> = {
  popover: "menubar__content--popover",
  card: "menubar__content--card",
  secondary: "menubar__content--secondary",
};

export interface MenubarProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof menubarVariants> {
  trigger: React.ReactNode;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /** Override content variant (defaults to same as variant) */
  contentVariant?: MenubarVariant;
}

function Menubar({
  className,
  variant = "popover",
  size,
  direction,
  trigger,
  children,
  align = "start",
  sideOffset = 8,
  contentVariant,
  ...props
}: MenubarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const resolvedContentVariant = contentVariant ?? variant ?? "popover";

  const handleClose = useCallback(() => setIsOpen(false), []);

  useDropdownKeyNav({
    contentRef,
    triggerRef,
    isOpen,
    onClose: handleClose,
  });

  const updatePosition = useCallback(() => {
    const t = triggerRef.current;
    const c = contentRef.current;
    if (!t || !c) return;

    const tr = t.getBoundingClientRect();
    const cr = c.getBoundingClientRect();

    let left = tr.left;
    if (align === "center") {
      left = tr.left + tr.width / 2 - cr.width / 2;
    } else if (align === "end") {
      left = tr.right - cr.width;
    }

    setPosition({
      top: tr.bottom + sideOffset,
      left: Math.max(8, Math.min(left, window.innerWidth - cr.width - 8)),
    });
  }, [align, sideOffset]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't close if clicking inside menubar content or trigger
      if (contentRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      // Don't close if clicking inside a modal (portaled to body, so not in contentRef)
      // Check for modal overlay, wrapper, or content elements
      if (
        target instanceof Element &&
        target.closest(".modal-overlay, .modal-wrapper, .modal-content")
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div className={cn(menubarVariants({ variant, size, direction, className }))} {...props}>
      <div
        ref={triggerRef}
        className="menubar__trigger"
        tabIndex={-1}
        data-state={isOpen ? "open" : "closed"}
        onClick={() => setIsOpen((v) => !v)}
      >
        {trigger}
      </div>
      {isMounted &&
        createPortal(
          <MenubarContext.Provider value={{ close: handleClose }}>
            <div
              ref={contentRef}
              className={cn(
                "menubar__content",
                menubarContentVariantMap[resolvedContentVariant],
                !isOpen && "menubar__content--hidden",
              )}
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                zIndex: 9999,
              }}
              onClick={(e) => {
                // Only close if clicking the content container itself, not children
                if (e.target === e.currentTarget) {
                  setIsOpen(false);
                }
              }}
            >
              {children}
            </div>
          </MenubarContext.Provider>,
          document.body,
        )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Menubar Item
// ──────────────────────────────────────────────────────────────

export interface MenubarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  /** Whether to close the menubar when item is clicked. Default: true */
  closeOnClick?: boolean;
}

function MenubarItem({
  className,
  children,
  asChild = false,
  closeOnClick = true,
  onClick,
  onKeyDown,
  ...props
}: MenubarItemProps) {
  const context = React.useContext(MenubarContext);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnClick && context) {
      context.close();
    }
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      (e.target as HTMLElement).click();
    }
    onKeyDown?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as Record<string, any>;
    return React.cloneElement(children as React.ReactElement<any>, {
      ...childProps,
      className: cn("menubar__item", className, childProps.className),
      tabIndex: childProps.tabIndex ?? 0,
      onClick: handleClick,
    });
  }

  return (
    <div
      className={cn("menubar__item", className)}
      role="menuitem"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Menubar Separator
// ──────────────────────────────────────────────────────────────

function MenubarSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("menubar__separator", className)} {...props} />;
}

// ──────────────────────────────────────────────────────────────
// Menubar Label
// ──────────────────────────────────────────────────────────────

function MenubarLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("menubar__label", className)} {...props} />;
}

// ──────────────────────────────────────────────────────────────
// Menubar Shortcut
// ──────────────────────────────────────────────────────────────

function MenubarShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("menubar__shortcut", className)} {...props} />;
}

// ──────────────────────────────────────────────────────────────
// Menubar Group
// ──────────────────────────────────────────────────────────────

function MenubarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("menubar__group", className)} {...props} />;
}

export {
  Menubar,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarShortcut,
  menubarVariants,
};
