// ──────────────────────────────────────────────────────────────
// CacheManager - Central Cache & Rate Limiting Manager
// ──────────────────────────────────────────────────────────────
import { RateLimiter } from "./rate-limit";
import type { CacheEntry, RateLimitConfig } from "./types";

/** Default rate limit configuration */
const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 1000,
  maxRequests: 1,
};

/**
 * Central manager for all cache and rate limiting operations.
 *
 * Wraps Cloudflare KV with JSON serialization, TTL support, and rate limiting.
 * Accessed via `BaseService.cache` or directly from `CacheManager` instance.
 *
 * @example
 * ```ts
 * // In a service method:
 * const data = await this.cache.getOrSet("users:list", () => fetchUsers(), 300);
 * await this.cache.delete("users:list");
 * ```
 */
export class CacheManager {
  private _rateLimiter: RateLimiter | null = null;

  constructor(private kv: KVNamespace<string>) {}

  private getKey(key: string): string {
    return `cache:${key}`;
  }

  // ──────────────────────────────────────────────────────────────
  // Cache Operations
  // ──────────────────────────────────────────────────────────────

  private serialize<T>(data: T, ttl?: number): string {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      _type: "cache",
      data,
      createdAt: now,
      expiresAt: ttl ? now + ttl * 1000 : null,
    };
    return JSON.stringify(entry);
  }

  private deserialize<T>(raw: string): T | null {
    try {
      const entry = JSON.parse(raw) as CacheEntry<T>;

      if (entry._type !== "cache") {
        return null;
      }

      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  /**
   * Get a cached value by key.
   *
   * @returns Deserialized value or `null` if not found / expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getKey(key);
      const raw = await this.kv.get(fullKey, "text");
      if (!raw) return null;
      return this.deserialize<T>(raw);
    } catch (error) {
      console.error("[CacheManager] Get failed:", error);
      return null;
    }
  }

  /**
   * Set a cached value with optional TTL.
   *
   * @param key - Cache key
   * @param value - Value to cache (must be JSON-serializable)
   * @param ttlSeconds - Time-to-live in seconds (omit for no expiration)
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      const serialized = this.serialize(value, ttlSeconds);
      await this.kv.put(fullKey, serialized, {
        expirationTtl: ttlSeconds,
      });
    } catch (error) {
      console.error("[CacheManager] Set failed:", error);
      throw error;
    }
  }

  /** Delete a cached value by key. Silently ignores missing keys. */
  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      await this.kv.delete(fullKey);
    } catch (error) {
      console.error("[CacheManager] Delete failed:", error);
    }
  }

  /**
   * Get cached value or compute and cache it.
   *
   * If the key exists, returns the cached value.
   * Otherwise, calls `factory()`, caches the result, and returns it.
   *
   * @param key - Cache key
   * @param factory - Async function to compute the value if not cached
   * @param ttlSeconds - Time-to-live in seconds for the cached value
   */
  async getOrSet<R>(key: string, factory: () => Promise<R>, ttlSeconds?: number): Promise<R> {
    const cached = await this.get<R>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /** Check if a key exists in cache */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  // ──────────────────────────────────────────────────────────────
  // Rate Limiting
  // ──────────────────────────────────────────────────────────────

  /** Get the default rate limiter instance */
  get rateLimiter(): RateLimiter {
    if (!this._rateLimiter) {
      this._rateLimiter = new RateLimiter(this.kv, DEFAULT_RATE_LIMIT_CONFIG);
    }
    return this._rateLimiter;
  }

  /** Create a rate limiter with custom configuration */
  createRateLimiter(config: RateLimitConfig): RateLimiter {
    return new RateLimiter(this.kv, config);
  }
}
