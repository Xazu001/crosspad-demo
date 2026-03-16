// ──────────────────────────────────────────────────────────────
// Anonymize Users Cron Handler
// ──────────────────────────────────────────────────────────────
// Processes anonymization queue - anonymizes users whose 24-day
// grace period has expired.
// ──────────────────────────────────────────────────────────────
import type { Tables } from "$/database/tables";

import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

import type { CronConfig } from "../types";

/** Anonymize users cron handler - runs daily at midnight */
export const anonymizeUsersHandler: CronConfig = {
  cron: "0 0 * * *",
  handler: async (controller, env, ctx) => {
    console.log(`[Anonymize Cron] Started at ${new Date(controller.scheduledTime).toISOString()}`);

    // Create Kysely instance for database operations
    const db = {
      op: new Kysely<Tables>({
        dialect: new D1Dialect({
          database: env.db,
        }),
      }),
    };

    // Calculate grace period threshold (24 days in milliseconds)
    const gracePeriodMs = 24 * 24 * 60 * 60 * 1000;
    const threshold = Date.now() - gracePeriodMs;

    try {
      // Query users pending anonymization past grace period
      const usersToAnonymize = await db.op
        .selectFrom("users")
        .where("user_status", "=", "anonimization_pending")
        .where("anonymization_requested_at", "<", threshold)
        .select(["user_id", "user_name"])
        .execute();

      if (usersToAnonymize.length === 0) {
        console.log("[Anonymize Cron] No users to anonymize");
        return;
      }

      console.log(`[Anonymize Cron] Found ${usersToAnonymize.length} users to anonymize`);

      // Process each user
      for (const user of usersToAnonymize) {
        try {
          // Anonymize user data
          await db.op
            .updateTable("users")
            .set({
              user_name: "User",
              user_namespace: `anon_${user.user_id}`,
              user_avatar_source: null,
              user_status: "anonimized",
              anonymization_requested_at: null,
              anonymization_undo_code: null,
            })
            .where("user_id", "=", user.user_id)
            .execute();

          // Delete login credentials
          await db.op.deleteFrom("logins").where("user_id", "=", user.user_id).execute();

          console.log(`[Anonymize Cron] Anonymized user ${user.user_id} (${user.user_name})`);
        } catch (userError) {
          console.error(`[Anonymize Cron] Failed to anonymize user ${user.user_id}:`, userError);
          // Continue with next user
        }
      }

      console.log(`[Anonymize Cron] Completed. Processed ${usersToAnonymize.length} users.`);
    } catch (error) {
      console.error("[Anonymize Cron] Error:", error);
    }
  },
};
