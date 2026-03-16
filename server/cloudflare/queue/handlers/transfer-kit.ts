// ──────────────────────────────────────────────────────────────
// Transfer Kit Handler
// ──────────────────────────────────────────────────────────────
import type { Env } from "../../../setup";
import type { HandlerConfig, QueueMessage } from "../types";

/**
 * Handler for transferring a kit to another user.
 *
 * Updates ownership of the kit and all its samples:
 * 1. Updates kits.user_id → toUserId
 * 2. Updates samples.user_id → toUserId for all samples belonging to the kit
 * 3. Logs success
 */
export const transferKitHandler: HandlerConfig<"transfer-kit"> = {
  type: "transfer-kit",
  handler: async (message: QueueMessage<"transfer-kit">, env: Env) => {
    const { kitId, fromUserId, toUserId } = message;
    console.log(`[Queue] Transferring kit ${kitId} from ${fromUserId} to ${toUserId}`);

    // Use raw D1 for queries within queue handler
    const db = env.db;

    // ──────────────────────────────────────────────────────────────
    // Step 1: Verify kit ownership
    // ──────────────────────────────────────────────────────────────
    const kitResult = await db
      .prepare("SELECT user_id, kit_name FROM kits WHERE kit_id = ?")
      .bind(kitId)
      .first<{ user_id: string; kit_name: string }>();

    if (!kitResult) {
      console.error(`[Queue] Kit ${kitId} not found`);
      return;
    }

    if (kitResult.user_id !== fromUserId) {
      console.error(
        `[Queue] Kit ${kitId} owner mismatch: expected ${fromUserId}, got ${kitResult.user_id}`,
      );
      return;
    }

    // ──────────────────────────────────────────────────────────────
    // Step 2: Get pad IDs for this kit
    // ──────────────────────────────────────────────────────────────
    const padsResult = await db
      .prepare("SELECT pad_id FROM pads WHERE pad_kit_id = ?")
      .bind(kitId)
      .all<{ pad_id: number }>();

    const padIds = padsResult.results?.map((p) => p.pad_id) ?? [];
    let sampleIds: number[] = [];

    if (padIds.length > 0) {
      // Get sample IDs from pad_samples
      const placeholders = padIds.map(() => "?").join(",");
      const sampleIdsResult = await db
        .prepare(`SELECT DISTINCT sample_id FROM pad_samples WHERE pad_id IN (${placeholders})`)
        .bind(...padIds)
        .all<{ sample_id: number }>();

      sampleIds = sampleIdsResult.results?.map((s) => s.sample_id) ?? [];
    }

    // ──────────────────────────────────────────────────────────────
    // Step 3: Update kit ownership
    // ──────────────────────────────────────────────────────────────
    await db.prepare("UPDATE kits SET user_id = ? WHERE kit_id = ?").bind(toUserId, kitId).run();

    console.log(`[Queue] Updated kit ${kitId} owner to ${toUserId}`);

    // ──────────────────────────────────────────────────────────────
    // Step 4: Update sample ownership
    // ──────────────────────────────────────────────────────
    if (sampleIds.length > 0) {
      const samplePlaceholders = sampleIds.map(() => "?").join(",");
      await db
        .prepare(`UPDATE samples SET user_id = ? WHERE sample_id IN (${samplePlaceholders})`)
        .bind(toUserId, ...sampleIds)
        .run();

      console.log(`[Queue] Updated ${sampleIds.length} samples owner to ${toUserId}`);
    }

    console.log(
      `[Queue] Kit "${kitResult.kit_name}" (${kitId}) transferred successfully from ${fromUserId} to ${toUserId}`,
    );
  },
};
