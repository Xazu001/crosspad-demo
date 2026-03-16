// ──────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────

import type { Compilable } from "kysely";

import { dataMethod, formMethod } from "$/lib/decorators";


import { BaseService, type FormResponseResult } from "../base";

import type { Database } from "$/core";
import type { UserStatusType } from "@/enums";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type DeleteUserResult = {
  deleted: boolean;
  userId: string;
  resourcesDeleted: {
    kits: number;
    samples: number;
    groups: number;
    groupMemberships: number;
  };
};

// ──────────────────────────────────────────────────────────────
// Admin Service
// ──────────────────────────────────────────────────────────────

/**
 * Administrative operations service.
 *
 * Provides admin-only functionality like user management,
 * resource cleanup, and system administration tasks.
 */
export class AdminService extends BaseService {
  constructor(db: Database) {
    super(db);
  }

  // ──────────────────────────────────────────────────────────────
  // User Management
  // ──────────────────────────────────────────────────────────────

  /**
   * Check if a user has admin privileges.
   *
   * @param userId - User ID to check
   * @returns Promise resolving to boolean indicating admin status
   */
  @dataMethod()
  public async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const rights = await this.exDbOperation(() =>
        this.db.op
          .selectFrom("user_rights")
          .select("user_admin")
          .where("user_id", "=", userId)
          .executeTakeFirst()
      );

      // SQLite stores booleans as integers (0/1)
      return rights?.user_admin === 1;
    } catch (error) {
      console.error("[AdminService] Failed to check admin status:", error);
      return false;
    }
  }

  /**
   * Delete a user and all their associated resources.
   *
   * This is a destructive operation that:
   * 1. Deletes all user's kits (and associated pads, kit_categories)
   * 2. Deletes all user's samples
   * 3. Removes user from all groups (group_members)
   * 4. Deletes groups owned by the user (transfers ownership or deletes)
   * 5. Deletes user's login record
   * 6. Deletes user's settings
   * 7. Deletes user's rights
   * 8. Deletes the user record itself
   *
   * @param userId - User ID to delete
   * @param request - Request to identify the admin performing deletion
   * @returns FormResponseResult with deletion details
   */
  @formMethod({ general: "Failed to delete user" })
  public async deleteUser(userId: string, request: Request) {
    // Get the requesting admin user
    const requestingUser = await this.auth.getUserFromRequest(request);

    if (!requestingUser) {
      this.throw({ general: "Authentication required" });
    }

    // Prevent self-deletion
    if (requestingUser.user_id === userId) {
      this.throw({
        general: "Cannot delete your own account via admin panel",
      });
    }

    // Verify user exists
    const user = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("users")
        .select(["user_id", "user_name", "user_status"])
        .where("user_id", "=", userId)
        .executeTakeFirst()
    );

    if (!user) {
      this.throw({ general: "User not found" });
    }

    // Fetch all related data (use exDbOperation for arrays - exDbBatchOperation returns first row only)
    const [userKits, userSamples, ownedGroups, memberships, kitPads] =
      await Promise.all([
        this.exDbOperation(() =>
          this.db.op
            .selectFrom("kits")
            .select("kit_id")
            .where("user_id", "=", userId)
            .execute()
        ),
        this.exDbOperation(() =>
          this.db.op
            .selectFrom("samples")
            .select("sample_id")
            .where("user_id", "=", userId)
            .execute()
        ),
        this.exDbOperation(() =>
          this.db.op
            .selectFrom("groups")
            .select("group_id")
            .where("group_owner_id", "=", userId)
            .execute()
        ),
        this.exDbOperation(() =>
          this.db.op
            .selectFrom("group_members")
            .select("id")
            .where("user_id", "=", userId)
            .execute()
        ),
        this.exDbOperation(() =>
          this.db.op
            .selectFrom("pads")
            .select("pad_id")
            .where(
              "pad_kit_id",
              "in",
              this.db.op
                .selectFrom("kits")
                .select("kit_id")
                .where("user_id", "=", userId)
            )
            .execute()
        ),
      ]);

    const resourcesDeleted = {
      kits: userKits.length,
      samples: userSamples.length,
      groups: ownedGroups.length,
      groupMemberships: memberships.length,
    };

    const kitIds = userKits.map((k) => k.kit_id);
    const sampleIds = userSamples.map((s) => s.sample_id);
    const groupIds = ownedGroups.map((g) => g.group_id);
    const padIds = kitPads.map((p) => p.pad_id);

    // Build delete queries in correct FK order (using Kysely for Compilable support)
    const deleteQueries: Compilable<unknown>[] = [];

    // 1. kit_categories (references kits)
    if (kitIds.length > 0) {
      deleteQueries.push(
        this.db.op.deleteFrom("kit_categories").where("kit_id", "in", kitIds)
      );
    }

    // 2. pad_samples (references pads AND samples) - MUST be before pads and samples
    if (padIds.length > 0) {
      deleteQueries.push(
        this.db.op.deleteFrom("pad_samples").where("pad_id", "in", padIds)
      );
    }
    if (sampleIds.length > 0) {
      deleteQueries.push(
        this.db.op
          .deleteFrom("pad_samples")
          .where("sample_id", "in", sampleIds)
      );
    }

    // 3. pads (references kits)
    if (kitIds.length > 0) {
      deleteQueries.push(
        this.db.op.deleteFrom("pads").where("pad_kit_id", "in", kitIds)
      );
    }

    // 4. kits
    deleteQueries.push(
      this.db.op.deleteFrom("kits").where("user_id", "=", userId)
    );

    // 5. samples
    deleteQueries.push(
      this.db.op.deleteFrom("samples").where("user_id", "=", userId)
    );

    // 6. group_members for user
    deleteQueries.push(
      this.db.op.deleteFrom("group_members").where("user_id", "=", userId)
    );

    // 7. group_members for owned groups + groups themselves
    if (groupIds.length > 0) {
      deleteQueries.push(
        this.db.op
          .deleteFrom("group_members")
          .where("group_id", "in", groupIds)
      );
      deleteQueries.push(
        this.db.op.deleteFrom("groups").where("group_id", "in", groupIds)
      );
    }

    // 8. logins, user_settings, user_rights, users
    deleteQueries.push(
      this.db.op.deleteFrom("logins").where("user_id", "=", userId)
    );
    deleteQueries.push(
      this.db.op.deleteFrom("user_settings").where("user_id", "=", userId)
    );
    deleteQueries.push(
      this.db.op.deleteFrom("user_rights").where("user_id", "=", userId)
    );
    deleteQueries.push(
      this.db.op.deleteFrom("users").where("user_id", "=", userId)
    );

    // Execute all deletes in one batch
    await this.exDbBatchOperation(deleteQueries);

    await this.cache.delete("cache:kits:home");

    return this.formSuccess({
      deleted: true,
      userId,
      resourcesDeleted,
    });
  }

  /**
   * Grant or revoke user rights.
   *
   * @param userId - User ID to modify
   * @param rights - Rights to set (admin, create_kit)
   * @param request - Request to identify the admin
   * @returns FormResponseResult with updated rights
   */
  @formMethod({ general: "Failed to update user rights" })
  public async grantRights(
    userId: string,
    rights: { admin?: boolean; create_kit?: boolean },
    request: Request
  ) {
    const requestingUser = await this.auth.getUserFromRequest(request);
    if (!requestingUser) {
      this.throw({ general: "Authentication required" });
    }

    // Verify target user exists
    const user = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("users")
        .select(["user_id", "user_name"])
        .where("user_id", "=", userId)
        .executeTakeFirst()
    );

    if (!user) {
      this.throw({ general: "User not found" });
    }

    // Upsert user_rights
    const existing = await this.exDbOperation(() =>
      this.db.op
        .selectFrom("user_rights")
        .select(["user_right_id"])
        .where("user_id", "=", userId)
        .executeTakeFirst()
    );

    if (existing) {
      await this.exDbOperation(() =>
        this.db.op
          .updateTable("user_rights")
          .set({
            user_admin: rights.admin ?? false,
            user_create_kit: rights.create_kit ?? false,
          })
          .where("user_id", "=", userId)
          .execute()
      );
    } else {
      await this.exDbOperation(() =>
        this.db.op
          .insertInto("user_rights")
          .values({
            user_id: userId,
            user_admin: rights.admin ?? false,
            user_create_kit: rights.create_kit ?? false,
          })
          .execute()
      );
    }

    return this.formSuccess({
      userId,
      userName: user.user_name,
      rights: {
        admin: rights.admin ?? false,
        create_kit: rights.create_kit ?? false,
      },
    });
  }

  /**
   * Get list of users with pagination and filtering.
   *
   * @param options - Pagination and filter options
   * @returns FormResponseResult with user list
   */
  @dataMethod()
  public async getUsers(options?: {
    limit?: number;
    offset?: number;
    status?: UserStatusType;
    search?: string;
  }) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const search = options?.search?.trim();

    // Build base query with optional search filter
    const buildQuery = () => {
      let query = this.db.op
        .selectFrom("users")
        .leftJoin("logins", "users.user_id", "logins.user_id")
        .select([
          "users.user_id",
          "users.user_name",
          "users.user_namespace",
          "users.user_verified",
          "users.user_status",
          "logins.login_created_on as created_on",
        ]);

      if (search) {
        // Search by user_name OR user_namespace (case-insensitive)
        query = query.where((eb) =>
          eb.or([
            eb("users.user_name", "like", `%${search}%`),
            eb("users.user_namespace", "like", `%${search}%`),
          ])
        );
      }

      if (options?.status) {
        query = query.where("users.user_status", "=", options.status);
      }

      return query.limit(limit).offset(offset);
    };

    // Get users with login info
    const users = await this.exDbOperation(() => buildQuery().execute());

    // Get total count with same filters
    const countResult = await this.exDbOperation(() => {
      let query = this.db.op
        .selectFrom("users")
        .select((eb) => eb.fn.count("user_id").as("count"));

      if (search) {
        query = query.where((eb) =>
          eb.or([
            eb("users.user_name", "like", `%${search}%`),
            eb("users.user_namespace", "like", `%${search}%`),
          ])
        );
      }

      if (options?.status) {
        query = query.where("users.user_status", "=", options.status);
      }

      return query.executeTakeFirst();
    });

    return this.ok({
      users,
      total: Number(countResult?.count ?? 0),
      search: search ?? null,
    });
  }
}
