import "./split-layout.style.scss";

import * as React from "react";

import { type Breakpoint } from "#/components/uiTypes";
import { cn } from "#/components/utils";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ================================================================
// ------------------------ SPLIT LAYOUT ---------------------------
// ================================================================

const splitLayoutVariants = createVariants("split-layout", {
  variants: {
    split: {
      "50-50": "split-layout--50-50",
      "40-60": "split-layout--40-60",
      "60-40": "split-layout--60-40",
      "30-70": "split-layout--30-70",
      "70-30": "split-layout--70-30",
      "33-67": "split-layout--33-67",
      "67-33": "split-layout--67-33",
      auto: "split-layout--auto",
    },
    reverse: {
      true: "split-layout--reverse",
    },
  },
  defaultVariants: {
    split: "50-50",
  },
});

export interface SplitLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof splitLayoutVariants> {
  /**
   * Content for the left side of the split layout
   */
  left?: React.ReactNode;
  /**
   * Content for the right side of the split layout
   */
  right?: React.ReactNode;
  /**
   * Stack layout vertically on mobile
   * @default true
   */
  stackOnMobile?: boolean;
  /**
   * Minimum width for each side before stacking
   * @default "tablet"
   */
  breakpoint?: Breakpoint;
  /**
   * Center content vertically
   * @default false
   */
  centerVertically?: boolean;
  /**
   * Reverse layout order only below breakpoint
   * @default false
   */
  reverseBelowBreakpoint?: boolean;
}

const SplitLayout = React.forwardRef<HTMLDivElement, SplitLayoutProps>(
  (
    {
      className,
      split,
      reverse,
      left,
      right,
      stackOnMobile = true,
      breakpoint = "tablet" as Breakpoint,
      centerVertically = false,
      reverseBelowBreakpoint = false,
      children,
      ...props
    },
    ref,
  ) => {
    // If left and right are provided, use them as children
    if (left && right) {
      children = (
        <>
          <SplitLayoutSide>{left}</SplitLayoutSide>
          <SplitLayoutSide>{right}</SplitLayoutSide>
        </>
      );
    }

    return (
      <SplitLayoutProvider
        split={split}
        reverse={reverse}
        stackOnMobile={stackOnMobile}
        breakpoint={breakpoint}
        centerVertically={centerVertically}
        reverseBelowBreakpoint={reverseBelowBreakpoint}
      >
        <div
          ref={ref}
          className={cn(splitLayoutVariants({ split, reverse }), className)}
          data-split={split}
          data-reverse={reverse}
          data-center-vertical={centerVertically}
          data-breakpoint={breakpoint}
          data-reverse-below-breakpoint={reverseBelowBreakpoint}
          {...props}
        >
          {children}
        </div>
      </SplitLayoutProvider>
    );
  },
);
SplitLayout.displayName = "SplitLayout";

// ================================================================
// ----------------------- CONTEXT PROVIDER -----------------------
// ================================================================

interface SplitLayoutContextValue {
  split?: VariantProps<typeof splitLayoutVariants>["split"];
  reverse?: VariantProps<typeof splitLayoutVariants>["reverse"];
  stackOnMobile?: boolean;
  breakpoint?: Breakpoint;
  centerVertically?: boolean;
  reverseBelowBreakpoint?: boolean;
}

const SplitLayoutContext = React.createContext<SplitLayoutContextValue>({});

interface SplitLayoutProviderProps {
  children: React.ReactNode;
  split?: VariantProps<typeof splitLayoutVariants>["split"];
  reverse?: VariantProps<typeof splitLayoutVariants>["reverse"];
  stackOnMobile?: boolean;
  breakpoint?: Breakpoint;
  centerVertically?: boolean;
  reverseBelowBreakpoint?: boolean;
}

const SplitLayoutProvider: React.FC<SplitLayoutProviderProps> = ({
  children,
  split,
  reverse,
  stackOnMobile,
  breakpoint,
  centerVertically,
  reverseBelowBreakpoint,
}) => {
  const contextValue: SplitLayoutContextValue = {
    split,
    reverse,
    stackOnMobile,
    breakpoint,
    centerVertically,
    reverseBelowBreakpoint,
  };

  return <SplitLayoutContext.Provider value={contextValue}>{children}</SplitLayoutContext.Provider>;
};

// ================================================================
// -------------------------- SIDE --------------------------------
// ================================================================

export interface SplitLayoutSideProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Which side this element represents
   * @default "left"
   */
  side?: "left" | "right";
  /**
   * Make this side scrollable
   * @default false
   */
  scrollable?: boolean;
  /**
   * Center content within this side
   * @default false
   */
  centerContent?: boolean;
}

const SplitLayoutSide = React.forwardRef<HTMLDivElement, SplitLayoutSideProps>(
  ({ className, side = "left", scrollable = false, centerContent = false, ...props }, ref) => {
    const context = React.useContext(SplitLayoutContext);

    return (
      <div
        ref={ref}
        className={cn(
          "split-layout__side",
          `split-layout__side--${side}`,
          scrollable && "split-layout__side--scrollable",
          centerContent && "split-layout__side--center",
          className,
        )}
        data-side={side}
        data-scrollable={scrollable}
        data-center={centerContent}
        {...props}
      />
    );
  },
);
SplitLayoutSide.displayName = "SplitLayoutSide";

// ================================================================
// -------------------------- EXPORTS -----------------------------
// ================================================================

export { SplitLayout, SplitLayoutSide, splitLayoutVariants };
export type { SplitLayoutContextValue };
