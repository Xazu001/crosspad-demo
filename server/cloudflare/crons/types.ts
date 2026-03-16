// ──────────────────────────────────────────────────────────────
// Cron Types
// ──────────────────────────────────────────────────────────────
import type { Env } from "../../setup";

/** Cron handler function */
export type CronHandler = (
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
) => Promise<void>;

/** Handler configuration */
export interface CronConfig {
  cron: string;
  handler: CronHandler;
}
