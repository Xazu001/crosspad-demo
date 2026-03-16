// ──────────────────────────────────────────────────────────────
// Cloudflare Utilities
// ──────────────────────────────────────────────────────────────

// CacheManager - Cache & Rate Limiting
export {
  // Core classes
  CacheManager,
  KitTransferManager,
  RateLimiter,
  TotpManager,
  // Utilities
  cached,
  cachedBatch,
  cachedWithVersion,
  invalidateCacheVersion,
  SimpleCache,
  cacheKey,
  parseCacheKey,
  cachedWithCooldown,
  getRateLimitIdentifier,
  getRateLimitPath,
} from "./kv/index";

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
} from "./kv/index";

// QueueManager - Queue Management
export {
  // Core class
  QueueManager,
  // Registry
  getHandler,
  registerHandler,
  // Handlers
  deleteR2ObjectsHandler,
  transferKitHandler,
  // Result helpers
  queueOk,
  queueFailed,
} from "./queue/index";

export type {
  QueueMessage,
  QueueMessages,
  QueueHandler,
  HandlerConfig,
  QueueSendOptions,
  QueueStats,
  QueueOk,
  QueueFailed,
  QueueResult,
} from "./queue/index";

// CronManager - Scheduled Tasks
export { registerCron, getCronHandler } from "./crons/index";

export type { CronHandler, CronConfig } from "./crons/index";
