import { type ClassValue, clsx } from "clsx";

// ──────────────────────────────────────────────────────────────

/** Merge class names using clsx utility */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
