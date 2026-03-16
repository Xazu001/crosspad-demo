/**
 * Component modifier system for extending UI components
 *
 * Allows adding boolean modifiers to components like:
 * - fullWidth: boolean
 * - noBorder: boolean
 * - uppercase: boolean
 *
 * Can be extended with generics for component-specific modifiers
 */

export type ComponentModifiers = {};

/**
 * Base interface for components that support modifiers
 */
export type ComponentWithModifiers<T = Record<string, boolean | undefined>> = T;

/**
 * Helper function to generate modifier classes
 */
export function getModifierClasses(
  modifiers: Record<string, boolean | undefined> | undefined,
  componentName: string,
): string {
  if (!modifiers) return "";

  const classes: string[] = [];

  for (const [key, value] of Object.entries(modifiers)) {
    if (value) {
      // Convert camelCase to kebab-case with BEM modifier format
      const className = `${componentName}--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      classes.push(className);
    }
  }

  return classes.join(" ");
}
