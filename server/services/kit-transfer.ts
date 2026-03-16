// ──────────────────────────────────────────────────────────────
// KitTransferService - Kit Transfer Operations
// ──────────────────────────────────────────────────────────────
import { KitTransferManager } from "$/cloudflare";
import { formMethod } from "$/lib/decorators";
import { BaseService } from "$/services/base";

import type { Database } from "$/core";

/**
 * Service for managing kit transfer operations.
 *
 * Handles creation, retrieval, and acceptance of transfer codes.
 * Works with KitTransferManager for KV storage and queue for async transfer.
 */
export class KitTransferService extends BaseService {
  private _transferManager: KitTransferManager | null = null;

  constructor(db: Database) {
    super(db);
  }

  // ──────────────────────────────────────────────────────────────
  // Manager Access
  // ──────────────────────────────────────────────────────────────

  /** Get the kit transfer manager instance */
  public get transferManager(): KitTransferManager {
    if (!this._transferManager) {
      throw new Error("KitTransferManager not initialized");
    }
    return this._transferManager;
  }

  /**
   * Initialize managers from environment bindings.
   * Called by BaseService.initializeManagers.
   */
  public override initializeManagers(env: Env): void {
    super.initializeManagers(env);

    if (env.kv) {
      this._transferManager = new KitTransferManager(env.kv);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Transfer Code Operations
  // ──────────────────────────────────────────────────────────────

  @formMethod({ general: "Failed to create transfer code" })
  public async createTransferCode(request: Request, kitId: number) {
    const user = await this.auth.getUserFromRequest(request);

    if (!user) {
      this.throw({
        general: "You must be logged in to transfer a kit",
      });
    }

    // Verify kit ownership
    const kit = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("kits")
        .where("kit_id", "=", kitId)
        .select(["user_id", "kit_name"])
        .executeTakeFirst()
    );

    if (!kit) {
      this.throw({ general: "Kit not found" });
    }

    if (kit.user_id !== user.user_id) {
      this.throw({
        general: "You don't have access to transfer this kit",
      });
    }

    // Check for existing transfer code for this kit and delete it
    const existingEntry = await this.transferManager.getCodeByKitId(
      kitId,
      user.user_id
    );
    if (existingEntry) {
      await this.transferManager.deleteCode(existingEntry.code, user.user_id);
    }

    // Create transfer code
    const code = await this.transferManager.createCode(
      kitId,
      kit.kit_name,
      user.user_id,
      user.user_name || "Unknown"
    );

    // Get the entry to return expiration
    const entry = await this.transferManager.getCode(code);

    return this.formSuccess({
      kitId,
      code,
      expiresAt: entry?.expiresAt ?? Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
  }

  @formMethod({ general: "Failed to get transfer code" })
  public async getTransferCode(code: string) {
    const entry = await this.transferManager.getCode(code);

    if (!entry) {
      this.throw({
        general: "Invalid or expired transfer code",
      });
    }

    // Get additional kit info
    const kit = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("kits")
        .where("kit_id", "=", entry.kitId)
        .select(["kit_description", "kit_logo_source", "kit_colors"])
        .executeTakeFirst()
    );

    return this.formSuccess({
      ...entry,
      kitDescription: kit?.kit_description ?? null,
    });
  }

  @formMethod({ general: "Failed to accept transfer" })
  public async acceptTransfer(request: Request, code: string) {
    const user = await this.auth.getUserFromRequest(request);

    if (!user) {
      this.throw({
        general: "You must be logged in to accept a kit transfer",
      });
    }

    // Get and validate transfer code
    const entry = await this.transferManager.getCode(code);

    if (!entry) {
      this.throw({
        general: "Invalid or expired transfer code",
      });
    }

    // Prevent self-transfer
    if (entry.fromUserId === user.user_id) {
      this.throw({
        general: "You cannot transfer a kit to yourself",
      });
    }

    // Verify kit still exists and belongs to original owner
    const kit = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("kits")
        .where("kit_id", "=", entry.kitId)
        .select(["user_id", "kit_name"])
        .executeTakeFirst()
    );

    if (!kit) {
      await this.transferManager.deleteCode(code, entry.fromUserId);
      this.throw({ general: "Kit no longer exists" });
    }

    if (kit.user_id !== entry.fromUserId) {
      await this.transferManager.deleteCode(code, entry.fromUserId);
      this.throw({
        general: "Kit ownership has changed, transfer cancelled",
      });
    }

    // Queue the transfer job
    await this.queue.send("transfer-kit", {
      kitId: entry.kitId,
      fromUserId: entry.fromUserId,
      toUserId: user.user_id,
    });

    // Delete the transfer code
    await this.transferManager.deleteCode(code, entry.fromUserId);

    return this.formSuccess({
      kitId: entry.kitId,
      kitName: entry.kitName,
    });
  }

  /**
   * List all active transfer codes for the current user.
   */
  @formMethod({ general: "Failed to list transfer codes" })
  public async listUserTransferCodes(request: Request) {
    const user = await this.auth.getUserFromRequest(request);

    if (!user) {
      this.throw({
        general: "You must be logged in to view transfer codes",
      });
    }

    const codes = await this.transferManager.listUserCodes(user.user_id);

    return this.formSuccess(codes);
  }

  /**
   * Get transfer code for a specific kit.
   */
  @formMethod({ general: "Failed to get transfer code" })
  public async getTransferCodeByKitId(request: Request, kitId: number) {
    const user = await this.auth.getUserFromRequest(request);

    if (!user) {
      this.throw({
        general: "You must be logged in to view transfer codes",
      });
    }

    const entry = await this.transferManager.getCodeByKitId(
      kitId,
      user.user_id
    );

    return this.formSuccess(entry);
  }

  /**
   * Cancel a transfer code.
   */
  @formMethod({ general: "Failed to cancel transfer" })
  public async cancelTransferCode(request: Request, code: string) {
    const user = await this.auth.getUserFromRequest(request);

    if (!user) {
      this.throw({
        general: "You must be logged in to cancel a transfer",
      });
    }

    // Verify the code belongs to this user
    const entry = await this.transferManager.getCode(code);

    if (!entry) {
      this.throw({
        general: "Invalid or expired transfer code",
      });
    }

    if (entry.fromUserId !== user.user_id) {
      this.throw({
        general: "You can only cancel your own transfer codes",
      });
    }

    // Delete the code
    await this.transferManager.deleteCode(code, user.user_id);

    return this.formSuccess({ success: true });
  }
}
