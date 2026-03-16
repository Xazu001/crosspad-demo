/**
 * Hook for MIDI integration with kit pads
 * Connects MIDI note events to pad triggers
 */
import { useCallback, useEffect, useRef } from "react";

import { MidiController } from "midifun";
import type { MidiMessage } from "midifun";
import { toast } from "react-toastify";

import { audioController } from "#/lib/music/controller";
import { useMidiStore } from "#/lib/stores/midi";
// ──────────────────────────────────────────────────────────────

/**
 * Default MIDI note mapping for 16 pads
 * Maps MIDI note numbers to pad indices (0-15)
 */
import {
  getCurrentMidiMapping,
  getMappedNotes,
  isLaunchpad,
  isLaunchpadMiniMK3,
} from "#/lib/stores/midi";
import { usePlayKitStore } from "#/lib/stores/playKit";

export interface UseKitMidiOptions {
  /** Whether MIDI is enabled (default: true) */
  enabled?: boolean;
  /** Called when MIDI device connects */
  onDeviceConnect?: (device: { id: string; name: string }) => void;
  /** Called when MIDI device disconnects */
  onDeviceDisconnect?: (device: { id: string; name: string }) => void;
}

export interface UseKitMidiReturn {
  /** Whether MIDI is supported in this browser */
  isSupported: boolean;
  /** Whether MIDI controller is initialized and ready */
  isReady: boolean;
  /** Any error that occurred during initialization */
  error: Error | null;
  /** List of connected input devices */
  inputDevices: Array<{ id: string; name: string }>;
  /** Currently selected device ID */
  selectedDeviceId: string | null;
  /** Manually trigger a pad by index via MIDI (for testing) */
  triggerPadViaMidi: (padIndex: number, velocity: number) => void;
  /** Select a MIDI device by ID */
  selectDevice: (deviceId: string | null) => void;
}

// ──────────────────────────────────────────────────────────────

/**
 * Hook to connect MIDI input to kit pads
 * Each pad (0-15) is mapped to a default MIDI note (36-51)
 */
export function useKitMidi(options: UseKitMidiOptions = {}): UseKitMidiReturn {
  const { enabled = true, onDeviceConnect, onDeviceDisconnect } = options;

  const controllerRef = useRef<MidiController | null>(null);

  const padHandlers = usePlayKitStore((state) => state.padHandlers);
  const {
    inputDevices,
    selectedDeviceId,
    addInputDevice,
    removeInputDevice,
    setSelectedDeviceId,
    isReady,
    setIsReady,
    setError,
    setIsSupported,
    setController,
  } = useMidiStore();

  // Local trigger function (used inside effect and exposed)
  const triggerPadViaMidi = useCallback(
    (padIndex: number, velocity: number) => {
      // Check if AudioContext is suspended (not yet activated by user interaction)
      if (audioController.isContextSuspended()) {
        toast.error("You have to click/touch on any pad to use MIDI");
        return;
      }

      if (velocity > 0) {
        // Note On - trigger pad down
        padHandlers(padIndex).onMouseDown();

        // Dispatch MIDI down event for visual effects (ripples)
        window.dispatchEvent(
          new CustomEvent("midiPadDown", {
            detail: { padIndex },
          }),
        );
      } else {
        // Note Off (velocity 0) - trigger pad up
        padHandlers(padIndex).onMouseUp();

        // Dispatch MIDI up event for consistency
        window.dispatchEvent(
          new CustomEvent("midiPadUp", {
            detail: { padIndex },
          }),
        );
      }
    },
    [padHandlers],
  );

  // Initialize MIDI controller
  useEffect(() => {
    if (!enabled) return;

    // Set supported status
    const supported = MidiController.isSupported();
    setIsSupported(supported);

    if (!supported) {
      console.warn("[useKitMidi] MIDI is not supported in this browser");
      return;
    }

    // Reuse existing controller from store (e.g., when navigating between kits)
    // This sets controllerRef synchronously so the handler effect can use it immediately
    const existingController = useMidiStore.getState().controller;
    if (existingController) {
      controllerRef.current = existingController;
      return;
    }

    let mounted = true;

    const initMidi = async () => {
      try {
        // Load config before setting LEDs
        audioController.loadConfig();

        const controller = new MidiController({
          autoConnect: true,
          onDeviceConnect: (device) => {
            if (!mounted) return;
            if (device.input) {
              addInputDevice({ id: device.id, name: device.name });
              onDeviceConnect?.({ id: device.id, name: device.name });

              // Auto-select this device if no device is currently selected
              const currentSelected = useMidiStore.getState().selectedDeviceId;
              if (!currentSelected) {
                setSelectedDeviceId(device.id);
                console.log("[useKitMidi] Auto-selected device:", device.name);
              }

              // Set green LEDs on all mapped notes for this device
              const notes = getMappedNotes();
              const isRGB = isLaunchpadMiniMK3(device.name);
              const isLP = isLaunchpad(device.name);

              console.log("[useKitMidi] Device connected:", {
                name: device.name,
                id: device.id,
                hasInput: !!device.input,
                hasOutput: !!device.output,
                isLaunchpad: isLP,
                isRGB,
              });

              // Only set LEDs for Launchpad devices
              if (isLP) {
                console.log("[useKitMidi] Setting LEDs for Launchpad, notes:", notes);
                notes.forEach((note) => {
                  if (isRGB) {
                    // RGB Launchpad (Mini MK3, X, Pro, MK2) - use SysEx
                    controller.setLedRGBOnDevice(device.id, note, {
                      r: 0,
                      g: 127,
                      b: 0,
                    });
                  } else {
                    // Classic Launchpad (Mini MK1/MK2, S, Classic) - use velocity
                    controller.setLedColorOnDevice(device.id, note, {
                      green: 3,
                      red: 0,
                    });
                  }
                });
              }
            }
          },
          onDeviceDisconnect: (device) => {
            if (!mounted) return;
            const isLP = isLaunchpad(device.name);

            // Clear LEDs on disconnect (only for Launchpads)
            if (isLP) {
              const notes = getMappedNotes();
              const isRGB = isLaunchpadMiniMK3(device.name);
              notes.forEach((note) => {
                if (isRGB) {
                  controller.setLedRGBOnDevice(device.id, note, {
                    r: 0,
                    g: 0,
                    b: 0,
                  });
                } else {
                  controller.setLedColorOnDevice(device.id, note, {
                    green: 0,
                    red: 0,
                  });
                }
              });
            }

            removeInputDevice(device.id);
            onDeviceDisconnect?.({ id: device.id, name: device.name });
          },
        });

        await controller.initialize();

        if (mounted) {
          controllerRef.current = controller;
          setController(controller);
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Failed to initialize MIDI"));
        }
        console.error("[useKitMidi] Failed to initialize MIDI:", err);
      }
    };

    initMidi();

    return () => {
      mounted = false;
      // Don't dispose on unmount - controller might be used elsewhere
    };
  }, [
    enabled,
    addInputDevice,
    removeInputDevice,
    setIsReady,
    setError,
    setIsSupported,
    onDeviceConnect,
    onDeviceDisconnect,
  ]);

  // Handle note handlers registration and updates based on selection
  useEffect(() => {
    const controller = controllerRef.current;
    const storeIsReady = useMidiStore.getState().isReady;
    if (!controller || !storeIsReady) return;

    console.log("[useKitMidi] Updating note handlers for selection:", selectedDeviceId);

    // Always clear existing message handlers before re-registering
    controller.clearHandlers();

    if (selectedDeviceId === null) {
      console.log("[useKitMidi] MIDI disabled (None selected)");
      return;
    }

    const handler = (message: MidiMessage) => {
      // Strict check: only accept messages from the selected device
      const currentSelectedId = useMidiStore.getState().selectedDeviceId;
      if (currentSelectedId === null || message.device.id !== currentSelectedId) {
        return;
      }

      const note = message.note;
      if (note !== undefined) {
        const mapping = getCurrentMidiMapping();
        const padIndex = mapping[note];

        if (padIndex !== undefined) {
          if (message.type === "noteon") {
            triggerPadViaMidi(padIndex, message.velocity ?? 127);
          } else if (message.type === "noteoff") {
            triggerPadViaMidi(padIndex, 0);
          }
        }
      }
    };

    controller.on("noteon", handler);
    controller.on("noteoff", handler);

    return () => {
      // Cleanup handlers on unmount or selection change
      controller.off("noteon", handler);
      controller.off("noteoff", handler);
    };
  }, [isReady, selectedDeviceId, triggerPadViaMidi]);

  return {
    isSupported: MidiController.isSupported(),
    isReady: useMidiStore.getState().isReady,
    error: useMidiStore.getState().error,
    inputDevices,
    selectedDeviceId,
    triggerPadViaMidi,
    selectDevice: useMidiStore.getState().selectDevice,
  };
}
