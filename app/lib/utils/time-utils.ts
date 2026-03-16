// ──────────────────────────────────────────────────────────────

/** Format time in seconds to MM:SS format */
export function formatTime(time: number): string {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/** Format time in milliseconds to MM:SS format */
export function formatTimeFromMs(timeMs: number): string {
  return formatTime(timeMs / 1000);
}

// ──────────────────────────────────────────────────────────────

/** Generate timestamp string for file naming */
export function generateFileTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/:/g, "-");
}

/** Generate default recording filename */
export function generateRecordingFilename(): string {
  return `recording-${generateFileTimestamp()}.json`;
}
