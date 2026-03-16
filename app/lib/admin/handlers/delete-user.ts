import type { Command, UserData } from "../types";
import { cliFetch } from "./api";

type DeleteUserResult = {
  deleted: boolean;
  userId: string;
  resourcesDeleted: {
    kits: number;
    samples: number;
    groups: number;
    groupMemberships: number;
  };
};

export const deleteUserCommand: Command = {
  name: "delete-user",
  description: "Delete a user and all their resources",
  usage: "delete-user <userId>",
  handler: async (args, ctx, log) => {
    const userId = args[0];

    if (!userId) {
      log("error", "Usage: delete-user <userId>");
      log("info", "Use 'users' command to list user IDs");
      return;
    }

    // Fetch user info to confirm deletion
    const userResult = await cliFetch<{ users: UserData }>(
      `/api/admin/cli/users?search=${encodeURIComponent(userId)}&limit=1`,
    );

    const user = userResult.success ? userResult.result.users[0] : null;
    if (!user) {
      log("error", `User not found: ${userId}`);
      return;
    }

    log("warning", `Deleting user: ${user.user_name} (${userId})...`);

    const result = await cliFetch<DeleteUserResult>(
      `/api/admin/cli/users/${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    );

    if (result.success) {
      log("success", `User ${userId} deleted successfully.`);
      log(
        "info",
        `Resources: kits=${result.result.resourcesDeleted.kits}, samples=${result.result.resourcesDeleted.samples}, groups=${result.result.resourcesDeleted.groups}`,
      );
    } else {
      log("error", result.errors?.general ?? "Failed to delete user");
    }
  },
};
