// ──────────────────────────────────────────────────────────────
// Cron Handler Registry
// ──────────────────────────────────────────────────────────────
import type { CronConfig } from "./types";

/** Handler registry with lazy loading */
const handlers = new Map<string, CronConfig>();

/** Register a handler */
export function registerCron(config: CronConfig): void {
  handlers.set(config.cron, config);
}

/** Ensure handlers are loaded */
async function ensureHandlersLoaded(): Promise<void> {
  if (handlers.size === 0) {
    const { exampleCronHandler } = await import("./handlers/example");
    const { anonymizeUsersHandler } = await import("./handlers/anonymize-users");
    const { deleteUnverifiedUsersHandler } = await import("./handlers/delete-unverified-users");
    const { deleteDraftSamplesHandler } = await import("./handlers/delete-draft-samples");
    registerCron(exampleCronHandler);
    registerCron(anonymizeUsersHandler);
    registerCron(deleteUnverifiedUsersHandler);
    registerCron(deleteDraftSamplesHandler);
  }
}

/** Get handler by cron expression */
export async function getCronHandler(cron: string): Promise<CronConfig | undefined> {
  await ensureHandlersLoaded();
  return handlers.get(cron);
}

/** Get all registered cron handlers */
export async function getAllCronHandlers(): Promise<CronConfig[]> {
  await ensureHandlersLoaded();
  return Array.from(handlers.values());
}
