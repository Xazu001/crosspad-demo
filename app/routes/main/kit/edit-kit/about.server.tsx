import type { Compilable } from "kysely";
import { data } from "react-router";

import { createRouteService, dataMethod, formMethod } from "$/lib/decorators";
import { R2FileUploader } from "$/lib/utils/files";
import { updateKitSchema } from "$/lib/validation/kit";
import { BaseService } from "$/services/base";
import { R2_DIRECTORIES } from "@/constants";
import { parseFormDataWithFiles } from "@/utils/formData";
import { getPadNameUI } from "@/utils/pad-mapping";
import { Validator } from "@/validators";

import type { Route } from "./+types/about";

// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

class RouteService extends BaseService {
  @dataMethod()
  async getCategories() {
    return this.ok(await this.kit.getCategories());
  }

  @formMethod({ general: "Failed to update kit" })
  async updateKit(request: Request, kitId: number) {
    await this.rateLimit(request);

    const user = await this.auth.getUserFromRequest(request);
    if (!user || !user.user_create_kit) {
      this.throw({ general: "You must be logged in to edit a kit" });
    }

    // Clear kit play cache
    await this.cache.delete(`kit:play:${kitId}`);
    await this.cache.delete("home:kits");

    const formData = await request.formData();
    const data = parseFormDataWithFiles(formData);

    const validationResult = Validator.validateData(data, updateKitSchema);

    if (!Validator.isSuccess(validationResult)) {
      if (validationResult.errors) {
        Object.values(validationResult.errors).forEach((value) => {
          validationResult.setErrors({ general: value });
        });
      }
      this.throw(Validator.getErrors(validationResult));
    }

    const { about, pads, colors, categories } = validationResult.data;

    // Verify ownership
    const existingKit = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("kits")
        .where("kit_id", "=", kitId)
        .select(["user_id", "kit_logo_source"])
        .executeTakeFirst(),
    );

    if (!existingKit || existingKit.user_id !== user.user_id) {
      this.throw({ general: "You don't have access to edit this kit" });
    }

    // Logo Processing - start in parallel with DB operations
    const logoPromise = about.logo instanceof File ? this.kit.processLogo(about.logo) : null;

    // Update Kit Record
    await this.exDbOperation(() =>
      this.db.op
        .updateTable("kits")
        .set({
          kit_name: about.name,
          kit_description: about.description,
          kit_colors: this.kit.serializeColors(colors),
        })
        .where("kit_id", "=", kitId)
        .execute(),
    );

    // Update Pads — batch all updates/inserts in one D1 batch
    const existingPads = await this.exDbOperation(() =>
      this.db.op.selectFrom("pads").where("pad_kit_id", "=", kitId).selectAll().execute(),
    );

    const existingPadMap = new Map(existingPads.map((p) => [p.pad_position, p]));

    const padUpdateOps: Compilable<unknown>[] = [];
    const padInsertOps: Compilable<unknown>[] = [];
    const newPadPositions: number[] = [];

    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      const existingPad = existingPadMap.get(i);

      if (existingPad) {
        padUpdateOps.push(
          this.db.op
            .updateTable("pads")
            .set({
              pad_choke_group: pad.chokeGroup,
              pad_play_mode: pad.playMode || "tap",
            })
            .where("pad_id", "=", existingPad.pad_id),
        );
      } else {
        newPadPositions.push(i);
        padInsertOps.push(
          this.db.op
            .insertInto("pads")
            .values({
              pad_name: getPadNameUI(i),
              pad_kit_id: kitId,
              pad_position: i,
              pad_choke_group: pad.chokeGroup,
              pad_play_mode: pad.playMode || "tap",
            })
            .returning(["pad_id", "pad_position"]),
        );
      }
    }

    // Execute pad ops in a single batch
    const allPadOps = [...padUpdateOps, ...padInsertOps];
    if (allPadOps.length > 0) {
      const batchResults = await this.exDbBatchOperation(allPadOps);

      // Extract new pad IDs from insert results (they come after updates)
      const insertResults = batchResults.slice(padUpdateOps.length);
      for (let i = 0; i < insertResults.length; i++) {
        const result = insertResults[i];
        if (result) {
          existingPadMap.set(result.pad_position, result);
        }
      }
    }

    // Build position → pad_id map
    const padIdByPosition = new Map<number, number>();
    for (const [position, pad] of existingPadMap) {
      padIdByPosition.set(position, pad.pad_id);
    }

    const allPadIds = [...padIdByPosition.values()];

    // Collect old sample IDs before removing pad_samples links
    let oldSampleIds: number[] = [];
    if (allPadIds.length > 0) {
      const oldPadSamples = await this.exDbOperation(() =>
        this.db.op
          .selectFrom("pad_samples")
          .where("pad_id", "in", allPadIds)
          .select(["sample_id"])
          .execute(),
      );
      oldSampleIds = oldPadSamples
        .map((ps) => ps.sample_id)
        .filter((id): id is number => id !== null);

      // Delete existing pad_samples and re-create them
      await this.exDbOperation(() =>
        this.db.op.deleteFrom("pad_samples").where("pad_id", "in", allPadIds).execute(),
      );
    }

    // Separate file uploads from string sample references
    const fileSamples: {
      file: File;
      padIndex: number;
      sampleIndex: number;
    }[] = [];
    const stringSamples: {
      source: string;
      padIndex: number;
      sampleIndex: number;
    }[] = [];

    for (let padIndex = 0; padIndex < pads.length; padIndex++) {
      const pad = pads[padIndex];
      if (!pad.samples) continue;

      for (let sampleIndex = 0; sampleIndex < pad.samples.length; sampleIndex++) {
        const sample = pad.samples[sampleIndex];
        if (sample instanceof File) {
          fileSamples.push({ file: sample, padIndex, sampleIndex });
        } else if (typeof sample === "string" && sample.length > 0) {
          stringSamples.push({
            source: sample.split("/").pop() || sample,
            padIndex,
            sampleIndex,
          });
        }
      }
    }

    const newSampleIds: number[] = [];

    // ── File sample uploads (batched) ────────────────────────
    if (fileSamples.length > 0) {
      const fileUploader = new R2FileUploader(this.r2);
      const timestamp = Date.now();

      // Batch upload all files
      const filesToUpload = fileSamples.map(({ file, padIndex, sampleIndex }) => {
        const ext = file.name.split(".").pop() || "";
        const tempName = `temp-${timestamp}-${padIndex}-${sampleIndex}.${ext}`;
        return new File([file], tempName, { type: file.type });
      });

      const uploadResult = await fileUploader.uploadMultiple(filesToUpload, {
        directory: R2_DIRECTORIES.samples,
        maxFiles: 50,
      });

      const uploadResults = uploadResult.files;

      // Batch INSERT all new samples
      const sampleInserts = fileSamples
        .map(({ file }, i) => {
          if (!uploadResults[i]?.success) return null;
          return this.db.op
            .insertInto("samples")
            .values({
              sample_name: file.name,
              sample_source: "",
              user_id: user.user_id,
              sample_recent_created: true,
              sample_created_on: Date.now(),
            })
            .returning(["sample_id"]);
        })
        .filter((q): q is NonNullable<typeof q> => q !== null);

      const sampleResults = await this.exDbBatchOperation(sampleInserts);

      // Build valid samples list and batch UPDATE sample sources
      const validSamples: {
        sampleId: number;
        finalKey: string;
        oldKey: string;
        padIndex: number;
        sampleIndex: number;
      }[] = [];
      const sourceUpdates: Compilable<unknown>[] = [];

      let resultIdx = 0;
      for (let i = 0; i < fileSamples.length; i++) {
        const upload = uploadResults[i];
        if (!upload?.success) continue;

        const sampleResult = sampleResults[resultIdx++];
        if (!sampleResult) continue;

        const { padIndex, sampleIndex, file } = fileSamples[i];
        const sampleId = sampleResult.sample_id;
        const ext = file.name.split(".").pop() || "";
        const finalFileName = `${sampleId}.${ext}`;
        const finalKey = `${R2_DIRECTORIES.samples}/${finalFileName}`;

        sourceUpdates.push(
          this.db.op
            .updateTable("samples")
            .set({ sample_source: finalFileName })
            .where("sample_id", "=", sampleId),
        );

        validSamples.push({
          sampleId,
          finalKey,
          oldKey: upload.key,
          padIndex,
          sampleIndex,
        });
      }

      if (sourceUpdates.length > 0) {
        await this.exDbBatchOperation(sourceUpdates);
      }

      // R2 rename operations in parallel batches
      const batchSize = 15;
      const padSampleOps: Compilable<unknown>[] = [];

      for (let i = 0; i < validSamples.length; i += batchSize) {
        const batch = validSamples.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(async (s) => {
            const oldObject = await this.r2.get(s.oldKey);
            if (!oldObject) throw new Error("R2 object not found");
            await this.r2.put(s.finalKey, await oldObject.arrayBuffer());
            await this.r2.delete(s.oldKey);
            return s;
          }),
        );

        const deleteOps: Compilable<unknown>[] = [];
        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          if (result.status === "fulfilled") {
            const s = result.value;
            newSampleIds.push(s.sampleId);
            padSampleOps.push(
              this.db.op.insertInto("pad_samples").values({
                pad_id: padIdByPosition.get(s.padIndex)!,
                sample_id: s.sampleId,
                playback_order: s.sampleIndex,
              }),
            );
          } else {
            deleteOps.push(
              this.db.op.deleteFrom("samples").where("sample_id", "=", batch[j].sampleId),
            );
          }
        }

        if (deleteOps.length > 0) {
          await this.exDbBatchOperation(deleteOps);
        }
      }

      if (padSampleOps.length > 0) {
        await this.exDbBatchOperation(padSampleOps);
      }
    }

    // ── String sample references (batched lookup) ────────────
    if (stringSamples.length > 0) {
      const uniqueSources = [...new Set(stringSamples.map((s) => s.source))];

      // Single batch lookup for all existing samples
      const existingSamples = await this.exDbOperation(() =>
        this.db.op
          .selectFrom("samples")
          .where("sample_source", "in", uniqueSources)
          .select(["sample_id", "sample_source"])
          .execute(),
      );

      const sampleBySource = new Map(existingSamples.map((s) => [s.sample_source, s.sample_id]));

      const padSampleInserts: Compilable<unknown>[] = [];

      for (const { source, padIndex, sampleIndex } of stringSamples) {
        const sampleId = sampleBySource.get(source);
        if (sampleId == null) continue;

        newSampleIds.push(sampleId);
        padSampleInserts.push(
          this.db.op.insertInto("pad_samples").values({
            pad_id: padIdByPosition.get(padIndex)!,
            sample_id: sampleId,
            playback_order: sampleIndex,
          }),
        );
      }

      if (padSampleInserts.length > 0) {
        await this.exDbBatchOperation(padSampleInserts);
      }
    }

    // Queue Orphaned Samples for R2 Deletion
    const newSampleIdSet = new Set(newSampleIds);
    const orphanedSampleIds = oldSampleIds.filter((id) => !newSampleIdSet.has(id));

    if (orphanedSampleIds.length > 0) {
      const orphanedSamples = await this.exDbOperation(() =>
        this.db.op
          .selectFrom("samples")
          .where("sample_id", "in", orphanedSampleIds)
          .select(["sample_id", "sample_source"])
          .execute(),
      );

      const r2KeysToDelete = orphanedSamples
        .filter((s) => s.sample_source)
        .map((s) => `${R2_DIRECTORIES.samples}/${s.sample_source}`);

      if (r2KeysToDelete.length > 0) {
        try {
          await this.queue.send("delete-r2-objects", { keys: r2KeysToDelete });
        } catch (error) {
          console.error("[updateKit] Failed to queue R2 deletion, files will remain:", error);
        }
      }

      // Delete orphaned sample records from DB
      await this.exDbOperation(() =>
        this.db.op.deleteFrom("samples").where("sample_id", "in", orphanedSampleIds).execute(),
      );
    }

    // Update Categories
    await this.exDbOperation(() =>
      this.db.op.deleteFrom("kit_categories").where("kit_id", "=", kitId).execute(),
    );
    await this.kit.assignCategories(kitId, categories || []);

    // Logo Upload — await the parallel promise
    const processedLogo = await logoPromise;
    if (processedLogo) {
      const fileUploader = new R2FileUploader(this.r2);
      const timestamp = Date.now();
      const logoFileName = `${kitId}-${timestamp}.webp`;
      const logoFile = new File([processedLogo], logoFileName, { type: "image/webp" });

      const uploadResult = await fileUploader.uploadSingle(logoFile, {
        directory: R2_DIRECTORIES.logos || "logos",
      });

      if (uploadResult.success) {
        // Queue old logo for R2 deletion
        const oldLogoSource = existingKit.kit_logo_source;
        if (oldLogoSource) {
          try {
            await this.queue.send("delete-r2-objects", {
              keys: [`${R2_DIRECTORIES.logos || "logos"}/${oldLogoSource}`],
            });
          } catch (error) {
            console.error("[updateKit] Failed to queue old logo deletion:", error);
          }
        }

        await this.exDbOperation(() =>
          this.db.op
            .updateTable("kits")
            .set({ kit_logo_source: logoFileName })
            .where("kit_id", "=", kitId)
            .execute(),
        );
      }
    }

    return this.formSuccess({
      kitId,
      message: "Kit updated successfully",
    });
  }
}

// ──────────────────────────────────────────────────────────────

export const loader = async ({ context }: Route.LoaderArgs) => {
  const route = createRouteService(RouteService, context);
  const categories = await route.getCategories();
  return data({ categories });
};

export const action = async ({ request, context, params }: Route.ActionArgs) => {
  const route = createRouteService(RouteService, context);
  const res = await route.updateKit(request, Number(params.kitId));
  return data(res);
};
