// ──────────────────────────────────────────────────────────────
// Kit Validation Schemas (Zod)
// ──────────────────────────────────────────────────────────────
import type { KitColors } from "$/database/schema";
import { PadPlayMode } from "@/enums";

import { z } from "zod";

// ──────────────────────────────────────────────────────────────
// Schema Definitions
// ──────────────────────────────────────────────────────────────

/** Validates pad configuration with samples, choke group, and play mode */
const padSchema = z
  .object({
    name: z
      .string()
      .min(1, "Pad name must be at least 1 character long")
      .max(50, "Pad name must be at most 50 characters long"),
    samples: z
      .array(
        z.instanceof(File).refine(
          (file) => {
            return (
              file.type === "audio/mpeg" || file.type === "audio/wav" || file.type === "audio/wave"
            );
          },
          {
            message: "Sample must be an MP3 or WAV file",
          },
        ),
      )
      .min(1, "At least one sample is required")
      .default([]),
    chokeGroup: z
      .preprocess((val) => {
        // Convert empty values to undefined, then validate as integer
        if (val === undefined || val === null || val === "") return undefined;
        const num = parseInt(String(val), 10);
        return isNaN(num) ? undefined : num;
      }, z.number().int().min(0).max(15).optional())
      .optional(),
    playMode: z
      .preprocess((val) => {
        // Convert empty values to undefined, then validate as enum
        if (val === undefined || val === null || val === "") return undefined;
        return String(val);
      }, z.nativeEnum(PadPlayMode))
      .optional(),
  })
  .refine(
    (pad) => {
      // Business rule: Multi-sample pads must use cycle mode
      // This prevents unexpected playback behavior with multiple samples
      if (pad.samples && pad.samples.length > 1) {
        return pad.playMode === PadPlayMode.CYCLE;
      }
      return true;
    },
    {
      message: "Pads with multiple samples must have cycle mode",
      path: ["playMode"],
    },
  );

// Color validation constants
const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const hexMessage = "Must be a valid hex color (e.g., #FF5733 or #F53)";

/** Validates kit color scheme configuration */
const kitColorsSchema: z.ZodType<KitColors> = z.object({
  main: z.string().regex(hexRegex, hexMessage).optional(),
  mainHover: z.string().regex(hexRegex, hexMessage).optional(),
  mainForeground: z.string().regex(hexRegex, hexMessage).optional(),
  border: z.string().regex(hexRegex, hexMessage).optional(),
  card: z.string().regex(hexRegex, hexMessage).optional(),
  cardBorder: z.string().regex(hexRegex, hexMessage).optional(),
  background: z.string().regex(hexRegex, hexMessage).optional(),
  foreground: z.string().regex(hexRegex, hexMessage).optional(),
});

/** Validates kit metadata (name, description, logo) */
const aboutSchema = z.object({
  name: z
    .string()
    .min(1, "Kit name must be at least 1 character long")
    .max(100, "Kit name must be at most 100 characters long"),
  description: z
    .string()
    .min(1, "Kit description must be at least 1 character long")
    .max(500, "Kit description must be at most 500 characters long"),
  logo: z.any().optional(), // File object - validated on upload
});

/**
 * Main schema for creating/updating kits.
 *
 * Validates complete kit structure including metadata, pads, colors, and categories.
 * Enforces business rules like exactly 16 pads and mandatory samples per pad.
 */
/** Pad schema for updates - samples can be Files (new) or strings (existing) */
const updatePadSchema = z.object({
  name: z.string().min(1).max(50),
  samples: z.array(z.union([z.instanceof(File), z.string()])).default([]),
  chokeGroup: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === "") return undefined;
      const num = parseInt(String(val), 10);
      return isNaN(num) ? undefined : num;
    }, z.number().int().min(0).max(15).optional())
    .optional(),
  playMode: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === "") return undefined;
      return String(val);
    }, z.nativeEnum(PadPlayMode))
    .optional(),
});

export const updateKitSchema = z.object({
  about: aboutSchema,
  pads: z.array(updatePadSchema).min(16).max(16),
  colors: kitColorsSchema.optional(),
  categories: z.preprocess((val) => {
    if (val === undefined) return [];
    if (Array.isArray(val)) {
      return val.map((v) => parseInt(String(v), 10));
    }
    return [];
  }, z.array(z.number()).default([])),
});

export const createKitSchema = z.object({
  about: aboutSchema.refine(
    (data) => data.name.trim().length > 0 && data.description.trim().length > 0,
    {
      message: "Kit name and description are required",
      path: ["about"], // Error appears on about field for better UX
    },
  ),
  pads: z
    .array(padSchema)
    .min(16, "Kit must have exactly 16 pads configured")
    .max(16, "Kit must have exactly 16 pads")
    .refine((pads) => pads.every((pad) => pad.samples && pad.samples.length > 0), {
      message: "Each pad must have at least one sample",
      path: ["pads"],
    }),
  colors: kitColorsSchema.optional(),
  categories: z.preprocess((val) => {
    // Convert various input types to array of numbers
    if (val === undefined) return [];
    if (Array.isArray(val)) {
      return val.map((v) => parseInt(String(v), 10));
    }
    return [];
  }, z.array(z.number()).default([])),
});
