/**
 * Responsive size utility for UI components
 *
 * CSS-only breakpoint-based size system:
 * - breakpoint prop: { phone: "sm", tablet: "lg", desktop: "xl" }
 * - Component automatically applies correct size at each breakpoint via CSS media queries
 * - No JavaScript resize listeners needed!
 */
import { useMemo } from "react";

export type Breakpoint =
  | "phone"
  | "tablet"
  | "desktop"
  | "large-desktop"
  | "xlarge-desktop"
  | "huge";

export interface ResponsiveSizeConfig<T extends string> {
  default?: T;
  phone?: T;
  tablet?: T;
  desktop?: T;
  "large-desktop"?: T;
  "xlarge-desktop"?: T;
  huge?: T;
}

/**
 * Generate responsive CSS classes for components
 * Creates both base size class and breakpoint-specific classes
 * CSS media queries handle the responsive behavior automatically
 */
export function generateResponsiveClasses<T extends string>(
  config: ResponsiveSizeConfig<T>,
  componentName: string,
  defaultSize: T,
): string {
  const classes: string[] = [];

  // Add default/base size (always provided)
  const size = getDefaultSize(config, defaultSize);
  classes.push(`${componentName}--${size}`);

  // Add breakpoint-specific classes (higher specificity)
  if (config.phone) classes.push(`${componentName}--phone-${config.phone}`);
  if (config.tablet) classes.push(`${componentName}--tablet-${config.tablet}`);
  if (config.desktop) {
    classes.push(`${componentName}--desktop-${config.desktop}`);
  }
  if (config["large-desktop"]) {
    classes.push(`${componentName}--large-desktop-${config["large-desktop"]}`);
  }
  if (config["xlarge-desktop"]) {
    classes.push(`${componentName}--xlarge-desktop-${config["xlarge-desktop"]}`);
  }
  if (config.huge) classes.push(`${componentName}--huge-${config.huge}`);

  return classes.join(" ");
}

/**
 * Get the default size for responsive config with fallback
 * Uses provided defaultSize or falls back to sensible defaults
 */
export function getDefaultSize<T extends string>(
  config: ResponsiveSizeConfig<T>,
  defaultSize: T,
): T {
  // If no config, return default
  if (!config) return defaultSize;

  // Priority: default > phone > tablet > desktop > large-desktop > xlarge-desktop > huge
  return (
    config.default ||
    config.phone ||
    config.tablet ||
    config.desktop ||
    config["large-desktop"] ||
    config["xlarge-desktop"] ||
    config.huge ||
    defaultSize
  );
}

/**
 * Universal hook for responsive classes
 * Eliminates boilerplate in all components
 */
export function useResponsiveClasses<T extends string>(
  config: ResponsiveSizeConfig<T> | undefined,
  componentName: string,
  size: T,
): { currentSize: T; responsiveClasses: string } {
  return useMemo(() => {
    const currentSize = size;
    const responsiveClasses = config ? generateResponsiveClasses(config, componentName, size) : "";

    return { currentSize, responsiveClasses };
  }, [config, componentName, size]);
}
