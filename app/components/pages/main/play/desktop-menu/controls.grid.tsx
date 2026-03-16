import { getPadDisplayNumberFromIndex } from "@/utils/pad-mapping";

import * as React from "react";
import { useEffect, useState } from "react";

import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { audioController } from "#/lib/music/controller";
import { MIDI_NOTE_TO_PAD, useMidiStore } from "#/lib/stores/midi";
import { usePlayKitStore } from "#/lib/stores/playKit";

interface ConfigGridProps {
  type: "midi" | "keyboard";
}

export function ConfigGrid({ type }: ConfigGridProps) {
  const [selectedPad, setSelectedPad] = useState<number | null>(null);
  const { controller, setLed, inputDevices, selectedDeviceId } = useMidiStore();
  const { updatePadMapping } = usePlayKitStore();

  // Helper for LED logic
  const updatePadLed = (note: number, active: boolean) => {
    const device = inputDevices.find((d) => d.id === selectedDeviceId);
    if (!device) return;

    const isRGB =
      device.name.toLowerCase().includes("mk3") ||
      device.name.toLowerCase().includes("launchpad x") ||
      device.name.toLowerCase().includes("pro");

    if (active) {
      setLed(note, isRGB ? { r: 0, g: 127, b: 0 } : { green: 3, red: 0 });
    } else {
      setLed(note, isRGB ? { r: 0, g: 0, b: 0 } : { green: 0, red: 0 });
    }
  };

  // Listen for MIDI notes when a pad is selected for assignment
  useEffect(() => {
    if (type !== "midi" || selectedPad === null || !controller) return;

    const handleMidiMessage = (message: any) => {
      if (message.type === "noteon" && message.note !== undefined) {
        // Get old note for this pad to clear it
        const config = audioController.getControllerConfig().midi;
        const oldCustomNote = config[selectedPad];
        const defaultNote = Object.entries(MIDI_NOTE_TO_PAD).find(
          ([_, idx]) => idx === selectedPad,
        )?.[0];

        const oldNote = oldCustomNote ?? (defaultNote ? parseInt(defaultNote, 10) : undefined);

        // Update MIDI mapping for the selected pad
        console.log(`Assigning MIDI note ${message.note} to pad ${selectedPad}`);

        // Clear old LED
        if (oldNote !== undefined) {
          updatePadLed(oldNote, false);
        }

        // Set new LED
        updatePadLed(message.note, true);

        updatePadMapping(selectedPad, "midi", message.note);
        setSelectedPad(null);
      }
    };

    controller.on("noteon", handleMidiMessage);
    return () => {
      controller.off("noteon", handleMidiMessage);
    };
  }, [type, selectedPad, controller, updatePadMapping]);

  // Listen for Keyboard keys when a pad is selected for assignment
  useEffect(() => {
    if (type !== "keyboard" || selectedPad === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Escape to cancel
      if (e.key === "Escape") {
        setSelectedPad(null);
        return;
      }

      e.preventDefault();
      console.log(`Assigning Key ${e.key} to pad ${selectedPad}`);
      updatePadMapping(selectedPad, "keyboard", e.key);
      setSelectedPad(null);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [type, selectedPad, updatePadMapping]);

  const getMappingValue = (padIndex: number) => {
    if (type === "keyboard") {
      return audioController.getKeyboardMapping(padIndex).toUpperCase() || "--";
    } else {
      const config = audioController.getControllerConfig().midi;
      const customNote = config[padIndex];

      if (customNote !== undefined && customNote !== null) {
        return `N:${customNote}`;
      }

      const defaultNote = Object.entries(MIDI_NOTE_TO_PAD).find(
        ([_, idx]) => idx === padIndex,
      )?.[0];

      return defaultNote ? `N:${defaultNote}` : "--";
    }
  };

  return (
    <div className="kit-play-desktop__config-grid">
      <div className="kit-play-desktop__grid-4x4">
        {Array.from({ length: 16 }).map((_, i) => {
          const padIndex = i; // Adjust based on grid layout if needed
          const isSelected = selectedPad === padIndex;
          const displayNumber = getPadDisplayNumberFromIndex(padIndex);

          return (
            <button
              key={padIndex}
              className={`kit-play-desktop__config-pad ${isSelected ? "kit-play-desktop__config-pad--active" : ""}`}
              onClick={() => setSelectedPad(isSelected ? null : padIndex)}
            >
              <span className="kit-play-desktop__config-pad-number">{displayNumber}</span>
              <div className="kit-play-desktop__config-pad-value">{getMappingValue(padIndex)}</div>
              {isSelected && (
                <div className="kit-play-desktop__config-pad-listening">
                  <Icon.CircleGauge size="sm" className="animate-pulse" />
                  <span>Press...</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div
        className={`kit-play-desktop__config-hint ${selectedPad === null ? "kit-play-desktop__config-hint--hidden" : ""}`}
      >
        <p>
          {type === "midi"
            ? "Press a pad on your MIDI controller to assign it."
            : "Press a key on your keyboard to assign it."}
        </p>
        <Button variant="outline" size="sm" onClick={() => setSelectedPad(null)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
