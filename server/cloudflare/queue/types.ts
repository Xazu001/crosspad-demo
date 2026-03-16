// ──────────────────────────────────────────────────────────────
// Queue Types
// ──────────────────────────────────────────────────────────────
import type { Env } from "../../setup";

/** Message type registry */
export interface QueueMessages {
  "delete-r2-objects": { keys: string[] };
  "delete-kit": { kitId: number };
  "transfer-kit": { kitId: number; fromUserId: string; toUserId: string };
}

/** Extract message type from registry */
export type QueueMessage<T extends keyof QueueMessages = keyof QueueMessages> = QueueMessages[T] & {
  type: T;
  timestamp: number;
  id: string;
};

/** Queue handler function */
export type QueueHandler<T extends keyof QueueMessages = keyof QueueMessages> = (
  message: QueueMessage<T>,
  env: Env,
  ctx: ExecutionContext,
) => Promise<void>;

/** Handler configuration */
export interface HandlerConfig<T extends keyof QueueMessages = keyof QueueMessages> {
  type: T;
  handler: QueueHandler<T>;
}

/** Queue send options */
export interface QueueSendOptions {
  delaySeconds?: number;
}

/** Queue statistics */
export interface QueueStats {
  processed: number;
  failed: number;
  success: boolean;
}
