/**
 * Kit color scheme type definition
 *
 * Defines the color palette used for kit player interface customization.
 * All colors are optional and will fall back to defaults if not provided.
 */
export type KitColors = {
  main?: string;
  mainHover?: string;
  mainForeground?: string;
  border?: string;
  card?: string;
  cardBorder?: string;
  background?: string;
  foreground?: string;
};

const mainColor = "#96DE2C";

/**
 * Default color scheme for kits
 */
export const DEFAULT_KIT_COLORS: KitColors = {
  main: mainColor,
  mainHover: `${mainColor}d9`, // Slightly darker hover state
  mainForeground: "#000",
  border: "transparent",
  card: "#171A26",
  cardBorder: "#40434F",
  background: "#0F111B",
  foreground: "#efefef",
};

/**
 * Parse kit colors from JSON string to KitColors object
 *
 * @param colorsString - JSON string from database or null/undefined
 * @returns KitColors object with defaults for missing values
 */
export function parseKitColors(colorsString: unknown): KitColors {
  if (!colorsString || typeof colorsString !== "string") {
    return {};
  }

  try {
    const parsed = JSON.parse(colorsString) as Partial<KitColors>;

    return {
      main: parsed.main,
      mainHover: parsed.mainHover,
      mainForeground: parsed.mainForeground,
      border: parsed.border,
      card: parsed.card,
      cardBorder: parsed.cardBorder,
      background: parsed.background,
      foreground: parsed.foreground,
    };
  } catch (error) {
    console.error("Failed to parse kit colors:", error);
    return {};
  }
}
