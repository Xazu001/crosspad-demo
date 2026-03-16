/**
 * Category data for seeding (without auto-generated fields)
 */
export type CategorySeed = {
  category_name: string;
  category_description: string;
};

/**
 * Default categories for kits
 */
export const DEFAULT_CATEGORIES: CategorySeed[] = [
  {
    category_name: "Winter",
    category_description: "Winter themed drum kits and samples",
  },
  {
    category_name: "Spring",
    category_description: "Spring themed drum kits and samples",
  },
  {
    category_name: "Summer",
    category_description: "Summer themed drum kits and samples",
  },
  {
    category_name: "Autumn",
    category_description: "Autumn themed drum kits and samples",
  },
  {
    category_name: "Chill",
    category_description: "Relaxing drum kits and samples for chill vibes",
  },
  {
    category_name: "Jazz",
    category_description: "Jazz brush sticks and classic kits",
  },
  {
    category_name: "Lo-fi",
    category_description: "Chill lo-fi hip hop drums",
  },
] as const;

export type CategoryName = (typeof DEFAULT_CATEGORIES)[number]["category_name"];
