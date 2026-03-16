import { useNavigate } from "react-router";

import type { CommandContext } from "./types";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type UseAdminContextReturn = {
  context: CommandContext;
};

// ──────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────

export function useAdminContext(): UseAdminContextReturn {
  const navigate = useNavigate();

  const context: CommandContext = { navigate };

  return { context };
}
