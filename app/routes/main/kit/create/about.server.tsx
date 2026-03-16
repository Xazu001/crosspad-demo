import type { Compilable } from "kysely";
import { data } from "react-router";

import type { CreateKitState } from "#/lib/stores/createKit";
import { createRouteService, dataMethod, formMethod } from "$/lib/decorators";
import { R2FileUploader, type UploadResult } from "$/lib/utils/files";
import { createKitSchema } from "$/lib/validation/kit";
import { BaseService } from "$/services/base";
import { R2_DIRECTORIES } from "@/constants";
import { parseFormDataWithFiles } from "@/utils/formData";
import { getPadNameUI } from "@/utils/pad-mapping";
import { Validator } from "@/validators";


import type { Route } from "./+types/about";



// ──────────────────────────────────────────────────────────────
// Route Service
// ──────────────────────────────────────────────────────────────

type Inputs = CreateKitState["data"];

class RouteService extends BaseService {
  @dataMethod()
  async getCategories() {
    return this.ok(await this.kit.getCategories());
  }

  @formMethod({ general: "Failed to create kit" })
  async createKit(request: Request) {
    await this.rateLimit(request);

    const user = await this.auth.getUserFromRequest(request);
    if (!user || !user.user_create_kit) {
      this.throw({ general: "You must be logged in to create a kit" });
    }

    const formData = await request.formData();
    const data = parseFormDataWithFiles(formData);

    const validationResult = Validator.validateData(data, createKitSchema);

    if (!Validator.isSuccess(validationResult)) {
      if (validationResult.errors) {
        Object.values(validationResult.errors).forEach((value) => {
          validationResult.setErrors({ general: value });
        });
      }
      this.throw(Validator.getErrors(validationResult));
    }

    const { about, pads, colors, categories } = validationResult.data;

    const categoriesArray: number[] = categories || [];

    // Logo Processing - start in parallel with kit creation
    const logoPromise =
      about.logo instanceof File ? this.kit.processLogo(about.logo) : null;

    // Kit Creation
    const kitResult = await this.exDbOperation(() =>
      this.db.op
        .insertInto("kits")
        .values({
          kit_name: about.name,
          kit_description: about.description,
          kit_colors: this.kit.serializeColors(colors),
          kit_logo_source: null,
          user_id: user.user_id,
          kit_metronome: 120,
          kit_created_on: Date.now(),
        })
        .returning(["kit_id"])
        .executeTakeFirst()
    );

    if (!kitResult) {
      this.throw({ general: "Failed to create kit" });
    }

    const kitId = kitResult.kit_id;

    // Pad Creation
    const padInserts = pads.map((pad, index) =>
      this.db.op
        .insertInto("pads")
        .values({
          pad_name: getPadNameUI(index),
          pad_kit_id: kitId,
          pad_position: index,
          pad_choke_group: pad.chokeGroup,
          pad_play_mode: pad.playMode || "tap",
        })
        .returning(["pad_id"])
    );

    const padResults = await this.exDbBatchOperation(padInserts);

    // Sample Processing
    const allFilesToUpload: {
      file: File;
      padIndex: number;
      sampleIndex: number;
      padName: string;
    }[] = [];
    const stringSamples: {
      sample: string;
      padIndex: number;
      sampleIndex: number;
    }[] = [];

    pads.forEach((pad, padIndex) => {
      (pad.samples || []).forEach((sample: string | File, sampleIndex) => {
        if (sample instanceof File) {
          allFilesToUpload.push({
            file: sample,
            padIndex,
            sampleIndex,
            padName: pad.name,
          });
        } else {
          stringSamples.push({ sample, padIndex, sampleIndex });
        }
      });
    });

    let uploadResults: UploadResult[] = [];
    const sampleRecords: {
      file: File;
      padIndex: number;
      sampleIndex: number;
      sampleId: number;
    }[] = [];

    // Collect all sample IDs for status update at the end
    const allSampleIds: number[] = [];

    if (allFilesToUpload.length > 0) {
      const fileUploader = new R2FileUploader(this.r2);
      const timestamp = Date.now();

      const filesToUpload: File[] = allFilesToUpload.map(
        ({ file, padIndex, sampleIndex }) => {
          const fileExtension = file.name.split(".").pop() || "";
          const tempFileName = `temp-${timestamp}-${padIndex}-${sampleIndex}.${fileExtension}`;
          return new File([file], tempFileName, { type: file.type });
        }
      );

      const uploadResult = await fileUploader.uploadMultiple(filesToUpload, {
        directory: R2_DIRECTORIES.samples,
        maxFiles: 50,
      });

      uploadResults = uploadResult.files;

      // Batch INSERT all samples
      const sampleInserts = allFilesToUpload.map(({ file }, index) => {
        const result = uploadResults[index];
        if (!result || !result.success) return null;

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
      }).filter((q): q is NonNullable<typeof q> => q !== null);

      const sampleResults = await this.exDbBatchOperation(sampleInserts);

      // Build valid samples list with R2 keys
      const validSamples: {
        sampleId: number;
        finalKey: string;
        oldKey: string;
        padIndex: number;
        sampleIndex: number;
        file: File;
      }[] = [];

      const updateOperations: Compilable<unknown>[] = [];

      for (let i = 0; i < sampleResults.length; i++) {
        const sampleResult = sampleResults[i];
        const uploadItem = allFilesToUpload[i];
        const uploadResult = uploadResults[i];

        if (!sampleResult || !uploadResult?.success || !uploadItem) continue;

        const sampleId = sampleResult.sample_id;
        const fileExtension = uploadItem.file.name.split(".").pop() || "";
        const finalFileName = `${sampleId}.${fileExtension}`;
        const finalKey = `${R2_DIRECTORIES.samples}/${finalFileName}`;

        // Collect UPDATE operations (query builders, not promises)
        updateOperations.push(
          this.db.op
            .updateTable("samples")
            .set({ sample_source: finalFileName })
            .where("sample_id", "=", sampleId)
        );

        validSamples.push({
          sampleId,
          finalKey,
          oldKey: uploadResult.key,
          padIndex: uploadItem.padIndex,
          sampleIndex: uploadItem.sampleIndex,
          file: uploadItem.file,
        });
      }

      // Execute all UPDATEs in parallel via batch operation
      if (updateOperations.length > 0) {
        await this.exDbBatchOperation(updateOperations);
      }

      // R2 rename operations - larger batch size for parallelism
      const batchSize = 15;
      for (let i = 0; i < validSamples.length; i += batchSize) {
        const batch = validSamples.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(async (sample) => {
            const oldObject = await this.r2.get(sample.oldKey);
            if (!oldObject) throw new Error("R2 object not found");

            await this.r2.put(sample.finalKey, await oldObject.arrayBuffer());
            await this.r2.delete(sample.oldKey);

            return {
              file: sample.file,
              padIndex: sample.padIndex,
              sampleIndex: sample.sampleIndex,
              sampleId: sample.sampleId,
            };
          })
        );

        // Collect successful records and handle failures
        const deleteOperations: Compilable<unknown>[] = [];
        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          if (result.status === "fulfilled") {
            sampleRecords.push(result.value);
          } else {
            // Delete failed sample from DB
            const sample = batch[j];
            deleteOperations.push(
              this.db.op
                .deleteFrom("samples")
                .where("sample_id", "=", sample.sampleId)
            );
          }
        }

        if (deleteOperations.length > 0) {
          await this.exDbBatchOperation(deleteOperations);
        }
      }
    }

    // Add uploaded file sample IDs to the collection
    for (const record of sampleRecords) {
      allSampleIds.push(record.sampleId);
    }

    // String samples - batch INSERT
    if (stringSamples.length > 0) {
      const stringSampleInserts = stringSamples.map(({ sample }) => {
        const fileName = sample.split("/").pop() || sample;
        const sampleSource = sample.split("/").pop() || sample;

        return this.db.op
          .insertInto("samples")
          .values({
            sample_name: fileName,
            sample_source: sampleSource,
            user_id: user.user_id,
            sample_recent_created: true,
            sample_created_on: Date.now(),
          })
          .returning(["sample_id"]);
      });

      const stringSampleResults = await this.exDbBatchOperation(stringSampleInserts);

      // Collect string sample IDs
      for (const result of stringSampleResults) {
        if (result) allSampleIds.push(result.sample_id);
      }

      const stringPadSampleInserts = stringSampleResults
        .map((result, index) => {
          if (!result) return null;
          const { padIndex, sampleIndex } = stringSamples[index];
          return this.db.op.insertInto("pad_samples").values({
            pad_id: padResults[padIndex]?.pad_id,
            sample_id: result.sample_id,
            playback_order: sampleIndex,
          });
        })
        .filter((q): q is NonNullable<typeof q> => q !== null);

      if (stringPadSampleInserts.length > 0) {
        await this.exDbBatchOperation(stringPadSampleInserts);
      }
    }

    // Pad-sample relationships for uploaded files
    const padSampleInserts = sampleRecords.map(({ padIndex, sampleIndex, sampleId }) =>
      this.db.op.insertInto("pad_samples").values({
        pad_id: padResults[padIndex]?.pad_id,
        sample_id: sampleId,
        playback_order: sampleIndex,
      })
    );

    if (padSampleInserts.length > 0) {
      await this.exDbBatchOperation(padSampleInserts);
    }

    // Category Assignment
    await this.kit.assignCategories(kitId, categoriesArray);

    // Logo Upload - await the parallel promise
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
        await this.exDbOperation(() =>
          this.db.op
            .updateTable("kits")
            .set({ kit_logo_source: logoFileName })
            .where("kit_id", "=", kitId)
            .execute()
        );
      }
    }

    // Update all samples status to "published" (they were created as "draft")
    if (allSampleIds.length > 0) {
      const sampleStatusUpdates = allSampleIds.map((sampleId) =>
        this.db.op
          .updateTable("samples")
          .set({ sample_status: "published" })
          .where("sample_id", "=", sampleId)
      );
      await this.exDbBatchOperation(sampleStatusUpdates);
    }

    // Publish the kit (regardless of logo)
    await this.exDbOperation(() =>
      this.db.op
        .updateTable("kits")
        .set({ kit_status: "published", kit_published_on: Date.now() })
        .where("kit_id", "=", kitId)
        .execute()
    );

    await this.cache.delete("kits:home");

    return this.formSuccess({
      kitId: kitId,
      message: "Kit created successfully",
    });
  }
}

// ──────────────────────────────────────────────────────────────

export const loader = async ({ context }: Route.LoaderArgs) => {
  const route = createRouteService(RouteService, context);
  const categories = await route.getCategories();
  return data({ categories });
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const route = createRouteService(RouteService, context);
  const res = await route.createKit(request);
  return data(res);
};