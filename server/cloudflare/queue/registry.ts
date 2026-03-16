// ──────────────────────────────────────────────────────────────
// Queue Handler Registry
// ──────────────────────────────────────────────────────────────
import type { HandlerConfig, QueueMessages } from "./types";

/** Handler registry with lazy loading */
const handlers = new Map<keyof QueueMessages, HandlerConfig>();

/** Register a handler */
export function registerHandler<T extends keyof QueueMessages>(config: HandlerConfig<T>): void {
  handlers.set(config.type, config as unknown as HandlerConfig);
}

/** Get handler by type with lazy loading */
export async function getHandler<T extends keyof QueueMessages>(
  type: T,
): Promise<HandlerConfig<T> | undefined> {
  // Lazy load handlers on first access
  if (!handlers.has("delete-r2-objects")) {
    const { deleteR2ObjectsHandler } = await import("./handlers/delete-r2-objects");
    registerHandler(deleteR2ObjectsHandler);
  }

  if (!handlers.has("delete-kit")) {
    const { deleteKitHandler } = await import("./handlers/delete-kit");
    registerHandler(deleteKitHandler);
  }

  if (!handlers.has("transfer-kit")) {
    const { transferKitHandler } = await import("./handlers/transfer-kit");
    registerHandler(transferKitHandler);
  }

  return handlers.get(type) as HandlerConfig<T> | undefined;
}
