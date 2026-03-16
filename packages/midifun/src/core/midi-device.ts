/**
 * MIDI Device class for managing individual MIDI devices
 */
import type {
  MidiDevice as IMidiDevice,
  LaunchpadColor,
  LaunchpadPresetColor,
  LaunchpadRGBColor,
  MidiMessage,
} from "../types";
import { MidiMessage as MidiMessageClass } from "./midi-message";

export class MidiDevice implements IMidiDevice {
  public readonly id: string;
  public readonly name: string;
  public readonly manufacturer?: string;
  public state: "connected" | "disconnected" | "open" | "closed" = "disconnected";
  public input?: MIDIInput;
  public output?: MIDIOutput;
  public connection: "open" | "closed" | "pending" = "closed";

  private messageHandlers: ((message: MidiMessage) => void)[] = [];

  constructor(midiInput?: MIDIInput, midiOutput?: MIDIOutput) {
    this.id = midiInput?.id ?? midiOutput?.id ?? this.generateId();

    // Combine manufacturer and name for a better display name
    // e.g., "Novation Launchpad Mini MK3" instead of just "Launchpad Mini MK3"
    const port = midiInput ?? midiOutput;
    const rawName = port?.name ?? "Unknown Device";
    const manufacturer = port?.manufacturer;

    if (manufacturer && !rawName.toLowerCase().includes(manufacturer.toLowerCase())) {
      this.name = `${manufacturer} ${rawName}`;
    } else {
      this.name = rawName;
    }

    // Handle potential null values for manufacturer
    this.manufacturer = manufacturer || undefined;

    if (midiInput) {
      this.input = midiInput;
      this.state = "connected";
      this.setupInputHandlers(midiInput);
    }

    if (midiOutput) {
      this.output = midiOutput;
      // Set state to connected if not already set by input
      if (!midiInput) {
        this.state = "connected";
      }
    }
  }

  private generateId(): string {
    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setupInputHandlers(input: MIDIInput): void {
    input.onmidimessage = (event: MIDIMessageEvent) => {
      const message = this.parseMidiMessage(event);
      this.notifyMessageHandlers(new MidiMessageClass(message));
    };
  }

  private parseMidiMessage(event: MIDIMessageEvent): any {
    const data = event.data ? new Uint8Array(event.data) : new Uint8Array();
    const [status, data1, data2] = data;

    // Extract channel (lower 4 bits of status byte for channel messages)
    const channel = status < 0xf0 ? (status & 0x0f) + 1 : undefined;

    // Determine message type
    let type: MidiMessage["type"] = "unknown";
    let note: number | undefined;
    let velocity: number | undefined;
    let controller: number | undefined;
    let value: number | undefined;
    let program: number | undefined;
    let pitch: number | undefined;

    if (status >= 0x80 && status < 0x90) {
      // Note Off
      type = "noteoff";
      note = data1;
      velocity = data2;
    } else if (status >= 0x90 && status < 0xa0) {
      // Note On
      type = "noteon";
      note = data1;
      velocity = data2;
      // Note on with velocity 0 is sometimes used for note off
      if (velocity === 0) {
        type = "noteoff";
      }
    } else if (status >= 0xb0 && status < 0xc0) {
      // Control Change
      type = "controlchange";
      controller = data1;
      value = data2;
    } else if (status >= 0xc0 && status < 0xd0) {
      // Program Change
      type = "programchange";
      program = data1;
    } else if (status >= 0xe0 && status < 0xf0) {
      // Pitch Bend
      type = "pitchbend";
      pitch = data1 + (data2 << 7) - 8192; // Convert to -8192..8191 range
    }

    return {
      device: this,
      timestamp: event.timeStamp,
      data,
      type,
      channel,
      note,
      velocity,
      controller,
      value,
      program,
      pitch,
    };
  }

  private notifyMessageHandlers(message: MidiMessage): void {
    this.messageHandlers.forEach((handler) => handler(message));
  }

  /**
   * Add a message handler for this device
   */
  onMessage(handler: (message: MidiMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Remove a message handler
   */
  offMessage(handler: (message: MidiMessage) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Open the device for communication
   */
  async open(): Promise<void> {
    if (this.input) {
      try {
        await this.input.open();
        this.connection = "open";
        this.state = "open";
      } catch (error) {
        console.error(`Failed to open MIDI input ${this.name}:`, error);
        throw error;
      }
    }

    if (this.output) {
      try {
        await this.output.open();
        this.connection = "open";
      } catch (error) {
        console.error(`Failed to open MIDI output ${this.name}:`, error);
        throw error;
      }
    }
  }

  /**
   * Close the device
   */
  async close(): Promise<void> {
    if (this.input) {
      try {
        this.input.close();
        this.connection = "closed";
        this.state = "closed";
      } catch (error) {
        console.error(`Failed to close MIDI input ${this.name}:`, error);
      }
    }

    if (this.output) {
      try {
        this.output.close();
        this.connection = "closed";
      } catch (error) {
        console.error(`Failed to close MIDI output ${this.name}:`, error);
      }
    }
  }

  /**
   * Send a MIDI message to this device
   */
  send(data: number[], timestamp?: number): void {
    console.log(`[MidiDevice] send() called on ${this.name}`, {
      data,
      hasOutput: !!this.output,
    });
    if (this.output) {
      this.output.send(data, timestamp);
      console.log(`[MidiDevice] Sent to output:`, data);
    } else {
      console.warn(`[MidiDevice] Device ${this.name} has no output port`);
    }
  }

  /**
   * Send a Note On message
   */
  sendNoteOn(note: number, velocity: number = 127, channel: number = 1): void {
    const status = 0x90 | ((channel - 1) & 0x0f);
    this.send([status, note & 0x7f, velocity & 0x7f]);
  }

  /**
   * Send a Note Off message
   */
  sendNoteOff(note: number, velocity: number = 127, channel: number = 1): void {
    const status = 0x80 | ((channel - 1) & 0x0f);
    this.send([status, note & 0x7f, velocity & 0x7f]);
  }

  /**
   * Send a Control Change message
   */
  sendControlChange(controller: number, value: number, channel: number = 1): void {
    const status = 0xb0 | ((channel - 1) & 0x0f);
    this.send([status, controller & 0x7f, value & 0x7f]);
  }

  /**
   * Send a Program Change message
   */
  sendProgramChange(program: number, channel: number = 1): void {
    const status = 0xc0 | ((channel - 1) & 0x0f);
    this.send([status, program & 0x7f]);
  }

  /**
   * Send a Pitch Bend message
   */
  sendPitchBend(bend: number, channel: number = 1): void {
    const status = 0xe0 | ((channel - 1) & 0x0f);
    const bendValue = bend + 8192; // Convert from -8192..8191 to 0..16383
    const lsb = bendValue & 0x7f;
    const msb = (bendValue >> 7) & 0x7f;
    this.send([status, lsb, msb]);
  }

  // ──────────────────────────────────────────────────────────────
  // Launchpad LED Control Methods
  // ──────────────────────────────────────────────────────────────

  /**
   * Set LED color on a Launchpad device
   * Uses velocity byte to encode color for classic Launchpad protocol
   *
   * @param note - MIDI note number (pad index, 0-127)
   * @param color - Color object with green/red values (0-3 each)
   *
   * Classic Launchpad velocity encoding:
   * - Bits 0-1: Red brightness (0-3)
   * - Bits 4-5: Green brightness (0-3)
   * - Bit 6: Flash flag (if supported)
   */
  setLedColor(note: number, color: LaunchpadColor): void {
    const { green, red, flash = false } = color;

    // Clamp values to 0-3
    const g = Math.max(0, Math.min(3, green));
    const r = Math.max(0, Math.min(3, red));

    // Encode velocity: (green << 4) | red | (flash ? 0x08 : 0)
    // Note: Flash bit varies by Launchpad model
    const velocity = (g << 4) | r | (flash ? 0x08 : 0);

    // Send Note On with color-encoded velocity
    this.sendNoteOn(note, velocity);
  }

  /**
   * Set LED color using a preset color name
   */
  setLedPreset(note: number, preset: LaunchpadPresetColor): void {
    const color = this.getPresetColor(preset);
    this.setLedColor(note, color);
  }

  /**
   * Turn off an LED
   */
  setLedOff(note: number): void {
    this.sendNoteOn(note, 0); // Velocity 0 = off
  }

  /**
   * Clear all LEDs (turn all off)
   * Uses CC 0 with value 0 for Launchpad clear command
   */
  clearAllLeds(): void {
    // Launchpad clear command: CC 0, value 0
    this.sendControlChange(0, 0);
  }

  /**
   * Set multiple LEDs at once
   */
  setLedColors(pads: Array<{ note: number; color: LaunchpadColor }>): void {
    pads.forEach(({ note, color }) => {
      this.setLedColor(note, color);
    });
  }

  /**
   * Convert preset color name to LaunchpadColor
   */
  private getPresetColor(preset: LaunchpadPresetColor): LaunchpadColor {
    const presets: Record<LaunchpadPresetColor, LaunchpadColor> = {
      off: { green: 0, red: 0 },
      green: { green: 3, red: 0 },
      "green-dim": { green: 1, red: 0 },
      "green-mid": { green: 2, red: 0 },
      red: { green: 0, red: 3 },
      "red-dim": { green: 0, red: 1 },
      "red-mid": { green: 0, red: 2 },
      yellow: { green: 3, red: 3 },
      "yellow-dim": { green: 1, red: 1 },
      "yellow-mid": { green: 2, red: 2 },
      orange: { green: 2, red: 3 },
    };
    return presets[preset];
  }

  // ──────────────────────────────────────────────────────────────
  // Launchpad RGB LED Control (Mini MK3, X, Pro, MK2)
  // ──────────────────────────────────────────────────────────────

  /**
   * Set LED RGB color using SysEx (Launchpad Mini MK3, X, Pro, MK2)
   *
   * SysEx format for Launchpad Mini MK3:
   * F0 00 20 29 02 0D 03 <note> <r> <g> <b> F7
   *
   * @param note - MIDI note number (pad index)
   * @param color - RGB color with r/g/b values 0-127
   */
  setLedRGB(note: number, color: LaunchpadRGBColor): void {
    const { r, g, b } = color;

    // Clamp values to 0-127
    const red = Math.max(0, Math.min(127, r));
    const green = Math.max(0, Math.min(127, g));
    const blue = Math.max(0, Math.min(127, b));

    // Launchpad Mini MK3 SysEx: F0 00 20 29 02 0D 03 <note> <r> <g> <b> F7
    const sysex = [0xf0, 0x00, 0x20, 0x29, 0x02, 0x0d, 0x03, note, red, green, blue, 0xf7];
    this.send(sysex);
  }

  /**
   * Set LED RGB color using preset name
   */
  setLedRGBPreset(note: number, preset: LaunchpadPresetColor): void {
    const color = this.getRGBPresetColor(preset);
    this.setLedRGB(note, color);
  }

  /**
   * Set multiple RGB LEDs at once
   */
  setLedRGBColors(pads: Array<{ note: number; color: LaunchpadRGBColor }>): void {
    pads.forEach(({ note, color }) => {
      this.setLedRGB(note, color);
    });
  }

  /**
   * Convert preset color name to RGB color
   */
  private getRGBPresetColor(preset: LaunchpadPresetColor): LaunchpadRGBColor {
    const presets: Record<LaunchpadPresetColor, LaunchpadRGBColor> = {
      off: { r: 0, g: 0, b: 0 },
      green: { r: 0, g: 127, b: 0 },
      "green-dim": { r: 0, g: 42, b: 0 },
      "green-mid": { r: 0, g: 85, b: 0 },
      red: { r: 127, g: 0, b: 0 },
      "red-dim": { r: 42, g: 0, b: 0 },
      "red-mid": { r: 85, g: 0, b: 0 },
      yellow: { r: 127, g: 127, b: 0 },
      "yellow-dim": { r: 42, g: 42, b: 0 },
      "yellow-mid": { r: 85, g: 85, b: 0 },
      orange: { r: 127, g: 64, b: 0 },
    };
    return presets[preset];
  }

  /**
   * Clear all message handlers from this device
   */
  clearHandlers(): void {
    this.messageHandlers = [];
  }
}
