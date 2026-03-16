import { Slider as MuiSlider, type SliderProps as MuiSliderProps } from "@mui/material";

import "./slider.style.scss";

import * as React from "react";

import { cn } from "#/components/utils";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────
// Slider Component
// ──────────────────────────────────────────────────────────────

/** Slider variants for different styles */
const sliderVariants = createVariants("slider", {
  variants: {
    variant: {
      primary: "slider--primary", // Default primary style
      "kit-play": "slider--kit-play", // Kit player theme
    },
    size: {
      md: "slider--md", // Medium size
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

/** Range slider component with optional value display */
export interface SliderProps
  extends Omit<MuiSliderProps, "className" | "size">, VariantProps<typeof sliderVariants> {
  /** Label for the slider */
  label?: string;
  /** Whether to show the current value */
  showValue?: boolean;
  /** Suffix to display after the value */
  valueSuffix?: string;
  className?: string;
  onChange?: (event: Event, newValue: number | number[], activeThumb: number) => void;
}

const Slider = React.forwardRef<HTMLSpanElement, SliderProps>(
  (
    {
      className,
      variant,
      size,
      label,
      showValue = false,
      valueSuffix = "",
      value,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(value || props.defaultValue || 0);

    // Use controlled value if provided, otherwise use internal state
    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = (event: Event, newValue: number | number[], activeThumb: number) => {
      if (value === undefined) {
        setInternalValue(newValue as number);
      }
      onChange?.(event, newValue, activeThumb);
    };

    return (
      <div className={cn("slider__wrapper", className)}>
        {label && (
          <label className="slider__label">
            {label}
            {showValue && (
              <span className="slider__value">
                {currentValue}
                {valueSuffix}
              </span>
            )}
          </label>
        )}
        <MuiSlider
          ref={ref}
          className={cn(sliderVariants({ variant, size }))}
          value={currentValue}
          onChange={handleChange}
          style={{
            overflow: "hidden",
            borderRadius: "1.5rem",
          }}
          {...props}
        />
      </div>
    );
  },
);

Slider.displayName = "Slider";

export { Slider, sliderVariants };
