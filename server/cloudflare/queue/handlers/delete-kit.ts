// ──────────────────────────────────────────────────────────────
// Delete Kit Handler
// ──────────────────────────────────────────────────────────────
import type { Env } from "../../../setup";
import type { HandlerConfig, QueueMessage } from "../types";

/**
 * Handler for deleting a kit and all associated data.
 *
 * Delegates to KitService.deleteKit() for DB cleanup, then
 * sends collected R2 keys to delete-r2-objects queue for file deletion.
 */
export const deleteKitHandler: HandlerConfig<"delete-kit"> = {
  type: "delete-kit",
  handler: async (message: QueueMessage<"delete-kit">, env: Env) => {
    const { kitId } = message;
    console.log(`[Queue] Deleting kit: ${kitId}`);

    // Dynamic import to break circular dependency with setup.ts
    const { createServices } = await import("../../../setup");
    const services = await createServices(env);
    const { r2Keys } = await services.kit.deleteKit(kitId);

    if (r2Keys.length > 0) {
      await services.base.queue.send("delete-r2-objects", { keys: r2Keys });
      console.log(`[Queue] Sent ${r2Keys.length} R2 keys for deletion`);
    }

    console.log(`[Queue] Kit ${kitId} deleted successfully`);
  },
};
