// ──────────────────────────────────────────────────────────────
// QueueManager Module Exports
// ──────────────────────────────────────────────────────────────

// Core class
export { QueueManager } from "./manager";

// Types
export type {
  QueueMessage,
  QueueMessages,
  QueueHandler,
  HandlerConfig,
  QueueSendOptions,
  QueueStats,
} from "./types";

// Result types and helpers
export { queueOk, queueFailed } from "./result";
export type { QueueOk, QueueFailed, QueueResult } from "./result";

// Registry
export { getHandler, registerHandler } from "./registry";

// Handlers
export { deleteR2ObjectsHandler } from "./handlers/delete-r2-objects";
export { transferKitHandler } from "./handlers/transfer-kit";
