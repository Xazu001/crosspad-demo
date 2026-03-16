import type { KitColors } from "$/database/schema";
import { PadPlayMode, type PadPlayModeType } from "@/enums";

import React from "react";

import { create } from "zustand";

import {
  type PadSettings,
  type Recording,
  type Sample,
  audioController,
} from "#/lib/music/controller";

export type KitSample = {
  sample_id: number;
  sample_name: string | null;
  sample_source: string | File | null;
  sample_created_on: number | null;
  sample_status: string | null;
  owner?: {
    user_id: string | null;
    user_name: string | null;
    user_namespace: string | null;
    user_avatar_source: string | null;
  };
  playback_order: number | null;
};

export type KitPad = {
  pad_id: number;
  pad_name: string;
  pad_position: number;
  pad_choke_group: number | null;
  pad_play_mode: string;
  samples: KitSample[];
};

export type KitWithSamples = {
  kit_id: number;
  kit_name: string;
  kit_description: string;
  colors: KitColors;
  kit_logo_source: string | null;
  kit_metronome: number | null;
  kit_created_on: number;
  kit_published_on: number | null;
  kit_status: string;
  owner: {
    user_id: string | null;
    user_name: string | null;
    user_namespace: string | null;
    user_avatar_source: string | null;
  };
  group: {
    group_id: number | null;
    group_name: string | null;
    group_description: string | null;
  } | null;
  pads: KitPad[];
};

export type PlayKitState = {
  kit: KitWithSamples | null;
  isInitialized: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  activePads: Set<number>;
  pressedPads: Set<number>;
  loopingPads: Set<number>;
  padProgress: Map<number, number>; // 0-100 for each pad
  loadingProgress: {
    loadedSamples: number;
    totalSamples: number;
    loadedPads: number;
    totalPads: number;
  };
  loadingErrors: {
    sampleName: string;
    error: string;
  }[];
  volumeValue: number;
  pitchValue: number;
  frequencyValue: number;
  // Recording state
  isRecording: boolean;
  isPlayingRecording: boolean;
  recording: Recording | null;
  initializeKit: (kit: KitWithSamples, options?: PlayKitOptions) => Promise<void>;
  playPadSample: (padIndex: number, sampleIndex?: number) => Promise<void>;
  stopPadSample: (padIndex: number) => void;
  stopAll: () => void;
  togglePadLoop: (padIndex: number) => void;
  setVolume: (volume: number) => void;
  setPitchValue: (pitch: number) => void;
  setFrequencyValue: (frequency: number) => void;
  // Recording methods
  startRecording: () => void;
  stopRecording: () => Recording;
  playRecording: (recording?: Recording) => Promise<void>;
  stopPlayback: () => void;
  getRecording: () => Recording | null;
  clearRecording: () => void;
  saveRecordingAsJSON: () => string;
  loadRecordingFromJSON: (json: string) => Recording;
  padHandlers: (padIndex: number) => {
    onMouseDown: () => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onClick: () => void;
  };
  dispose: () => void;
  closeAudioContext: () => void;
  updatePadMapping: (padIndex: number, type: "midi" | "keyboard", value: string | number) => void;
};

export type PlayKitOptions = {
  delayEveryPadLoading?: number; // Delay in ms between loading each pad
};

export const usePlayKitStore = create<PlayKitState>((set, get) => {
  // Track loading progress
  const loadingProgress = {
    loadedSamples: 0,
    totalSamples: 0,
    loadedPads: 0,
    totalPads: 0,
  };

  // Register callbacks with audioController
  audioController.onPadPlay((padIndex, isKeyboard) => {
    set((state) => ({
      activePads: new Set([...state.activePads, padIndex]),
    }));

    // Check if pad is in toggle mode and manage loopingPads
    // Toggle mode pads stay in loopingPads while playing
    const pad = audioController.getPad(padIndex);
    if (pad && pad.pad_play_mode === "toggle") {
      set((state) => ({
        loopingPads: new Set([...state.loopingPads, padIndex]),
      }));

      // Start progress tracking for toggle mode
      audioController.onPadProgress((padIndex, progress) => {
        set((state) => {
          const newProgress = new Map(state.padProgress);
          newProgress.set(padIndex, progress);
          return { padProgress: newProgress };
        });
      });
    }

    // Dispatch custom event for keyboard-triggered pads (for ripple only)
    if (isKeyboard) {
      window.dispatchEvent(
        new CustomEvent("keyboardPadPlay", {
          detail: { padIndex },
        }),
      );
    }
  });

  audioController.onPadStop((padIndex) => {
    set((state) => {
      const newActivePads = new Set(state.activePads);
      newActivePads.delete(padIndex);
      return { activePads: newActivePads };
    });

    // Remove from loopingPads when pad stops
    // This applies to all pads, including toggle mode
    set((state) => {
      const newLoopingPads = new Set(state.loopingPads);
      newLoopingPads.delete(padIndex);
      return { loopingPads: newLoopingPads };
    });

    // Reset progress when pad stops
    set((state) => {
      const newProgress = new Map(state.padProgress);
      newProgress.delete(padIndex);
      return { padProgress: newProgress };
    });
  });

  audioController.onPadDown((padIndex) => {
    set((state) => ({
      pressedPads: new Set([...state.pressedPads, padIndex]),
    }));
  });

  audioController.onPadUp((padIndex) => {
    set((state) => {
      const newPressedPads = new Set(state.pressedPads);
      newPressedPads.delete(padIndex);
      return { pressedPads: newPressedPads };
    });
  });

  return {
    kit: null,
    isInitialized: false,
    isLoading: false,
    isPlaying: false,
    activePads: new Set<number>(),
    pressedPads: new Set<number>(),
    loopingPads: new Set<number>(),
    padProgress: new Map<number, number>(),
    loadingProgress: {
      loadedSamples: 0,
      totalSamples: 0,
      loadedPads: 0,
      totalPads: 0,
    },
    loadingErrors: [],
    volumeValue: audioController.getVolume(),
    pitchValue: audioController.getPitchValue(),
    frequencyValue: audioController.getFrequencyValue(),
    isRecording: false,
    isPlayingRecording: false,
    recording: null,
    initializeKit: async (kit: KitWithSamples, options?: PlayKitOptions) => {
      set({ isLoading: true });

      // Load controller config first
      audioController.loadConfig();

      // Update store with loaded config values
      set({
        volumeValue: audioController.getVolume(),
        pitchValue: audioController.getPitchValue(),
        frequencyValue: audioController.getFrequencyValue(),
      });

      // Calculate total samples and pads (count all pads)
      const totalPads = kit.pads.length;
      const totalSamples = kit.pads.reduce(
        (sum, pad) => sum + pad.samples.filter((s) => s.sample_name && s.sample_source).length,
        0,
      );

      // Initialize loading progress
      const progress = {
        loadedSamples: 0,
        totalSamples,
        loadedPads: 0,
        totalPads,
      };
      const errors: { sampleName: string; error: string }[] = [];
      set({ loadingProgress: progress, loadingErrors: errors });

      // Convert kit pads to pad settings with delay simulation
      const pads: PadSettings[] = [];
      const delay = options?.delayEveryPadLoading || 0;

      for (let i = 0; i < kit.pads.length; i++) {
        const pad = kit.pads[i];

        const validSamples: Sample[] = pad.samples
          .filter((s) => s.sample_name && s.sample_source)
          .map((s) => ({
            id: s.sample_id,
            name: s.sample_name!,
            source: s.sample_source!,
            createdOn: s.sample_created_on || undefined,
            status: s.sample_status || undefined,
          }));

        // Load samples for this pad and wait for completion
        let samplesLoadedSuccessfully = true;
        if (validSamples.length > 0) {
          const loadPromises = validSamples.map(async (sample) => {
            try {
              console.log(`[Store] Preloading sample ${sample.name} from: ${sample.source}`);

              const loaded = await audioController.preloadSample(sample.name, sample.source);

              if (!loaded) {
                throw new Error(`Failed to preload ${sample.name}`);
              }
            } catch (error) {
              console.error(`[Store] Failed to preload sample ${sample.name}:`, error);
              // Store error but don't throw - continue loading other samples
              errors.push({
                sampleName: sample.name,
                error: error instanceof Error ? error.message : "Unknown error",
              });
              samplesLoadedSuccessfully = false;
            }
          });

          // Wait for all samples to load
          await Promise.all(loadPromises);
        }

        // Only add delay AFTER samples have actually loaded (or failed to load)
        if (delay > 0 && i > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // Count pad as loaded:
        // - If it has no samples (empty pad)
        // - If it has samples and all were loaded successfully
        if (pad.samples.length === 0 || (validSamples.length > 0 && samplesLoadedSuccessfully)) {
          progress.loadedPads += 1;
        }
        if (validSamples.length > 0 && samplesLoadedSuccessfully) {
          progress.loadedSamples += validSamples.length;
        }
        set({ loadingProgress: { ...progress }, loadingErrors: [...errors] });

        pads.push({
          pad_play_mode: (pad.pad_play_mode || PadPlayMode.TAP) as PadPlayModeType,
          pad_choke_group: pad.pad_choke_group,
          samples: validSamples,
        });
      }

      // Set pads in controller
      audioController.setPads(pads);

      // Enable keyboard support
      audioController.enableKeyboard();

      // Always set as initialized to prevent infinite loading
      set({
        kit,
        isInitialized: true,
        isLoading: false,
        loadingErrors: errors,
        loadingProgress: progress,
      });
    },

    playPadSample: async (padIndex: number, sampleIndex: number = 0) => {
      // Add to active pads for visual feedback
      set((state) => ({
        activePads: new Set([...state.activePads, padIndex]),
      }));

      // Play the pad
      await audioController.playPad(padIndex, sampleIndex);

      // Update state
      set({
        isPlaying: true,
      });
    },

    stopPadSample: (padIndex: number) => {
      audioController.stopPad(padIndex);

      // Remove from active pads
      set((state) => {
        const newActivePads = new Set(state.activePads);
        newActivePads.delete(padIndex);
        return { activePads: newActivePads };
      });
    },

    stopAll: () => {
      audioController.stopAll();
      set({
        isPlaying: false,
        activePads: new Set<number>(),
        pressedPads: new Set<number>(),
      });
    },

    togglePadLoop: (padIndex: number) => {
      const { loopingPads } = get();
      const newLoopingPads = new Set(loopingPads);

      if (newLoopingPads.has(padIndex)) {
        newLoopingPads.delete(padIndex);
      } else {
        newLoopingPads.add(padIndex);
      }

      set({ loopingPads: newLoopingPads });
    },

    setVolume: (volume: number) => {
      audioController.setVolume(volume);
      // Ensure the state is updated with the actual saved value
      const savedVolume = audioController.getVolume();
      set({ volumeValue: savedVolume });
    },

    setPitchValue: (pitch: number) => {
      audioController.setPitchValue(pitch);
      set({ pitchValue: audioController.getPitchValue() });
    },

    setFrequencyValue: (frequency: number) => {
      audioController.setFrequencyValue(frequency);
      set({ frequencyValue: audioController.getFrequencyValue() });
    },

    padHandlers: (padIndex: number) => {
      return audioController.getPadHandlers(padIndex);
    },

    dispose: () => {
      audioController.dispose();
      set({
        kit: null,
        isInitialized: false,
        isPlaying: false,
        activePads: new Set<number>(),
        pressedPads: new Set<number>(),
        loopingPads: new Set<number>(),
        loadingProgress: { ...loadingProgress },
        loadingErrors: [],
      });
    },

    closeAudioContext: () => {
      audioController.closeAudioContext();
    },

    updatePadMapping: (padIndex, type, value) => {
      if (type === "keyboard") {
        audioController.updateKeyboardMapping(padIndex, value as string);
      } else {
        audioController.updateMidiMapping(padIndex, value as number);
      }
      // Trigger state update to reflect changes
      set({});
    },

    // Recording methods
    startRecording: () => {
      audioController.startRecording();
      set({ isRecording: true });
    },

    stopRecording: () => {
      const recording = audioController.stopRecording();
      set({ isRecording: false, recording });
      return recording;
    },

    playRecording: async () => {
      const recording = get().recording;
      if (!recording) return;

      await audioController.playRecording(recording, () => {
        // When playback ends, update the state
        set({ isPlayingRecording: false });
      });
      set({ isPlayingRecording: true });
    },

    stopPlayback: () => {
      audioController.stopPlayback();
      set({ isPlayingRecording: false });
    },

    getRecording: () => {
      return audioController.getRecording();
    },

    clearRecording: () => {
      audioController.clearRecording();
      set({ recording: null });
    },

    saveRecordingAsJSON: () => {
      return audioController.saveRecordingAsJSON();
    },

    loadRecordingFromJSON: (json: string) => {
      const recording = audioController.loadRecordingFromJSON(json);
      set({ recording });
      return recording;
    },
  };
});

/** Hook for managing kit playback with optional loading delay */
export const usePlayKit = (options: PlayKitOptions = {}) => {
  const store = usePlayKitStore();
  const isDisposedRef = React.useRef(false);
  const storeRef = React.useRef(store);
  storeRef.current = store;

  // Wrap initializeKit to pass options
  const initializeKitWithDelay = React.useCallback(
    async (kit: KitWithSamples) => {
      return store.initializeKit(kit, options);
    },
    [store, options],
  );

  React.useEffect(() => {
    return () => {
      if (!isDisposedRef.current) {
        isDisposedRef.current = true;
        storeRef.current.dispose();
      }
    };
  }, []);

  return {
    ...store,
    initializeKit: initializeKitWithDelay,
  };
};
