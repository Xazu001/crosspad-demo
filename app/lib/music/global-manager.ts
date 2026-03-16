// ──────────────────────────────────────────────────────────────
// Global Music Manager
// ──────────────────────────────────────────────────────────────
import { KitMusicManager } from "./test";

// Global music manager instance that persists across route changes
let globalMusicManager: KitMusicManager | null = null;

/**
 * Get or create the global music manager instance.
 * Ensures only one instance exists throughout the app lifecycle.
 *
 * @returns The global KitMusicManager instance
 */
export function getGlobalMusicManager(): KitMusicManager {
  if (!globalMusicManager) {
    globalMusicManager = new KitMusicManager();
  }
  return globalMusicManager;
}

/**
 * Reset and dispose of the global music manager.
 * Cleans up audio resources and nullifies the reference.
 */
export function resetGlobalMusicManager(): void {
  if (globalMusicManager) {
    globalMusicManager.dispose();
    globalMusicManager = null;
  }
}

// Clean up on page unload to prevent memory leaks
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    resetGlobalMusicManager();
  });
}
