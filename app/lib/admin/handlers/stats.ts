import type { Command } from "../types";

export const statsCommand: Command = {
  name: "stats",
  description: "Show system statistics",
  usage: "stats",
  handler: (_args, ctx, log) => {
    const { users } = ctx;
    log("info", "System Statistics:");
    log("info", `  Total Users:    ${users.length}`);
    log("info", `  Verified Users: ${users.filter((u) => u.user_verified).length}`);
    log("info", `  Active Users:   ${users.filter((u) => u.user_status === "active").length}`);
  },
};
