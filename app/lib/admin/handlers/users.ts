import type { Command, UserData } from "../types";
import { cliFetch } from "./api";

export const usersCommand: Command = {
  name: "users",
  description: "List users with optional search",
  usage: "users [search] [--limit N]",
  handler: async (args, ctx, log) => {
    const limitIdx = args.indexOf("--limit");
    const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1] ?? "50", 10) : 50;

    // First non-flag argument is the search query
    const search = args.find((arg) => !arg.startsWith("--"));

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("limit", String(limit));

    log("info", `Fetching users${search ? ` matching "${search}"` : ""}...`);

    const result = await cliFetch<{
      users: UserData;
      total: number;
      search: string | null;
    }>(`/api/admin/cli/users?${params.toString()}`);

    if (!result.success) {
      log("error", result.errors?.general ?? "Failed to fetch users");
      return;
    }

    const { users, total } = result.result;

    log("info", `Showing ${Math.min(limit, total)} of ${total} users:`);
    log(
      "info",
      "  ID                                   | Name               | Namespace          | Status",
    );
    log("info", "  " + "-".repeat(90));

    users.forEach((user) => {
      log(
        "info",
        `  ${user.user_id} | ${(user.user_name ?? "").padEnd(18)} | ${(user.user_namespace ?? "").padEnd(18)} | ${user.user_status}`,
      );
    });
  },
};
