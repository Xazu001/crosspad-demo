/**
 * MIDI Fun - A powerful MIDI library for React applications
 */

// Core classes and types
export { MidiController } from "./core/midi-controller";
export { MidiDevice } from "./core/midi-device";
export { MidiMessage } from "./core/midi-message";

// Types
export type {
  MidiDevice as IMidiDevice,
  MidiMessage as IMidiMessage,
  MidiControllerConfig,
  MidiEventType,
  MidiEventHandler,
  LaunchpadColor,
  LaunchpadRGBColor,
  LaunchpadPresetColor,
  LaunchpadModel,
} from "./types";

// Constants
export { MidiUtils } from "./utils/midi-utils";
