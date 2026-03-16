// ──────────────────────────────────────────────────────────────
// Delete Draft Resources Cron Handler
// ──────────────────────────────────────────────────────────────
// Comprehensive cleanup of stale draft resources older than 24h:
// 1. Draft kits (cascade: kit → pads → pad_samples → samples)
// 2. Draft samples linked to pads (cascade: sample → pad_samples → pads → kits)
// 3. Orphan pads (kit doesn't exist)
// 4. Orphan pad_samples (pad or sample doesn't exist)
// 5. Orphan draft samples (not linked to any pad)
// ──────────────────────────────────────────────────────────────
import type { Services } from "../../../core";
import type { CronConfig } from "../types";

const THRESHOLD_24H = 3600 * 24; // 24 hours in seconds

// ──────────────────────────────────────────────────────────────
// Draft Sample Helpers
// ──────────────────────────────────────────────────────────────

/** Find draft samples older than threshold that ARE linked to pads */
async function getLinkedDraftSamples(
  db: Services["base"]["db"],
  threshold: number,
): Promise<{ sample_id: number }[]> {
  const samples = await db.op
    .selectFrom("samples as s")
    .innerJoin("pad_samples as ps", "s.sample_id", "ps.sample_id")
    .where("s.sample_status", "=", "draft")
    .where("s.sample_created_on", "<", threshold)
    .select(["s.sample_id"])
    .distinct()
    .execute();

  return samples;
}

/** Get kit IDs that contain pads using these samples */
async function getKitsForSamples(
  db: Services["base"]["db"],
  sampleIds: number[],
): Promise<number[]> {
  if (sampleIds.length === 0) return [];

  const kits = await db.op
    .selectFrom("pad_samples as ps")
    .innerJoin("pads as p", "ps.pad_id", "p.pad_id")
    .where("ps.sample_id", "in", sampleIds)
    .select(["p.pad_kit_id as kit_id"])
    .distinct()
    .execute();

  return kits.map((k) => k.kit_id);
}

// ──────────────────────────────────────────────────────────────
// Orphan Detection Helpers (cron-specific, not in KitService)
// ──────────────────────────────────────────────────────────────

/** Find orphan draft samples older than threshold (not linked to any pad) - uses LEFT JOIN */
async function getOrphanDraftSamples(
  db: Services["base"]["db"],
  threshold: number,
): Promise<{ sample_id: number }[]> {
  // Single query with LEFT JOIN - no variable limit issues
  const orphans = await db.op
    .selectFrom("samples as s")
    .leftJoin("pad_samples as ps", "s.sample_id", "ps.sample_id")
    .where("s.sample_status", "=", "draft")
    .where("s.sample_created_on", "<", threshold)
    .where("ps.sample_id", "is", null)
    .select(["s.sample_id"])
    .execute();

  return orphans;
}

/** Find orphan pads (kit doesn't exist) - uses LEFT JOIN */
async function getOrphanPads(db: Services["base"]["db"]): Promise<{ pad_id: number }[]> {
  // Single query with LEFT JOIN - no variable limit issues
  const orphans = await db.op
    .selectFrom("pads as p")
    .leftJoin("kits as k", "p.pad_kit_id", "k.kit_id")
    .where("k.kit_id", "is", null)
    .select(["p.pad_id"])
    .execute();

  return orphans;
}

/** Find orphan pad_samples (pad or sample doesn't exist) - uses LEFT JOIN to avoid SQL variable limit */
async function getOrphanPadSamples(
  db: Services["base"]["db"],
): Promise<{ pad_id: number; sample_id: number }[]> {
  // Single query with LEFT JOIN - no variable limit issues
  const orphans = await db.op
    .selectFrom("pad_samples as ps")
    .leftJoin("pads as p", "ps.pad_id", "p.pad_id")
    .leftJoin("samples as s", "ps.sample_id", "s.sample_id")
    .where((eb) => eb.or([eb("p.pad_id", "is", null), eb("s.sample_id", "is", null)]))
    .select(["ps.pad_id", "ps.sample_id"])
    .execute();

  return orphans;
}

/** Delete orphan pad_samples by pad_id + sample_id pairs */
async function deleteOrphanPadSamples(
  db: Services["base"]["db"],
  pairs: { pad_id: number; sample_id: number }[],
): Promise<void> {
  if (pairs.length === 0) return;

  for (const { pad_id, sample_id } of pairs) {
    await db.op
      .deleteFrom("pad_samples")
      .where("pad_id", "=", pad_id)
      .where("sample_id", "=", sample_id)
      .execute();
  }
}

// ──────────────────────────────────────────────────────────────
// Cron Handler
// ──────────────────────────────────────────────────────────────

/** Delete stale draft resources cron handler - runs weekly on Sunday at 1:00 AM */
export const deleteDraftSamplesHandler: CronConfig = {
  cron: "0 1 * * SUN",
  handler: async (controller, env, ctx) => {
    console.log(`[Cleanup Cron] Started at ${new Date(controller.scheduledTime).toISOString()}`);

    try {
      // Dynamic import to break circular dependency with setup.ts
      const { createServices } = await import("../../../setup");
      const services = await createServices(env);
      const db = services.base.db;
      const threshold = Date.now() - THRESHOLD_24H;
      const allR2Keys: string[] = [];

      let deletedDraftKits = 0;
      let deletedSampleKits = 0;
      let deletedOrphanPads = 0;
      let deletedOrphanPadSamples = 0;
      let deletedOrphanSamples = 0;

      // 1. Delete draft kits older than 24h (full cascade)
      const draftKits = await services.kit.getDraftKitsOlderThan(threshold);

      if (draftKits.length > 0) {
        console.log(`[Cleanup Cron] Found ${draftKits.length} draft kits`);

        for (const kit of draftKits) {
          try {
            const { r2Keys } = await services.kit.deleteKit(kit.kit_id);
            allR2Keys.push(...r2Keys);
            deletedDraftKits++;
          } catch (err) {
            console.error(`[Cleanup Cron] Failed kit ${kit.kit_id}:`, err);
          }
        }
      }

      // 2. Delete draft samples linked to pads + their kits (cascade)
      const linkedDraftSamples = await getLinkedDraftSamples(db, threshold);

      if (linkedDraftSamples.length > 0) {
        console.log(`[Cleanup Cron] Found ${linkedDraftSamples.length} linked draft samples`);

        const sampleIds = linkedDraftSamples.map((s) => s.sample_id);
        const kitIds = await getKitsForSamples(db, sampleIds);

        // Delete each kit (cascade: kit → pads → pad_samples → samples)
        for (const kitId of kitIds) {
          try {
            const { r2Keys } = await services.kit.deleteKit(kitId);
            allR2Keys.push(...r2Keys);
            deletedSampleKits++;
          } catch (err) {
            console.error(`[Cleanup Cron] Failed kit ${kitId}:`, err);
          }
        }
      }

      // 3. Delete orphan pads (kit doesn't exist)
      const orphanPads = await getOrphanPads(db);

      if (orphanPads.length > 0) {
        console.log(`[Cleanup Cron] Found ${orphanPads.length} orphan pads`);

        const padIds = orphanPads.map((p) => p.pad_id);
        const { r2Keys } = await services.kit.deletePads(padIds);
        allR2Keys.push(...r2Keys);
        deletedOrphanPads = orphanPads.length;
      }

      // 4. Delete orphan pad_samples (pad or sample doesn't exist)
      const orphanPadSamplesArr = await getOrphanPadSamples(db);

      if (orphanPadSamplesArr.length > 0) {
        console.log(`[Cleanup Cron] Found ${orphanPadSamplesArr.length} orphan pad_samples`);

        await deleteOrphanPadSamples(db, orphanPadSamplesArr);
        deletedOrphanPadSamples = orphanPadSamplesArr.length;
      }

      // 5. Delete orphan draft samples older than 24h (not linked to any pad)
      const orphanSamples = await getOrphanDraftSamples(db, threshold);

      if (orphanSamples.length > 0) {
        console.log(`[Cleanup Cron] Found ${orphanSamples.length} orphan draft samples`);

        const sampleIds = orphanSamples.map((s) => s.sample_id);
        const { r2Keys } = await services.kit.deleteSamples(sampleIds);
        allR2Keys.push(...r2Keys);
        deletedOrphanSamples = orphanSamples.length;
      }

      // 6. Send R2 keys for file deletion
      if (allR2Keys.length > 0) {
        await services.base.queue.send("delete-r2-objects", {
          keys: allR2Keys,
        });
        console.log(`[Cleanup Cron] Sent ${allR2Keys.length} R2 keys`);
      }

      console.log(
        `[Cleanup Cron] Done. Draft kits: ${deletedDraftKits}, Sample kits: ${deletedSampleKits}, ` +
          `Orphan pads: ${deletedOrphanPads}, Orphan pad_samples: ${deletedOrphanPadSamples}, ` +
          `Orphan samples: ${deletedOrphanSamples}`,
      );
    } catch (error) {
      console.error("[Cleanup Cron] Error:", error);
    }
  },
};
