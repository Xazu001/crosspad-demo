// ──────────────────────────────────────────────────────────────
// Music Module Index
// ──────────────────────────────────────────────────────────────
import { type PadPlayMode } from "@/enums";

export * from "./controller";

type PadPlayModeType = typeof PadPlayMode;

type Sample = BaseSample & ({} | { file: File });

type BaseSample = {
  playMode: keyof PadPlayModeType;
  chokeGroup?: number;
};

/**
 * Legacy music controller for backward compatibility.
 * @deprecated Use the new controller system instead
 */
export class LegacyMusicController {
  public async addSample(_sample: Sample) {
    // TODO: Implement sample addition logic for legacy controller if needed
  }
}
