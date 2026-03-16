// ──────────────────────────────────────────────────────────────
// CacheManager Types
// ──────────────────────────────────────────────────────────────

/** Base interface for all KV entries with JSON serialization */
export interface KVEntry {
  readonly _type: string;
}

/** Options for KV put operations */
export interface KVPutOptions {
  expirationTtl?: number;
  expiration?: number;
  metadata?: Record<string, unknown>;
}

/** Options for KV get operations */
export interface KVGetOptions {
  cacheTtl?: number;
}

/** Cache entry wrapper for any cached content */
export interface CacheEntry<T> extends KVEntry {
  readonly _type: "cache";
  data: T;
  createdAt: number;
  expiresAt: number | null;
}

/** Rate limit entry stored in KV */
export interface RateLimitEntry extends KVEntry {
  readonly _type: "rate_limit";
  count: number;
  firstRequest: number;
  lastRequest: number;
}

/** Rate limit configuration */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

/** Result of rate limit check */
export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  remaining?: number;
}

// ──────────────────────────────────────────────────────────────
// TOTP Types
// ──────────────────────────────────────────────────────────────

/** TOTP secret entry stored in KV */
export interface TotpSecretEntry extends KVEntry {
  readonly _type: "totp_secret";
  encryptedSecret: string;
  createdAt: number;
}

/** TOTP backup codes entry stored in KV */
export interface TotpBackupEntry extends KVEntry {
  readonly _type: "totp_backup";
  codes: string[];
  createdAt: number;
}

// ──────────────────────────────────────────────────────────────
// Kit Transfer Types
// ──────────────────────────────────────────────────────────────

/** Kit transfer entry stored in KV */
export interface KitTransferEntry extends KVEntry {
  readonly _type: "kit_transfer";
  code: string; // The transfer code (UUID)
  kitId: number;
  kitName: string;
  fromUserId: string;
  fromUserName: string;
  createdAt: number;
  expiresAt: number; // 7 days TTL
}
