// ──────────────────────────────────────────────────────────────
// CacheManager Module Exports
// ──────────────────────────────────────────────────────────────

// Core classes
export { CacheManager } from "./manager";
export { KitTransferManager } from "./kit-transfer";
export { RateLimiter } from "./rate-limit";
export { TotpManager } from "./totp";

// Types
export type {
  KVEntry,
  KVPutOptions,
  KVGetOptions,
  CacheEntry,
  RateLimitEntry,
  RateLimitConfig,
  RateLimitResult,
  TotpSecretEntry,
  TotpBackupEntry,
  KitTransferEntry,
} from "./types";

// Utilities
export {
  cached,
  cachedBatch,
  cachedWithVersion,
  invalidateCacheVersion,
  SimpleCache,
  cacheKey,
  parseCacheKey,
  cachedWithCooldown,
} from "./utils";

export { getRateLimitIdentifier, getRateLimitPath } from "./rate-limit";
