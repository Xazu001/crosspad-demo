import type { KitColors } from "$/database/schema";
import { PadPlayMode } from "@/enums";
import type { About, CreateKitData, Pad } from "@/types/kit";
import { createInitialPads } from "@/utils/pad-mapping";

import { create } from "zustand";

// ──────────────────────────────────────────────────────────────

export type EditKitState = {
  kitId: number | null;
  existingLogoUrl: string | null;
  data: CreateKitData;
  initialize: (kitId: number, data: CreateKitData, existingLogoUrl?: string) => void;
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

export const useEditKitStore = create<EditKitState>((set) => ({
  kitId: null,
  existingLogoUrl: null,
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
  initialize: (kitId: number, data: CreateKitData, existingLogoUrl?: string) =>
    set({ kitId, data, existingLogoUrl: existingLogoUrl || null }),
  setPads: (pads: Pad[]) => set((state) => ({ data: { ...state.data, pads } })),
  addSamplesToPad: (padIndex: number, samples: (string | File)[]) =>
    set((state) => {
      if (padIndex < 0 || padIndex >= state.data.pads.length) return state;
      const pads = [...state.data.pads];
      const target = pads[padIndex];
      const newSamples = [...target.samples, ...samples];
      const playMode = newSamples.length > 1 ? PadPlayMode.CYCLE : target.playMode;
      pads[padIndex] = { ...target, samples: newSamples, playMode };
      return { data: { ...state.data, pads } };
    }),
  setPadSample: (padIndex: number, samples: (string | File)[]) =>
    set((state) => {
      if (padIndex < 0 || padIndex >= state.data.pads.length) return state;
      const pads = [...state.data.pads];
      const target = pads[padIndex];
      const playMode = samples.length > 1 ? PadPlayMode.CYCLE : target.playMode;
      pads[padIndex] = { ...target, samples, playMode };
      return { data: { ...state.data, pads } };
    }),
  clearPadSamples: (padIndex: number) =>
    set((state) => {
      if (padIndex < 0 || padIndex >= state.data.pads.length) return state;
      const pads = [...state.data.pads];
      pads[padIndex] = { ...pads[padIndex], samples: [] };
      return { data: { ...state.data, pads } };
    }),
  removeSampleFromPad: (padIndex: number, sampleIndex: number) =>
    set((state) => {
      if (padIndex < 0 || padIndex >= state.data.pads.length) return state;
      const pads = [...state.data.pads];
      const target = pads[padIndex];
      const samples = target.samples.filter((_, i) => i !== sampleIndex);
      const playMode = samples.length > 1 ? PadPlayMode.CYCLE : PadPlayMode.TAP;
      pads[padIndex] = { ...target, samples, playMode };
      return { data: { ...state.data, pads } };
    }),
  setPadChokeGroup: (padIndex: number, chokeGroup: number) =>
    set((state) => {
      if (padIndex < 0 || padIndex >= state.data.pads.length) return state;
      const pads = [...state.data.pads];
      pads[padIndex] = { ...pads[padIndex], chokeGroup };
      return { data: { ...state.data, pads } };
    }),
  setPadPlayMode: (padIndex: number, playMode: (typeof PadPlayMode)[keyof typeof PadPlayMode]) =>
    set((state) => {
      if (padIndex < 0 || padIndex >= state.data.pads.length) return state;
      const pads = [...state.data.pads];
      pads[padIndex] = { ...pads[padIndex], playMode };
      return { data: { ...state.data, pads } };
    }),
  setKitColors: (kitColors: KitColors) =>
    set((state) => ({ data: { ...state.data, colors: kitColors } })),
  setAbout: (about: About) => set((state) => ({ data: { ...state.data, about } })),
  setCategories: (categories: number[]) =>
    set((state) => ({ data: { ...state.data, categories } })),
}));
