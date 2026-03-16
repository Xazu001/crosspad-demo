import type { KitColors } from "$/database/schema";
import { PadPlayMode } from "@/enums";
import type { About, CreateKitData, Pad } from "@/types/kit";
import { createInitialPads } from "@/utils/pad-mapping";

import { create } from "zustand";

/**
 * CreateKit Store - manages kit creation state
 *
 * IMPORTANT: This store uses placeholder names (Pad 1, Pad 2, etc.)
 * When kit is saved to database, server will convert to proper P1-P16 names
 * based on UI position using pad-mapping utilities.
 */

export type CreateKitState = {
  data: CreateKitData;
  setPads: (pads: Pad[]) => void;
  addSamplesToPad: (padIndex: number, samples: (string | File)[]) => void;
  setPadSample: (padIndex: number, samples: (string | File)[]) => void;
  clearPadSamples: (padIndex: number) => void;
  removeSampleFromPad: (padIndex: number, sampleIndex: number) => void;
  setPadChokeGroup: (padIndex: number, chokeGroup: number) => void;
  setPadPlayMode: (
    padIndex: number,
    playMode: (typeof PadPlayMode)[keyof typeof PadPlayMode],
  ) => void;
  setKitColors: (kitColors: KitColors) => void;
  setAbout: (about: About) => void;
  setCategories: (categories: number[]) => void;
};

/** Store for managing kit creation state and operations */
export const useCreateKitStore = create<CreateKitState>((set) => ({
  data: {
    pads: createInitialPads(),
    colors: {
      main: undefined,
      mainHover: undefined,
      mainForeground: undefined,
      border: undefined,
      card: undefined,
      cardBorder: undefined,
      background: undefined,
      foreground: undefined,
    },
    about: {
      name: "",
      description: "",
      logo: undefined,
    },
    categories: [],
  },
  setPads: (pads: Pad[]) => set((state) => ({ data: { ...state.data, pads } })),
  addSamplesToPad: (padIndex: number, samples: (string | File)[]) =>
    set((state) => {
      if (padIndex < 0 || padIndex >= state.data.pads.length) return state;
      const pads = [...state.data.pads];
      const target = pads[padIndex];
      const newSamples = [...target.samples, ...samples];

      // Auto-set to cycle mode if more than one sample
      const playMode = newSamples.length > 1 ? PadPlayMode.CYCLE : target.playMode;

      pads[padIndex] = { ...target, samples: newSamples, playMode };
      return { data: { ...state.data, pads } };
    }),
  setPadSample: (padIndex: number, samples: (string | File)[]) =>
    set((state) => {
      if (padIndex < 0 || padIndex >= state.data.pads.length) return state;
      const pads = [...state.data.pads];
      const target = pads[padIndex];

      // Auto-set to cycle mode if more than one sample
      const playMode = samples.length > 1 ? PadPlayMode.CYCLE : target.playMode;

      pads[padIndex] = { ...target, samples, playMode };
      return { data: { ...state.data, pads } };
    }),
  clearPadSamples: (padIndex: number) =>
    set((state) => {
      if (padIndex < 0 || padIndex >= state.data.pads.length) return state;
      const pads = [...state.data.pads];
      const target = pads[padIndex];
      pads[padIndex] = { ...target, samples: [], playMode: PadPlayMode.TAP };
      return { data: { ...state.data, pads } };
    }),
  removeSampleFromPad: (padIndex: number, sampleIndex: number) =>
    set((state) => {
      if (padIndex < 0 || padIndex >= state.data.pads.length) return state;
      if (sampleIndex < 0 || sampleIndex >= state.data.pads[padIndex].samples.length) {
        return state;
      }

      const pads = [...state.data.pads];
      const target = pads[padIndex];
      const newSamples = [...target.samples];
      newSamples.splice(sampleIndex, 1);

      // Reset to tap mode if now only one sample
      const playMode = newSamples.length <= 1 ? PadPlayMode.TAP : target.playMode;

      pads[padIndex] = { ...target, samples: newSamples, playMode };
      return { data: { ...state.data, pads } };
    }),
  setPadChokeGroup: (padIndex, chokeGroup) =>
    set((state) => {
      if (padIndex < 0 || padIndex >= state.data.pads.length) return state;
      const pads = [...state.data.pads];
      const target = pads[padIndex];
      pads[padIndex] = { ...target, chokeGroup };
      return { data: { ...state.data, pads } };
    }),
  setPadPlayMode: (padIndex, playMode) =>
    set((state) => {
      if (padIndex < 0 || padIndex >= state.data.pads.length) return state;
      const pads = [...state.data.pads];
      const target = pads[padIndex];
      pads[padIndex] = { ...target, playMode };
      return { data: { ...state.data, pads } };
    }),
  setKitColors: (colors: KitColors) => set((state) => ({ data: { ...state.data, colors } })),
  setAbout: (about: About) => set((state) => ({ data: { ...state.data, about } })),
  setCategories: (categories: number[]) =>
    set((state) => ({ data: { ...state.data, categories } })),
}));
