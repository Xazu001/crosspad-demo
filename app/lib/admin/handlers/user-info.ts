import type { Command } from "../types";

export const userInfoCommand: Command = {
  name: "user-info",
  description: "Show detailed info about a user",
  usage: "user-info <userId>",
  handler: (args, ctx, log) => {
    const { users } = ctx;
    const userId = args[0];

    if (!userId) {
      log("error", "Usage: user-info <userId>");
      return;
    }

    const user = users.find((u) => u.user_id === userId);
    if (!user) {
      log("error", `User not found: ${userId}`);
      return;
    }

    log("info", `User: ${user.user_name}`);
    log("info", `  ID:         ${user.user_id}`);
    log("info", `  Namespace:  ${user.user_namespace}`);
    log("info", `  Verified:   ${user.user_verified ? "Yes" : "No"}`);
    log("info", `  Status:     ${user.user_status}`);
    log(
      "info",
      `  Created:    ${user.created_on ? new Date(user.created_on).toISOString() : "Unknown"}`,
    );
  },
};
