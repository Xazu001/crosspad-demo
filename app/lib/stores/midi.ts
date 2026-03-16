/**
 * MIDI device store for managing connected MIDI devices
 */
import { create } from "zustand";

import type { MidiController } from "midifun";

import { audioController } from "#/lib/music/controller";

// ──────────────────────────────────────────────────────────────

export interface MidiDevice {
  id: string;
  name: string;
}

// ──────────────────────────────────────────────────────────────
// Helper functions for Launchpad detection
// ──────────────────────────────────────────────────────────────

/**
 * Detect if device is a Launchpad Mini MK3 (RGB) vs older model (RG)
 */
export function isLaunchpadMiniMK3(deviceName: string): boolean {
  const name = deviceName.toLowerCase();
  return (
    (name.includes("launchpad mini") && name.includes("mk3")) ||
    name.includes("launchpad mini mk3") ||
    name.includes("launchpad x") ||
    name.includes("launchpad pro") ||
    (name.includes("launchpad mk2") && !name.includes("mini"))
  );
}

/**
 * Detect if device is any Launchpad model
 */
export function isLaunchpad(deviceName: string): boolean {
  return deviceName.toLowerCase().includes("launchpad");
}

/**
 * Default MIDI note mapping for 16 pads
 */
export const MIDI_NOTE_TO_PAD: Record<number, number> = {
  64: 0,
  65: 1,
  66: 2,
  67: 3,
  80: 4,
  81: 5,
  82: 6,
  83: 7,
  96: 8,
  97: 9,
  98: 10,
  99: 11,
  112: 12,
  113: 13,
  114: 14,
  115: 15,
} as const;

/**
 * Get the current MIDI mapping (note -> padIndex)
 * Respects custom mappings and disables defaults for remapped pads
 */
export function getCurrentMidiMapping(): Record<number, number> {
  const mapping: Record<number, number> = {};
  const config = audioController.getControllerConfig().midi;

  // 1. Start with defaults
  Object.entries(MIDI_NOTE_TO_PAD).forEach(([note, padIdx]) => {
    mapping[parseInt(note, 10)] = padIdx;
  });

  // 2. Overwrite with custom mappings
  Object.entries(config).forEach(([padIdxStr, customNote]) => {
    const padIdx = parseInt(padIdxStr, 10);
    if (customNote !== null && customNote !== undefined) {
      // Remove any existing note mapping that points to this pad (disable default)
      Object.keys(mapping).forEach((noteStr) => {
        const note = parseInt(noteStr, 10);
        if (mapping[note] === padIdx) {
          delete mapping[note];
        }
      });
      // Add the new mapping
      mapping[customNote] = padIdx;
    }
  });

  return mapping;
}

/**
 * Get all MIDI notes that should be lit
 */
export function getMappedNotes(): number[] {
  return Object.keys(getCurrentMidiMapping()).map(Number);
}

// ──────────────────────────────────────────────────────────────

export interface MidiStoreState {
  /** List of connected input devices */
  inputDevices: MidiDevice[];
  /** Currently selected device ID */
  selectedDeviceId: string | null;
  /** Whether MIDI is supported in this browser */
  isSupported: boolean;
  /** Whether MIDI controller is initialized and ready */
  isReady: boolean;
  /** Any error that occurred during initialization */
  error: Error | null;
  /** MIDI controller instance (for LED control) */
  controller: MidiController | null;
  // Actions
  setInputDevices: (devices: MidiDevice[]) => void;
  addInputDevice: (device: MidiDevice) => void;
  removeInputDevice: (deviceId: string) => void;
  setSelectedDeviceId: (deviceId: string | null) => void;
  setIsReady: (ready: boolean) => void;
  setError: (error: Error | null) => void;
  setIsSupported: (supported: boolean) => void;
  setController: (controller: MidiController | null) => void;
  /** Select device with LED handling */
  selectDevice: (deviceId: string | null) => void;
  /** Set LED color for a specific note on the selected device */
  setLed: (
    note: number,
    color: { r: number; g: number; b: number } | { green: number; red: number },
  ) => void;
}

// ──────────────────────────────────────────────────────────────

export const useMidiStore = create<MidiStoreState>((set, get) => ({
  inputDevices: [],
  selectedDeviceId: null,
  isSupported: false,
  isReady: false,
  error: null,
  controller: null,

  setInputDevices: (devices) => set({ inputDevices: devices }),

  addInputDevice: (device) =>
    set((state) => {
      // Avoid duplicates
      if (state.inputDevices.some((d) => d.id === device.id)) {
        return state;
      }
      return {
        inputDevices: [...state.inputDevices, device],
      };
    }),

  removeInputDevice: (deviceId) =>
    set((state) => ({
      inputDevices: state.inputDevices.filter((d) => d.id !== deviceId),
      // Clear selection if removed device was selected
      selectedDeviceId: state.selectedDeviceId === deviceId ? null : state.selectedDeviceId,
    })),

  setSelectedDeviceId: (deviceId) => set({ selectedDeviceId: deviceId }),

  setIsReady: (ready) => set({ isReady: ready }),

  setError: (error) => set({ error }),

  setIsSupported: (supported) => set({ isSupported: supported }),

  setController: (controller) => set({ controller }),

  setLed: (note, color) => {
    const { selectedDeviceId, controller, inputDevices } = get();
    if (!selectedDeviceId || !controller) return;

    const device = inputDevices.find((d) => d.id === selectedDeviceId);
    if (!device || !isLaunchpad(device.name)) return;

    const isRGB = isLaunchpadMiniMK3(device.name);

    if (isRGB && "r" in color) {
      controller.setLedRGBOnDevice(selectedDeviceId, note, color);
    } else if (!isRGB && "green" in color) {
      controller.setLedColorOnDevice(selectedDeviceId, note, color);
    }
  },

  selectDevice: (deviceId) => {
    const state = get();
    const previousDeviceId = state.selectedDeviceId;
    const controller = state.controller;

    // If selecting "None" and there was a previous device, clear its LEDs
    if (deviceId === null && previousDeviceId && controller) {
      const previousDevice = state.inputDevices.find((d) => d.id === previousDeviceId);

      // Disable MIDI input by clearing handlers on all devices when "None" is selected
      // This is a safety measure to ensure no MIDI messages are processed
      controller.clearHandlers();

      if (previousDevice) {
        const notes = getMappedNotes();
        const isRGB = isLaunchpadMiniMK3(previousDevice.name);
        const isLP = isLaunchpad(previousDevice.name);

        console.log("[MidiStore] Clearing LEDs for device:", previousDevice.name);

        if (isLP) {
          notes.forEach((note) => {
            if (isRGB) {
              controller.setLedRGBOnDevice(previousDeviceId, note, {
                r: 0,
                g: 0,
                b: 0,
              });
            } else {
              controller.setLedColorOnDevice(previousDeviceId, note, {
                green: 0,
                red: 0,
              });
            }
          });
        }
      }
    }

    // If selecting a specific device, set its LEDs
    if (deviceId && controller) {
      const selectedDevice = state.inputDevices.find((d) => d.id === deviceId);

      if (selectedDevice) {
        // We need to re-register the message handler in the hook if it was cleared
        // This is handled by the hook itself when it re-renders or via state changes
        // but for now, we just ensure the device LEDs are set
        const notes = getMappedNotes();
        const isRGB = isLaunchpadMiniMK3(selectedDevice.name);
        const isLP = isLaunchpad(selectedDevice.name);

        if (isLP) {
          console.log("[MidiStore] Setting LEDs for selected device:", selectedDevice.name);
          notes.forEach((note) => {
            if (isRGB) {
              controller.setLedRGBOnDevice(deviceId, note, {
                r: 0,
                g: 127,
                b: 0,
              });
            } else {
              controller.setLedColorOnDevice(deviceId, note, {
                green: 3,
                red: 0,
              });
            }
          });
        }
      }
    }

    set({ selectedDeviceId: deviceId });
  },
}));
