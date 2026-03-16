// ──────────────────────────────────────────────────────────────
// Delete Unverified Users Cron Handler
// ──────────────────────────────────────────────────────────────
// Deletes users who haven't verified their email within 24 hours
// of account creation. Cleans up all related data (logins, rights, settings).
// ──────────────────────────────────────────────────────────────
import type { Tables } from "$/database/tables";

import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

import type { CronConfig } from "../types";

/** Delete unverified users cron handler - runs daily at midnight */
export const deleteUnverifiedUsersHandler: CronConfig = {
  cron: "0 0 * * *",
  handler: async (controller, env, ctx) => {
    console.log(
      `[Delete Unverified Cron] Started at ${new Date(controller.scheduledTime).toISOString()}`,
    );

    // Create Kysely instance for database operations
    const db = {
      op: new Kysely<Tables>({
        dialect: new D1Dialect({
          database: env.db,
        }),
      }),
    };

    // Calculate threshold (24 hours in milliseconds)
    const verificationPeriodMs = 24 * 60 * 60 * 1000;
    const threshold = Date.now() - verificationPeriodMs;

    try {
      // Find unverified users with login created more than 24 hours ago
      const usersToDelete = await db.op
        .selectFrom("users")
        .innerJoin("logins", "users.user_id", "logins.user_id")
        .where("users.user_verified", "=", 0)
        .where("logins.login_created_on", "<", threshold)
        .where("logins.login_verification_code", "is not", null)
        .select(["users.user_id", "users.user_name", "users.user_namespace"])
        .execute();

      if (usersToDelete.length === 0) {
        console.log("[Delete Unverified Cron] No unverified users to delete");
        return;
      }

      console.log(
        `[Delete Unverified Cron] Found ${usersToDelete.length} unverified users to delete`,
      );

      // Process each user
      for (const user of usersToDelete) {
        try {
          // Delete in correct order to respect foreign key constraints

          // 1. Delete login credentials
          await db.op.deleteFrom("logins").where("user_id", "=", user.user_id).execute();

          // 2. Delete user rights
          await db.op.deleteFrom("user_rights").where("user_id", "=", user.user_id).execute();

          // 3. Delete user settings
          await db.op.deleteFrom("user_settings").where("user_id", "=", user.user_id).execute();

          // 4. Delete the user record
          await db.op.deleteFrom("users").where("user_id", "=", user.user_id).execute();

          console.log(`[Delete Unverified Cron] Deleted user ${user.user_id} (${user.user_name})`);
        } catch (userError) {
          console.error(
            `[Delete Unverified Cron] Failed to delete user ${user.user_id}:`,
            userError,
          );
          // Continue with next user
        }
      }

      console.log(`[Delete Unverified Cron] Completed. Processed ${usersToDelete.length} users.`);
    } catch (error) {
      console.error("[Delete Unverified Cron] Error:", error);
    }
  },
};
