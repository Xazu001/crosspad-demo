/**
 * Suppress specific Three.js deprecation warnings that are
 * caused by React Three Fiber internals.
 *
 * This is a temporary workaround until React Three Fiber
 * updates to use THREE.Timer instead of THREE.Clock.
 */

// Suppress the THREE.Clock deprecation warning
const originalWarn = console.warn;

console.warn = (...args: any[]) => {
  // Filter out the specific THREE.Clock deprecation warning
  if (
    typeof args[0] === "string" &&
    args[0].includes("THREE.THREE.Clock: This module has been deprecated")
  ) {
    return;
  }

  // Call original warn for all other messages
  return originalWarn.apply(console, args);
};

// Export a function to restore original console.warn if needed
export const restoreConsoleWarn = () => {
  console.warn = originalWarn;
};
