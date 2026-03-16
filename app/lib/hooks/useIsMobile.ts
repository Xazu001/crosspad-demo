import { useEffect, useState } from "react";

// Breakpoint values in pixels
const breakpoints = {
  phone: 480,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
  xlargeDesktop: 1720,
  huge: 1920,
} as const;

type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to check if the screen width is below a specific breakpoint.
 * Uses matchMedia API to respond to window resize events.
 *
 * @param breakpoint - The breakpoint to check against (default: "tablet")
 * @returns boolean indicating if screen is below the breakpoint
 *
 * @example
 * ```tsx
 * const isMobile = useBreakpoint("tablet");
 * if (isMobile) {
 *   // Show mobile layout
 * }
 * ```
 */
export function useBreakpoint(breakpoint: Breakpoint = "tablet"): boolean {
  const [isBelowBreakpoint, setIsBelowBreakpoint] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoints[breakpoint] - 1}px)`);

    setIsBelowBreakpoint(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsBelowBreakpoint(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [breakpoint]);

  return isBelowBreakpoint;
}

// Keep backward compatibility
export const useIsMobile = useBreakpoint;
