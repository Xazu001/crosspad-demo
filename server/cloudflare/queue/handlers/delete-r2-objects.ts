// ──────────────────────────────────────────────────────────────
// Delete R2 Objects Handler
// ──────────────────────────────────────────────────────────────
import type { Env } from "../../../setup";
import type { HandlerConfig, QueueMessage } from "../types";

/**
 * Validates R2 object keys before deletion
 */
function validateR2Keys(keys: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(keys)) {
    errors.push("Keys must be an array");
    return { valid: false, errors };
  }

  if (keys.length === 0) {
    errors.push("Keys array cannot be empty");
    return { valid: false, errors };
  }

  for (const key of keys) {
    if (typeof key !== "string") {
      errors.push(`Key must be a string, got ${typeof key}`);
    } else if (key.trim() === "") {
      errors.push("Key cannot be empty string");
    } else if (key.length > 1024) {
      errors.push(`Key exceeds maximum length of 1024 characters`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export const deleteR2ObjectsHandler: HandlerConfig<"delete-r2-objects"> = {
  type: "delete-r2-objects",
  handler: async (message: QueueMessage<"delete-r2-objects">, env: Env) => {
    console.log(`[Queue] R2 deletion: ${message.keys.length} keys`);

    const validation = validateR2Keys(message.keys);
    if (!validation.valid) {
      throw new Error(`Invalid R2 keys: ${validation.errors.join(", ")}`);
    }

    let deleted = 0;
    let failed = 0;

    for (const key of message.keys) {
      try {
        await env.r2.delete(key);
        deleted++;
      } catch (error) {
        failed++;
        console.error(`[Queue] Failed to delete: ${key}`, error);
      }
    }

    if (failed > 0) {
      console.warn(`[Queue] Deleted ${deleted}/${message.keys.length}, failed: ${failed}`);
    }
  },
};
