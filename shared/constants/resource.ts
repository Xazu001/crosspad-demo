import { R2_URL } from "./site";

/**
 * Directory configuration for R2 storage
 */
export const R2_DIRECTORIES = {
  samples: "kits/samples",
  logos: "kits/logos",
  avatars: "avatars",
} as const;

export type R2DirectoryKey = keyof typeof R2_DIRECTORIES;

// Resource types for API (singular form)
export type ResourceType = "sample" | "logo" | "avatar";

// Map resource types to directory keys
const RESOURCE_TO_DIRECTORY: Record<ResourceType, R2DirectoryKey> = {
  sample: "samples",
  logo: "logos",
  avatar: "avatars",
};

/**
 * Get the base URL for a resource type's directory
 */
export function getResourceUrl(type: ResourceType): string {
  const directoryKey = RESOURCE_TO_DIRECTORY[type];
  const directory = R2_DIRECTORIES[directoryKey];
  return `${R2_URL}/${directory}/`;
}

/**
 * Create a full URL for a resource
 *
 * @param type - Resource type (sample, logo, avatar)
 * @param path - File path or filename
 * @returns Full URL to the resource, or fallback/default URL
 */
export function createResourceUrl(type: ResourceType, path: unknown): string {
  if (typeof path !== "string") {
    return "";
  }

  if (type === "logo" && !path) {
    return "/assets/default-kit-logo.png";
  }

  if (!path) {
    return "";
  }

  const prefix = getResourceUrl(type);
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return `${prefix}${cleanPath}`;
}
