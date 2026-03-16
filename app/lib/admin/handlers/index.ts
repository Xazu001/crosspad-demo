import type { Command } from "../types";
import { deleteUserCommand } from "./delete-user";
import { exitCommand } from "./exit";
import { grantRightsCommand } from "./grant-rights";
import { createHelpCommand } from "./help";
import { statsCommand } from "./stats";
import { userInfoCommand } from "./user-info";
import { usersCommand } from "./users";

// ──────────────────────────────────────────────────────────────
// Commands
// ──────────────────────────────────────────────────────────────
// adminCommands is a static array built once at module load time.
// help captures the array by reference so it lists all commands
// (including itself) when invoked.
// ──────────────────────────────────────────────────────────────

export const adminCommands: Command[] = [];

const helpCommand = createHelpCommand(adminCommands);

adminCommands.push(
  helpCommand,
  usersCommand,
  deleteUserCommand,
  grantRightsCommand,
  userInfoCommand,
  statsCommand,
  exitCommand,
);
