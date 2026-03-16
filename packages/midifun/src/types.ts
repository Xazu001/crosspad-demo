/**
 * Core types for MIDI Fun library
 */

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer?: string;
  state: "connected" | "disconnected" | "open" | "closed";
  input?: MIDIInput;
  output?: MIDIOutput;
  connection: "open" | "closed" | "pending";

  // Methods
  onMessage(handler: (message: MidiMessage) => void): void;
  offMessage(handler: (message: MidiMessage) => void): void;
  open(): Promise<void>;
  close(): Promise<void>;
  send(data: number[], timestamp?: number): void;
  sendNoteOn(note: number, velocity?: number, channel?: number): void;
  sendNoteOff(note: number, velocity?: number, channel?: number): void;
  sendControlChange(controller: number, value: number, channel?: number): void;
  sendProgramChange(program: number, channel?: number): void;
  sendPitchBend(bend: number, channel?: number): void;
  // Launchpad LED methods
  setLedColor(note: number, color: LaunchpadColor): void;
  setLedPreset(note: number, preset: LaunchpadPresetColor): void;
  setLedOff(note: number): void;
  clearAllLeds(): void;
  setLedColors(pads: Array<{ note: number; color: LaunchpadColor }>): void;
  // Launchpad RGB LED methods (Mini MK3, X, Pro, MK2)
  setLedRGB(note: number, color: LaunchpadRGBColor): void;
  setLedRGBPreset(note: number, preset: LaunchpadPresetColor): void;
  setLedRGBColors(pads: Array<{ note: number; color: LaunchpadRGBColor }>): void;
}

export interface MidiMessage {
  device: MidiDevice;
  timestamp: number;
  data: Uint8Array;
  type:
    | "noteon"
    | "noteoff"
    | "controlchange"
    | "pitchbend"
    | "programchange"
    | "deviceconnect"
    | "devicedisconnect"
    | "unknown";
  channel?: number;
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  program?: number;
  pitch?: number;

  // Helpers
  isNoteOn(): boolean;
  isNoteOff(): boolean;
  isControlChange(): boolean;
  isPitchBend(): boolean;
  isProgramChange(): boolean;
  getNoteName(): string | undefined;
  getNoteFrequency(): number | undefined;
  getVelocityPercentage(): number | undefined;
  getValuePercentage(): number | undefined;
  getPitchBendNormalized(): number | undefined;
  toString(): string;
  clone(): MidiMessage;
}

export interface MidiControllerConfig {
  autoConnect: boolean;
  sysex: boolean;
  ignore: boolean;
  onDeviceConnect?: (device: MidiDevice) => void;
  onDeviceDisconnect?: (device: MidiDevice) => void;
  onMessage?: (message: MidiMessage) => void;
}

export type MidiEventType =
  | "noteon"
  | "noteoff"
  | "controlchange"
  | "pitchbend"
  | "programchange"
  | "deviceconnect"
  | "devicedisconnect"
  | "unknown";

export type MidiEventHandler = (message: MidiMessage) => void;

// ──────────────────────────────────────────────────────────────
// Launchpad LED Color Types
// ──────────────────────────────────────────────────────────────

/**
 * Launchpad LED color values (0-3 for each channel)
 * Classic Launchpad uses green/red LEDs with 4 brightness levels each
 */
export interface LaunchpadColor {
  /** Green LED brightness (0-3, where 0=off, 3=full) */
  green: number;
  /** Red LED brightness (0-3, where 0=off, 3=full) */
  red: number;
  /** Whether the LED should flash (Launchpad MK1/MK2) */
  flash?: boolean;
}

/**
 * RGB color for modern Launchpads (Mini MK3, X, Pro, MK2)
 * Values 0-127 for each channel
 */
export interface LaunchpadRGBColor {
  /** Red brightness (0-127) */
  r: number;
  /** Green brightness (0-127) */
  g: number;
  /** Blue brightness (0-127) */
  b: number;
}

/**
 * Predefined Launchpad colors for convenience
 */
export type LaunchpadPresetColor =
  | "off"
  | "green"
  | "green-dim"
  | "green-mid"
  | "red"
  | "red-dim"
  | "red-mid"
  | "yellow"
  | "yellow-dim"
  | "yellow-mid"
  | "orange";

/**
 * Launchpad model type for protocol differences
 */
export type LaunchpadModel =
  | "launchpad-mk1"
  | "launchpad-mk2"
  | "launchpad-mk3"
  | "launchpad-mini"
  | "launchpad-mini-mk3"
  | "launchpad-pro"
  | "launchpad-pro-mk2"
  | "launchpad-x"
  | "launchpad-xl";
