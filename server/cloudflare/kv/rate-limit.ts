// ──────────────────────────────────────────────────────────────
// RateLimiter - Request Rate Limiting
// ──────────────────────────────────────────────────────────────
import type { RateLimitConfig, RateLimitEntry, RateLimitResult } from "./types";

/**
 * Rate limiter using Cloudflare KV for distributed rate limiting.
 *
 * Tracks request counts per identifier+path combination with configurable
 * time windows and request limits.
 */
export class RateLimiter {
  constructor(
    private kv: KVNamespace<string>,
    private config: RateLimitConfig,
  ) {}

  private getKey(identifier: string, path: string): string {
    const normalizedPath = new URL(path, "http://dummy").pathname;
    return `ratelimit:${identifier}:${normalizedPath}`;
  }

  private serialize(entry: Omit<RateLimitEntry, "_type">): string {
    return JSON.stringify({
      _type: "rate_limit",
      ...entry,
    } satisfies RateLimitEntry);
  }

  private deserialize(data: string): RateLimitEntry | null {
    try {
      const parsed = JSON.parse(data) as RateLimitEntry;
      if (parsed._type !== "rate_limit") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  /** Check if request is allowed under rate limit */
  async checkLimit(identifier: string, path: string): Promise<RateLimitResult> {
    const key = this.getKey(identifier, path);
    const now = Date.now();
    const ttlSeconds = Math.ceil(this.config.windowMs / 1000) + 60;

    try {
      const existingData = await this.kv.get(key, "text");

      if (!existingData) {
        await this.kv.put(
          key,
          this.serialize({
            count: 1,
            firstRequest: now,
            lastRequest: now,
          }),
          { expirationTtl: ttlSeconds },
        );
        return { allowed: true, remaining: this.config.maxRequests - 1 };
      }

      const entry = this.deserialize(existingData);
      if (!entry) {
        await this.kv.delete(key);
        return { allowed: true, remaining: this.config.maxRequests };
      }

      const timeSinceFirst = now - entry.firstRequest;

      if (timeSinceFirst >= this.config.windowMs) {
        await this.kv.put(
          key,
          this.serialize({
            count: 1,
            firstRequest: now,
            lastRequest: now,
          }),
          { expirationTtl: ttlSeconds },
        );
        return { allowed: true, remaining: this.config.maxRequests - 1 };
      }

      if (entry.count >= this.config.maxRequests) {
        const retryAfter = Math.ceil((this.config.windowMs - timeSinceFirst) / 1000);
        return { allowed: false, retryAfter, remaining: 0 };
      }

      await this.kv.put(
        key,
        this.serialize({
          count: entry.count + 1,
          firstRequest: entry.firstRequest,
          lastRequest: now,
        }),
        { expirationTtl: ttlSeconds },
      );

      return {
        allowed: true,
        remaining: this.config.maxRequests - entry.count - 1,
      };
    } catch (error) {
      console.error("[RateLimiter] Check failed:", error);
      return { allowed: true };
    }
  }

  /** Reset rate limit for identifier + path */
  async resetLimit(identifier: string, path: string): Promise<void> {
    const key = this.getKey(identifier, path);
    await this.kv.delete(key);
  }

  /** Get current rate limit status */
  async getStatus(
    identifier: string,
    path: string,
  ): Promise<{ count: number; resetIn: number } | null> {
    const key = this.getKey(identifier, path);

    try {
      const data = await this.kv.get(key, "text");
      if (!data) return null;

      const entry = this.deserialize(data);
      if (!entry) return null;

      const now = Date.now();
      const resetIn = Math.max(
        0,
        Math.ceil((entry.firstRequest + this.config.windowMs - now) / 1000),
      );

      return { count: entry.count, resetIn };
    } catch {
      return null;
    }
  }
}

/** Helper to get rate limit identifier from request */
export function getRateLimitIdentifier(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Helper to get rate limit path from request */
export function getRateLimitPath(request: Request): string {
  const url = new URL(request.url);
  return url.pathname;
}
