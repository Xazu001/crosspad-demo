import type { Command, UserData } from "../types";
import { cliFetch } from "./api";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

type GrantRightsResult = {
  userId: string;
  userName: string;
  rights: {
    admin: boolean;
    create_kit: boolean;
  };
};

type RightName = "admin" | "create_kit";

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const AVAILABLE_RIGHTS: { name: RightName; description: string }[] = [
  { name: "admin", description: "Full admin privileges" },
  { name: "create_kit", description: "Permission to create kits" },
];

// ──────────────────────────────────────────────────────────────
// Command
// ──────────────────────────────────────────────────────────────

export const grantRightsCommand: Command = {
  name: "grant-rights",
  description: "Grant or revoke user rights",
  usage: "grant-rights <userId> <right> <true|false> [-h|--help]",
  handler: async (args, ctx, log) => {
    // Check for help flag
    if (args.includes("-h") || args.includes("--help")) {
      log("info", "grant-rights - Grant or revoke user rights");
      log("info", "");
      log("info", "Usage: grant-rights <userId> <right> <true|false>");
      log("info", "");
      log("info", "Arguments:");
      log("info", "  userId   - User ID to modify");
      log("info", "  right    - Right name (see below)");
      log("info", "  value    - true to grant, false to revoke");
      log("info", "");
      log("info", "Available rights:");
      AVAILABLE_RIGHTS.forEach((r) => {
        log("info", `  ${r.name.padEnd(12)} - ${r.description}`);
      });
      log("info", "");
      log("info", "Examples:");
      log("info", "  grant-rights abc123 admin true");
      log("info", "  grant-rights abc123 create_kit false");
      return;
    }

    const [userId, rightName, valueStr] = args;

    if (!userId || !rightName || !valueStr) {
      log("error", "Usage: grant-rights <userId> <right> <true|false>");
      log("info", "Use 'grant-rights --help' for more information");
      return;
    }

    // Validate right name
    const validRight = AVAILABLE_RIGHTS.find((r) => r.name === rightName);
    if (!validRight) {
      log("error", `Unknown right: ${rightName}`);
      log("info", "Available rights: " + AVAILABLE_RIGHTS.map((r) => r.name).join(", "));
      return;
    }

    // Validate value
    const value = valueStr.toLowerCase();
    if (value !== "true" && value !== "false") {
      log("error", "Value must be 'true' or 'false'");
      return;
    }

    // Check user exists via API
    const userResult = await cliFetch<{ users: UserData }>(
      `/api/admin/cli/users?search=${encodeURIComponent(userId)}&limit=1`,
    );

    const user = userResult.success ? userResult.result.users[0] : null;
    if (!user) {
      log("error", `User not found: ${userId}`);
      return;
    }

    log(
      "info",
      `${value === "true" ? "Granting" : "Revoking"} '${rightName}' for ${user.user_name}...`,
    );

    const result = await cliFetch<GrantRightsResult>(
      `/api/admin/cli/users/${encodeURIComponent(userId)}/rights`,
      {
        method: "PUT",
        body: JSON.stringify({ [rightName]: value === "true" }),
      },
    );

    if (result.success) {
      log("success", `Rights updated for ${result.result.userName}`);
      log("info", `  admin: ${result.result.rights.admin}`);
      log("info", `  create_kit: ${result.result.rights.create_kit}`);
    } else {
      log("error", result.errors?.general ?? "Failed to update rights");
    }
  },
};
