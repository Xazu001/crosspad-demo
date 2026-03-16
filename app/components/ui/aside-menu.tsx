import "./aside-menu.style.scss";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as React from "react";

import { Icon } from "#/components/ui/icon";
import { cn } from "#/components/utils";
import { type VariantProps, createVariants } from "#/components/utils/variants";

import { Button } from "./button";

// ──────────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────────

interface AsideMenuContextValue {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

const AsideMenuContext = createContext<AsideMenuContextValue | null>(null);

function useAsideMenu() {
  const ctx = useContext(AsideMenuContext);
  if (!ctx) {
    throw new Error("useAsideMenu must be used within an <AsideMenu>");
  }
  return ctx;
}

// ──────────────────────────────────────────────────────────────
// Root (context provider only, renders children transparently)
// ──────────────────────────────────────────────────────────────

export interface AsideMenuProps {
  children: React.ReactNode;
}

function AsideMenu({ children }: AsideMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = useCallback(() => setIsOpen(true), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((v) => !v), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AsideMenuContext.Provider value={{ isOpen, openMenu, closeMenu, toggleMenu }}>
      {children}
    </AsideMenuContext.Provider>
  );
}

// ──────────────────────────────────────────────────────────────
// Panel (the sliding drawer with overlay)
// ──────────────────────────────────────────────────────────────

type AsideMenuVariant = "glass-popover" | "popover";

const asideMenuPanelVariants = createVariants("aside-menu", {
  variants: {
    variant: {
      "glass-popover": "aside-menu--glass-popover",
      popover: "aside-menu--popover",
    },
  },
  defaultVariants: {
    variant: "glass-popover",
  },
});

export interface AsideMenuPanelProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof asideMenuPanelVariants> {
  /** Hide panel and overlay above this breakpoint */
  hideAbove?: "tablet" | "desktop";
}

function AsideMenuPanel({
  className,
  variant,
  hideAbove = "tablet",
  children,
  ...props
}: AsideMenuPanelProps) {
  const { isOpen, closeMenu } = useAsideMenu();

  const hideClass = `aside-menu--hide-${hideAbove}`;
  const overlayHideClass = `aside-menu__overlay--hide-${hideAbove}`;

  return (
    <>
      <div
        className={cn("aside-menu__overlay", overlayHideClass)}
        data-state={isOpen ? "open" : "closed"}
        onClick={closeMenu}
      />
      <div
        className={cn(asideMenuPanelVariants({ variant, className }), hideClass)}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        <div className="aside-menu__header">
          <Button
            variant="ghost"
            size="md"
            aspectSquare
            onClick={closeMenu}
            modifiers={{
              noPaddingInline: true,
            }}
          >
            <Icon.X size="sm" />
          </Button>
        </div>
        {children}
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Trigger
// ──────────────────────────────────────────────────────────────

export interface AsideMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

function AsideMenuTrigger({
  className,
  children,
  asChild = false,
  ...props
}: AsideMenuTriggerProps) {
  const { toggleMenu } = useAsideMenu();

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as Record<string, any>;
    return React.cloneElement(children as React.ReactElement<any>, {
      ...childProps,
      className: cn("aside-menu-trigger", className, childProps.className),
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        toggleMenu();
        childProps.onClick?.(e);
      },
      ...props,
    });
  }

  return (
    <button className={cn("aside-menu-trigger", className)} onClick={toggleMenu} {...props}>
      {children}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Item
// ──────────────────────────────────────────────────────────────

export interface AsideMenuItemProps extends React.HTMLAttributes<HTMLElement> {
  isActive?: boolean;
  asChild?: boolean;
}

function AsideMenuItem({
  className,
  isActive,
  children,
  asChild = false,
  onClick,
  ...props
}: AsideMenuItemProps) {
  const { closeMenu } = useAsideMenu();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    onClick?.(e);
    closeMenu();
  };

  const itemClass = cn("aside-menu__item", isActive && "aside-menu__item--active", className);

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as Record<string, any>;
    return React.cloneElement(children as React.ReactElement<any>, {
      ...childProps,
      className: cn(itemClass, childProps.className),
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        childProps.onClick?.(e);
        handleClick(e);
      },
    });
  }

  return (
    <button
      className={itemClass}
      onClick={handleClick}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Content (custom non-item content area)
// ──────────────────────────────────────────────────────────────

export interface AsideMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function AsideMenuContent({ className, children, ...props }: AsideMenuContentProps) {
  return (
    <div className={cn("aside-menu__content", className)} {...props}>
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Footer
// ──────────────────────────────────────────────────────────────

export interface AsideMenuFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function AsideMenuFooter({ className, children, ...props }: AsideMenuFooterProps) {
  return (
    <div className={cn("aside-menu__footer", className)} {...props}>
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────

export {
  AsideMenu,
  AsideMenuContent,
  AsideMenuFooter,
  AsideMenuItem,
  AsideMenuPanel,
  AsideMenuTrigger,
  asideMenuPanelVariants,
  useAsideMenu,
};
