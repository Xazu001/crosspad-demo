// ──────────────────────────────────────────────────────────────
// Cache Utilities
// ──────────────────────────────────────────────────────────────
import type { CacheManager } from "./manager";

// ──────────────────────────────────────────────────────────────
// Simple Cache Functions
// ──────────────────────────────────────────────────────────────

/**
 * Get value from cache or compute and cache it.
 *
 * @param cache - CacheManager instance
 * @param key - Cache key
 * @param factory - Function to compute value if not cached
 * @param ttl - Optional TTL override
 * @returns Cached or computed value
 */
export async function cached<T>(
  cache: CacheManager | null | undefined,
  key: string,
  factory: () => Promise<T>,
  ttl?: number,
): Promise<T | null> {
  if (!cache) return factory();

  return cache.getOrSet(key, factory, ttl);
}

/**
 * Get multiple values from cache or compute missing ones.
 *
 * @param cache - CacheManager instance
 * @param entries - Array of { key, factory } objects
 * @param defaultTtl - Default TTL for all entries
 * @returns Object with keys and their values
 */
export async function cachedBatch<T extends Record<string, unknown>>(
  cache: CacheManager | null | undefined,
  entries: {
    [K in keyof T]: { key: string; factory: () => Promise<T[K]>; ttl?: number };
  },
  defaultTtl?: number,
): Promise<T> {
  const result = {} as T;

  await Promise.all(
    Object.entries(entries).map(async ([propKey, entry]) => {
      const value = await cached(cache, entry.key, entry.factory, entry.ttl ?? defaultTtl);
      (result as Record<string, unknown>)[propKey] = value;
    }),
  );

  return result;
}

/**
 * Cache with automatic invalidation based on a version key.
 *
 * @param cache - CacheManager instance
 * @param versionKey - Key to track cache version
 * @param dataKey - Key for actual data
 * @param factory - Function to compute value
 * @param ttl - TTL for data cache
 * @returns Cached or computed value
 */
export async function cachedWithVersion<T>(
  cache: CacheManager | null | undefined,
  versionKey: string,
  dataKey: string,
  factory: () => Promise<T>,
  ttl?: number,
): Promise<T | null> {
  if (!cache) return factory();

  const version = await cache.get<string>(versionKey);
  const fullKey = `${dataKey}:${version || "v1"}`;

  return cache.getOrSet(fullKey, factory, ttl);
}

/**
 * Invalidate cache by incrementing version.
 *
 * @param cache - CacheManager instance
 * @param versionKey - Version key to increment
 */
export async function invalidateCacheVersion(
  cache: CacheManager | null | undefined,
  versionKey: string,
): Promise<void> {
  if (!cache) return;

  const current = await cache.get<string>(versionKey);
  const version = current ? parseInt(current, 10) + 1 : 1;
  await cache.set(versionKey, version.toString());
}

// ──────────────────────────────────────────────────────────────
// SimpleCache Wrapper
// ──────────────────────────────────────────────────────────────

/**
 * Simple cache wrapper with minimal boilerplate.
 */
export class SimpleCache {
  constructor(private cacheManager: CacheManager | null | undefined) {}

  /**
   * Cache or fetch data with minimal code.
   *
   * @example
   * ```typescript
   * const cache = new SimpleCache(context.services.base.cache);
   * const kits = await cache.getOrSet("kit", "home:kits", () => fetchKits(), 600);
   * ```
   */
  async getOrSet<T>(
    prefix: string,
    key: string,
    factory: () => Promise<T>,
    ttl: number = 120,
  ): Promise<T | null> {
    const fullKey = `${prefix}:${key}`;
    return cached(this.cacheManager, fullKey, factory, ttl);
  }

  /**
   * Get a value from cache.
   */
  async get<T>(prefix: string, key: string): Promise<T | null> {
    const fullKey = `${prefix}:${key}`;
    return this.cacheManager?.get<T>(fullKey) ?? null;
  }

  /**
   * Set a value in cache.
   */
  async set<T>(prefix: string, key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = `${prefix}:${key}`;
    await this.cacheManager?.set(fullKey, value, ttl);
  }

  /**
   * Delete a value from cache.
   */
  async delete(prefix: string, key: string): Promise<void> {
    const fullKey = `${prefix}:${key}`;
    await this.cacheManager?.delete(fullKey);
  }

  /**
   * Clear cache by prefix (requires listing keys).
   * Note: This is less efficient than region-based clearing.
   */
  async clear(prefix: string): Promise<number> {
    // Since we don't have regions, we can't efficiently clear by prefix
    // This would require listing all keys with the prefix
    // For now, just return 0 (no-op)
    console.warn("[SimpleCache] clear() not implemented without regions");
    return 0;
  }
}

// ──────────────────────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────────────────────

/**
 * Create a cache key from parts.
 *
 * @example
 * ```typescript
 * const key = cacheKey("user", userId, "profile"); // "user:123:profile"
 * ```
 */
export function cacheKey(...parts: (string | number)[]): string {
  return parts.join(":");
}

/**
 * Parse a cache key into parts.
 */
export function parseCacheKey(key: string): string[] {
  return key.split(":");
}

/**
 * Create a rate-limited cache (cache with cooldown).
 *
 * @param cache - CacheManager instance
 * @param key - Cache key
 * @param cooldownMs - Minimum time between cache updates
 * @param factory - Function to compute value
 * @param ttl - Cache TTL
 * @returns Cached value (null if still in cooldown)
 */
export async function cachedWithCooldown<T>(
  cache: CacheManager | null | undefined,
  key: string,
  cooldownMs: number,
  factory: () => Promise<T>,
  ttl?: number,
): Promise<T | null> {
  if (!cache) return factory();

  const cached = await cache.get<{ value: T; lastUpdate: number }>(key);
  const now = Date.now();

  if (cached && now - cached.lastUpdate < cooldownMs) {
    return cached.value;
  }

  const value = await factory();
  await cache.set(key, { value, lastUpdate: now }, ttl);
  return value;
}
