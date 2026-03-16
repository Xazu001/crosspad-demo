// ──────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────
import { dataMethod, formMethod } from "$/lib/decorators";
import { processImageForWorkers } from "$/lib/utils/image-processing";
import { BaseService, type FormResponseError, type FormResponseResult } from "$/services/base";
import { DEFAULT_KIT_COLORS } from "@/constants";
import { IMAGE_MAX_DIMENSION, IMAGE_QUALITY } from "@/utils/image";

import type { Database } from "$/core";
import type { KitColors } from "$/database/schema";

// ──────────────────────────────────────────────────────────────
// Kit Service Class
// ──────────────────────────────────────────────────────────────

/**
 * Service for managing drum kits, pads, and samples.
 *
 * Handles kit creation, retrieval, file uploads, and sample management.
 * Integrates with R2 storage for audio files and image processing for logos.
 */
export class KitService extends BaseService {
  constructor(db: Database) {
    super(db);
  }

  /**
   * Filter out default colors to minimize database storage.
   *
   * Only stores colors that differ from DEFAULT_KIT_COLORS to reduce
   * database size and avoid storing redundant default values.
   *
   * @param kitColors - Complete color object from form data
   * @returns Partial KitColors object with only non-default values
   */
  public getNonDefaultColors(kitColors: KitColors): Partial<KitColors> {
    const overrides: Partial<KitColors> = {};

    for (const [key, value] of Object.entries(kitColors)) {
      if (!value) continue;

      // Handle transparent special case - don't add # to transparent
      let normalizedValue = value;
      if (value !== "transparent" && !value.startsWith("#")) {
        normalizedValue = `#${value}`;
      }

      const defaultValue = DEFAULT_KIT_COLORS[key as keyof KitColors];

      // Special handling for transparent comparison
      const isDefaultTransparent =
        key === "border" &&
        ((value === "transparent" && defaultValue === "transparent") ||
          (value === "#transparent" && defaultValue === "transparent") ||
          (value === "transparent" && defaultValue === "#transparent"));

      if (
        defaultValue &&
        (normalizedValue.toLowerCase() === defaultValue.toLowerCase() ||
          isDefaultTransparent)
      ) {
        continue;
      }

      // Store transparent without #, other colors with # if needed
      overrides[key as keyof KitColors] =
        value === "transparent" ? "transparent" : normalizedValue;
    }

    return overrides;
  }

  /**
   * Merge kit colors with default colors.
   *
   * Ensures all required color properties are present by filling
   * missing values from the default color scheme.
   *
   * @param kitColors - Partial color object from kit data
   * @returns Complete KitColors object with all properties
   */
  public mergeWithDefaultColors(
    kitColors: Partial<KitColors> | null | undefined
  ): KitColors {
    if (!kitColors) {
      return DEFAULT_KIT_COLORS;
    }

    return {
      ...DEFAULT_KIT_COLORS,
      ...kitColors,
    };
  }

  /**
   * Process logo image using jSquash WebAssembly libraries.
   */
  public async processLogo(logoFile: File): Promise<File> {
    try {
      const imageBuffer = await logoFile.arrayBuffer();
      const processedBuffer = await processImageForWorkers(imageBuffer, {
        width: IMAGE_MAX_DIMENSION,
        height: IMAGE_MAX_DIMENSION,
        quality: Math.round(IMAGE_QUALITY * 100),
        format: "webp",
      });
      return new File([processedBuffer], `logo.webp`, { type: "image/webp" });
    } catch (error) {
      console.error("Error processing logo:", error);
      console.warn("Failed to process logo, using original file");
      return logoFile;
    }
  }

  /**
   * Serialize kit colors for database storage.
   *
   * Filters out default colors and returns JSON string or null.
   */
  public serializeColors(colors: KitColors | null | undefined): string | null {
    if (!colors) return null;
    const nonDefault = this.getNonDefaultColors(colors);
    return Object.keys(nonDefault).length > 0 ? JSON.stringify(nonDefault) : null;
  }

  /**
   * Assign categories to a kit (insert only, does not delete existing).
   */
  public async assignCategories(kitId: number, categoryIds: number[]): Promise<void> {
    if (categoryIds.length === 0) return;
    const categoryInserts = categoryIds.map((categoryId) =>
      this.db.op.insertInto("kit_categories").values({
        kit_id: kitId,
        category_id: categoryId,
      })
    );
    await this.exDbBatchOperation(categoryInserts);
  }

  @dataMethod()
  public async getCategories() {
    const categories = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("categories")
        .selectAll()
        .orderBy("categories.category_id", "asc")
        .execute()
    );

    return this.ok(categories);
  }

  @dataMethod()
  public async getKitsBy(filters: { categories?: string | string[] }) {
    let query = this.db.op
        .selectFrom("kits")
        .leftJoin("users", "kits.user_id", "users.user_id")
        .leftJoin("groups", "kits.group_id", "groups.group_id")
        .select([
          "kits.kit_id",
          "kits.kit_name",
          "kits.kit_description",
          "kits.kit_colors",
          "kits.kit_logo_source",
          "kits.kit_metronome",
          "kits.kit_created_on",
          "kits.kit_published_on",
          "kits.kit_status",
          "users.user_id as owner_id",
          "users.user_name as owner_name",
          "users.user_namespace as owner_namespace",
          "groups.group_id",
          "groups.group_name",
          "groups.group_description",
        ]);

      // Filter by categories if provided
      if (filters.categories) {
        const categoryNames = Array.isArray(filters.categories)
          ? filters.categories
          : [filters.categories];

        query = query
          .innerJoin("kit_categories", "kits.kit_id", "kit_categories.kit_id")
          .innerJoin(
            "categories",
            "kit_categories.category_id",
            "categories.category_id"
          )
          .where("categories.category_name", "in", categoryNames);
      }

      const kits = await this.exDbOperation(() =>
        query.orderBy("kits.kit_created_on", "desc").execute()
      );

      return this.ok(kits.map((kit) => {
        let colors: Partial<KitColors> | null = null;
        try {
          colors = JSON.parse(kit.kit_colors || "{}");
        } catch (e) {
          console.error("Failed to parse kit colors:", e);
        }

        return {
          ...kit,
          colors: this.mergeWithDefaultColors(colors),
          owner: {
            user_id: kit.owner_id,
            user_name: kit.owner_name,
            user_namespace: kit.owner_namespace,
          },
          group: kit.group_id
            ? {
                group_id: kit.group_id,
                group_name: kit.group_name,
                group_description: kit.group_description,
              }
            : null,
      };
    }));
  }

  @dataMethod()
  public async getKitById(id: number, request?: Request) {
    const kit = await this.exDbOperation(() =>
        this.db.op
          .selectFrom("kits")
          .leftJoin("users", "kits.user_id", "users.user_id")
          .leftJoin("groups", "kits.group_id", "groups.group_id")
          .where("kits.kit_id", "=", id)
          .select([
            "kits.kit_id",
            "kits.kit_name",
            "kits.kit_description",
            "kits.kit_colors",
            "kits.kit_logo_source",
            "kits.kit_metronome",
            "kits.kit_created_on",
            "kits.kit_published_on",
            "kits.kit_status",
            "users.user_id as owner_id",
            "users.user_name as owner_name",
            "users.user_namespace as owner_namespace",
            "users.user_avatar_source as owner_avatar_source",
            "groups.group_id",
            "groups.group_name",
            "groups.group_description",
          ])
          .executeTakeFirst()
      );

      if (!kit) {
        return this.none();
      }

      // Get all pads for this kit
      const pads = await this.exDbOperation(() =>
        this.db.op
          .selectFrom("pads")
          .where("pads.pad_kit_id", "=", id)
          .orderBy("pads.pad_position")
          .selectAll()
          .execute()
      );

      const padIds = pads.map((pad) => pad.pad_id);

      // Get all samples for these pads with owner information
      const padSamples = await this.exDbOperation(async () => {
        if (padIds.length === 0) return [];

        return this.db.op
          .selectFrom("pad_samples")
          .leftJoin("samples", "pad_samples.sample_id", "samples.sample_id")
          .leftJoin("users", "samples.user_id", "users.user_id")
          .where("pad_samples.pad_id", "in", padIds)
          .orderBy("pad_samples.playback_order")
          .select([
            "pad_samples.pad_id",
            "pad_samples.sample_id",
            "pad_samples.playback_order",
            "samples.sample_name",
            "samples.sample_description",
            "samples.sample_source",
            "samples.sample_created_on",
            "samples.sample_status",
            "users.user_id as sample_owner_id",
            "users.user_name as sample_owner_name",
            "users.user_namespace as sample_owner_namespace",
            "users.user_avatar_source as sample_owner_avatar_source",
          ])
          .execute();
      });

      // Build base URL for sample sources if request is provided
      let baseUrl = "";
      if (request) {
        const url = new URL(request.url);
        baseUrl = `${url.protocol}//${url.host}`;
      }

      // Combine pads with their samples
      const padsWithSamples = pads.map((pad) => ({
        ...pad,
        samples: padSamples
          .filter((ps) => ps.pad_id === pad.pad_id)
          .map((ps) => ({
            sample_id: ps.sample_id,
            sample_name: ps.sample_name,
            sample_source: ps.sample_source,
            sample_created_on: ps.sample_created_on,
            sample_status: ps.sample_status,
            owner: {
              user_id: ps.sample_owner_id,
              user_name: ps.sample_owner_name,
              user_namespace: ps.sample_owner_namespace,
              user_avatar_source: ps.sample_owner_avatar_source,
            },
            playback_order: ps.playback_order,
          })),
      }));

      // Parse and merge kit colors
      let colors: Partial<KitColors> | null = null;
      try {
        colors = JSON.parse(kit.kit_colors || "{}");
      } catch (e) {
        console.error("Failed to parse kit colors:", e);
      }

      // Get categories for this kit
      const categories = await this.exDbOperation(() =>
        this.db.op
          .selectFrom("kit_categories")
          .leftJoin(
            "categories",
            "kit_categories.category_id",
            "categories.category_id"
          )
          .where("kit_categories.kit_id", "=", id)
          .select([
            "categories.category_id",
            "categories.category_name",
            "categories.category_description",
          ])
          .execute()
      );

      return this.ok({
        ...kit,
        colors: this.mergeWithDefaultColors(colors),
        owner: {
          user_id: kit.owner_id,
          user_name: kit.owner_name,
          user_namespace: kit.owner_namespace,
          user_avatar_source: kit.owner_avatar_source,
        },
        group: kit.group_id
          ? {
              group_id: kit.group_id,
              group_name: kit.group_name,
              group_description: kit.group_description,
            }
          : null,
        categories: categories,
        pads: padsWithSamples,
      });
  }

  @formMethod({ general: "Failed to delete kit" })
  public async requestDeletion(
    request: Request,
    kitId: number,
    totpCode?: string
  ) {
    const user = await this.auth.getUserFromRequest(request);

    if (!user) {
      this.throw({ general: "You must be logged in" });
    }

    // Conditional 2FA verification
    const hasTotp = await this.user.hasTotpEnabled(user.user_id);

    if (hasTotp) {
      if (!totpCode) {
        this.throw({ general: "Verification code required" });
      }

      // verifyTotpCode is @formMethod — returns FormResponseResult at runtime
      const totpResult = await this.user.verifyTotpCode(
        user.user_id,
        totpCode!
      ) as unknown as FormResponseResult<{ verified: boolean }>;

      if (!totpResult.success) {
        const errorResult = totpResult as unknown as FormResponseError;
        this.throw({
          general:
            errorResult.errors?.general || "Invalid verification code",
        });
      }
    }

    // Get kit and verify ownership
    const kit = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("kits")
        .where("kit_id", "=", kitId)
        .select(["user_id", "kit_status"])
        .executeTakeFirst()
    );

    if (!kit) {
      this.throw({ general: "Kit not found" });
    }

    if (kit.user_id !== user.user_id) {
      this.throw({
        general: "You don't have permission to delete this kit",
      });
    }

    // Check if already pending deletion
    if (kit.kit_status === "deletion_pending") {
      this.throw({ general: "Kit is already pending deletion" });
    }

    const now = Date.now();

    // Update kit status to deletion_pending
    await this.exDbOperation(() =>
      this.db.op
        .updateTable("kits")
        .set({
          kit_status: "deletion_pending",
          deletion_requested_at: now,
        })
        .where("kit_id", "=", kitId)
        .execute()
    );

    // Get all pads for this kit
    const pads = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("pads")
        .where("pad_kit_id", "=", kitId)
        .select(["pad_id"])
        .execute()
    );

    const padIds = pads.map((p) => p.pad_id);

    // Get all sample IDs linked to these pads
    if (padIds.length > 0) {
      const padSamples = await this.exDbOperation(() =>
        this.db.op
          .selectFrom("pad_samples")
          .where("pad_id", "in", padIds)
          .select(["sample_id"])
          .execute()
      );

      const sampleIds = [...new Set(padSamples.map((ps) => ps.sample_id))];

      // Mark all related samples as deletion_pending
      if (sampleIds.length > 0) {
        await this.exDbOperation(() =>
          this.db.op
            .updateTable("samples")
            .set({
              sample_status: "deletion_pending",
              deletion_requested_at: now,
            })
            .where("sample_id", "in", sampleIds)
            .execute()
        );
      }
    }

    // Send queue message for actual deletion (handler will collect R2 keys from DB)
    await this.queue.send("delete-kit", { kitId });

    // Clear kit cache
    await this.cache.delete(`kit:play:${kitId}`);
    await this.cache.delete("kits:home");

    return this.formSuccess({ kitId });
  }

  // ──────────────────────────────────────────────────────────────
  // Queue/Cron Methods (no decorators — used in background jobs)
  // ──────────────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────────────
  // Kit Operations
  // ──────────────────────────────────────────────────────────────

  /** Get pad IDs for a kit */
  private async getKitPadIds(kitId: number): Promise<number[]> {
    const pads = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("pads")
        .where("pad_kit_id", "=", kitId)
        .select(["pad_id"])
        .execute()
    );
    return pads.map((p) => p.pad_id);
  }

  /** Get sample IDs linked to pads */
  private async getPadSampleIds(padIds: number[]): Promise<number[]> {
    if (padIds.length === 0) return [];
    const padSamples = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("pad_samples")
        .where("pad_id", "in", padIds)
        .select(["sample_id"])
        .execute()
    );
    return [...new Set(padSamples.map((ps) => ps.sample_id))];
  }

  /** Get R2 keys for samples */
  private async getSampleR2Keys(sampleIds: number[]): Promise<string[]> {
    if (sampleIds.length === 0) return [];
    const samples = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("samples")
        .where("sample_id", "in", sampleIds)
        .select(["sample_source"])
        .execute()
    );
    return samples
      .filter((s) => s.sample_source)
      .map((s) => `kits/samples/${s.sample_source}`);
  }

  /** Collect all R2 keys for a kit (logo + samples) */
  public async getKitR2Keys(kitId: number): Promise<string[]> {
    const r2Keys: string[] = [];

    // Logo
    const kit = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("kits")
        .where("kit_id", "=", kitId)
        .select(["kit_logo_source"])
        .executeTakeFirst()
    );
    if (kit?.kit_logo_source) {
      r2Keys.push(`kits/logos/${kit.kit_logo_source}`);
    }

    // Samples
    const padIds = await this.getKitPadIds(kitId);
    const sampleIds = await this.getPadSampleIds(padIds);
    const sampleKeys = await this.getSampleR2Keys(sampleIds);
    r2Keys.push(...sampleKeys);

    return r2Keys;
  }

  /** Delete kit cascade from DB (FK-safe order). Returns R2 keys. */
  public async deleteKit(kitId: number): Promise<{ r2Keys: string[] }> {
    // Check if kit exists
    const kit = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("kits")
        .where("kit_id", "=", kitId)
        .select(["kit_id"])
        .executeTakeFirst()
    );

    if (!kit) {
      // Kit doesn't exist, nothing to delete
      return { r2Keys: [] };
    }

    // Clear kit caches
    await this.cache.delete(`kit:play:${kitId}`);
    await this.cache.delete("kits:home");

    const r2Keys = await this.getKitR2Keys(kitId);
    const padIds = await this.getKitPadIds(kitId);
    const sampleIds = await this.getPadSampleIds(padIds);

    // Delete in FK-safe order
    await this.exDbOperation(() =>
      this.db.op
        .deleteFrom("kit_categories")
        .where("kit_id", "=", kitId)
        .execute()
    );

    if (padIds.length > 0) {
      await this.exDbOperation(() =>
        this.db.op
          .deleteFrom("pad_samples")
          .where("pad_id", "in", padIds)
          .execute()
      );
    }

    if (sampleIds.length > 0) {
      await this.exDbOperation(() =>
        this.db.op
          .deleteFrom("samples")
          .where("sample_id", "in", sampleIds)
          .execute()
      );
    }

    await this.exDbOperation(() =>
      this.db.op.deleteFrom("pads").where("pad_kit_id", "=", kitId).execute()
    );

    await this.exDbOperation(() =>
      this.db.op.deleteFrom("kits").where("kit_id", "=", kitId).execute()
    );

    return { r2Keys };
  }

  /** Find draft kits older than threshold */
  public async getDraftKitsOlderThan(
    threshold: number
  ): Promise<{ kit_id: number }[]> {
    return this.exDbOperation(() =>
      this.db.op
        .selectFrom("kits")
        .where("kit_status", "=", "draft")
        .where("kit_created_on", "<", threshold)
        .select(["kit_id"])
        .execute()
    );
  }

  /** Delete multiple samples in batch. Returns R2 keys. */
  public async deleteSamples(sampleIds: number[]): Promise<{ r2Keys: string[] }> {
    if (sampleIds.length === 0) return { r2Keys: [] };

    const r2Keys = await this.getSampleR2Keys(sampleIds);

    await this.exDbOperation(() =>
      this.db.op
        .deleteFrom("samples")
        .where("sample_id", "in", sampleIds)
        .execute()
    );

    return { r2Keys };
  }

  /** Delete pads and their samples. Returns R2 keys. */
  public async deletePads(padIds: number[]): Promise<{ r2Keys: string[] }> {
    if (padIds.length === 0) return { r2Keys: [] };

    const sampleIds = await this.getPadSampleIds(padIds);
    const r2Keys = await this.getSampleR2Keys(sampleIds);

    await this.exDbOperation(() =>
      this.db.op
        .deleteFrom("pad_samples")
        .where("pad_id", "in", padIds)
        .execute()
    );

    if (sampleIds.length > 0) {
      await this.exDbOperation(() =>
        this.db.op
          .deleteFrom("samples")
          .where("sample_id", "in", sampleIds)
          .execute()
      );
    }

    await this.exDbOperation(() =>
      this.db.op.deleteFrom("pads").where("pad_id", "in", padIds).execute()
    );

    return { r2Keys };
  }
}
