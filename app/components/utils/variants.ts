import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

// ──────────────────────────────────────────────────────────────

/** Create class variants using class-variance-authority */
const createVariants = <T>(...args: Parameters<typeof cva<T>>) => cva(...args);

export { createVariants, cva };
export type { VariantProps };
