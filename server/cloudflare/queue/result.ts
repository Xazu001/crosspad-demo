// ──────────────────────────────────────────────────────────────
// Queue Result System
// ──────────────────────────────────────────────────────────────
// Types and helpers for background queue handler results.
// Used in server/cloudflare/queue/handlers/*.
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

/**
 * Successful queue handler result.
 *
 * @example
 * ```ts
 * return queueOk({ deleted: 5, failed: 0 });
 * ```
 */
export type QueueOk<T = void> = {
  success: true;
  data: T;
};

/**
 * Failed queue handler result.
 *
 * @example
 * ```ts
 * return queueFailed("Kit not found", false);
 * ```
 */
export type QueueFailed = {
  success: false;
  error: string;
  retryable: boolean;
};

/**
 * Discriminated union for queue handler results.
 *
 * Queue handlers should return this instead of throwing or returning void.
 * The `retryable` flag on failures tells the queue manager whether to retry.
 */
export type QueueResult<T = void> = QueueOk<T> | QueueFailed;

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Create a successful queue result.
 *
 * @param data - Optional result data
 */
export function queueOk(): QueueOk<void>;
export function queueOk<T>(data: T): QueueOk<T>;
export function queueOk<T>(data?: T): QueueOk<T> {
  return { success: true, data: data as T };
}

/**
 * Create a failed queue result.
 *
 * @param error - Error message
 * @param retryable - Whether the queue should retry this message (default: false)
 */
export function queueFailed(error: string, retryable: boolean = false): QueueFailed {
  return { success: false, error, retryable };
}
