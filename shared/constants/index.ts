// Site URLs and environment configuration
export { APP_ENV, R2_URL, SITE_URL } from "./site";

// Category constants
export { DEFAULT_CATEGORIES, type CategorySeed } from "./categories";

// Kit color utilities
export { DEFAULT_KIT_COLORS, type KitColors, parseKitColors } from "./kit";

// R2 resource utilities
export {
  createResourceUrl,
  type R2DirectoryKey,
  type ResourceType,
  R2_DIRECTORIES,
  getResourceUrl,
} from "./resource";

// Featured authors from legacy project
export { FEATURED_AUTHORS, KIT_TO_AUTHOR_MAP, type FeaturedAuthor } from "./featured-authors";
