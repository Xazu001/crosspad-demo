// ──────────────────────────────────────────────────────────────
// Controller Configuration Types and Utilities
// ──────────────────────────────────────────────────────────────
import type { PadPlayModeType } from "@/enums";

/** Individual sample within a pad */
export type Sample = {
  id: number;
  name: string;
  source: string | File;
  description?: string;
  createdOn?: number;
  status?: string;
};

/** Configuration for a single pad */
export type PadSettings = {
  pad_play_mode: PadPlayModeType;
  pad_choke_group: number | null;
  samples: Sample[];
};

/** Keyboard mapping configuration */
export type KeyboardConfig = {
  [padIndex: number]: string;
};

/** MIDI mapping configuration */
export type MidiConfig = {
  [padIndex: number]: number;
};

/** Main controller configuration */
export type ControllerConfig = {
  keyboard: KeyboardConfig;
  midi: MidiConfig;
  volume: number; // 0-100
  pitchValue: number; // -12 to +12 semitones
  frequencyValue: number; // 0.5 to 2.0 (speed multiplier)
};

/** Visual effect settings for pads */
export type VisualSettings = {
  boxShadow: {
    enabled: boolean;
    minValue: number; // px
    maxValue: number; // px
    sensitivity: number; // 0-1, how reactive the shadow is
  };
};

export const DEFAULT_KEYBOARD_CONFIG: KeyboardConfig = {
  0: "1",
  1: "2",
  2: "3",
  3: "4",
  4: "q",
  5: "w",
  6: "e",
  7: "r",
  8: "a",
  9: "s",
  10: "d",
  11: "f",
  12: "z",
  13: "x",
  14: "c",
  15: "v",
};

export const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
  boxShadow: {
    enabled: true,
    minValue: 4,
    maxValue: 16,
    sensitivity: 1,
  },
};

export const DEFAULT_CONTROLLER_CONFIG: ControllerConfig = {
  keyboard: DEFAULT_KEYBOARD_CONFIG,
  midi: {},
  volume: 100,
  pitchValue: 0,
  frequencyValue: 1,
};

// Storage keys for localStorage
const CONFIG_STORAGE_KEY = "crosspad-controller-config";
const VISUAL_CONFIG_STORAGE_KEY = "crosspad-visual-config";

/**
 * Load visual settings from localStorage
 * @returns Merged visual settings with defaults
 */
export const loadVisualConfig = (): VisualSettings => {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_VISUAL_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(VISUAL_CONFIG_STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      // Merge with defaults to ensure all properties exist
      return {
        boxShadow: {
          ...DEFAULT_VISUAL_SETTINGS.boxShadow,
          ...config.boxShadow,
        },
      };
    }
  } catch (error) {
    console.error("[Config] Failed to load visual config:", error);
  }
  return DEFAULT_VISUAL_SETTINGS;
};

/**
 * Save visual settings to localStorage
 * @param config - Visual settings to save
 */
export const saveVisualConfig = (config: VisualSettings): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem(VISUAL_CONFIG_STORAGE_KEY, JSON.stringify(config));
    console.log("[Config] Visual config saved");
  } catch (error) {
    console.error("[Config] Failed to save visual config:", error);
  }
};

/**
 * Load controller config from localStorage
 * @returns Merged controller config with defaults
 */
export const loadControllerConfig = (): ControllerConfig => {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_CONTROLLER_CONFIG;
  }

  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      // Merge with defaults to ensure all pads have keys
      return {
        keyboard: { ...DEFAULT_KEYBOARD_CONFIG, ...config.keyboard },
        midi: config.midi || {},
        volume: config.volume ?? DEFAULT_CONTROLLER_CONFIG.volume,
        pitchValue: config.pitchValue ?? DEFAULT_CONTROLLER_CONFIG.pitchValue,
        frequencyValue: config.frequencyValue ?? DEFAULT_CONTROLLER_CONFIG.frequencyValue,
      };
    }
  } catch (error) {
    console.error("[Config] Failed to load config:", error);
  }
  return DEFAULT_CONTROLLER_CONFIG;
};

/**
 * Save controller config to localStorage
 * @param config - Controller configuration to save
 */
export const saveControllerConfig = (config: ControllerConfig): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    console.log("[Config] Config saved");
  } catch (error) {
    console.error("[Config] Failed to save config:", error);
  }
};

/**
 * Get pad index for a given keyboard key
 * @param key - Keyboard key to look up
 * @param config - Controller configuration (optional, uses default if not provided)
 * @returns Pad index or null if key not mapped
 */
export const getPadForKey = (
  key: string,
  config: ControllerConfig = DEFAULT_CONTROLLER_CONFIG,
): number | null => {
  for (const [padIndex, padKey] of Object.entries(config.keyboard)) {
    if ((padKey as string).toLowerCase() === key.toLowerCase()) {
      return parseInt(padIndex, 10);
    }
  }
  return null;
};

/**
 * Get keyboard key for a given pad index
 * @param padIndex - Pad index to look up
 * @param config - Controller configuration (optional, uses default if not provided)
 * @returns Keyboard key or empty string if not mapped
 */
export const getKeyForPad = (
  padIndex: number,
  config: ControllerConfig = DEFAULT_CONTROLLER_CONFIG,
): string => {
  return config.keyboard[padIndex] || "";
};
