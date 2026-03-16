/**
 * MIDI Message class for handling MIDI messages
 */
import type { MidiMessage as IMidiMessage, MidiDevice } from "../types";

export class MidiMessage implements IMidiMessage {
  public readonly device: MidiDevice;
  public readonly timestamp: number;
  public readonly data: Uint8Array;
  public readonly type:
    | "noteon"
    | "noteoff"
    | "controlchange"
    | "pitchbend"
    | "programchange"
    | "deviceconnect"
    | "devicedisconnect"
    | "unknown";
  public readonly channel?: number;
  public readonly note?: number;
  public readonly velocity?: number;
  public readonly controller?: number;
  public readonly value?: number;
  public readonly program?: number;
  public readonly pitch?: number;

  constructor(
    message: Partial<IMidiMessage> & {
      device: MidiDevice;
      timestamp: number;
      data: Uint8Array;
      type: IMidiMessage["type"];
    },
  ) {
    this.device = message.device;
    this.timestamp = message.timestamp;
    this.data = message.data;
    this.type = message.type;
    this.channel = message.channel;
    this.note = message.note;
    this.velocity = message.velocity;
    this.controller = message.controller;
    this.value = message.value;
    this.program = message.program;
    this.pitch = message.pitch;
  }

  /**
   * Check if this is a Note On message
   */
  isNoteOn(): boolean {
    return this.type === "noteon" && this.velocity !== undefined && this.velocity > 0;
  }

  /**
   * Check if this is a Note Off message
   */
  isNoteOff(): boolean {
    return this.type === "noteoff" || (this.type === "noteon" && this.velocity === 0);
  }

  /**
   * Check if this is a Control Change message
   */
  isControlChange(): boolean {
    return this.type === "controlchange";
  }

  /**
   * Check if this is a Pitch Bend message
   */
  isPitchBend(): boolean {
    return this.type === "pitchbend";
  }

  /**
   * Check if this is a Program Change message
   */
  isProgramChange(): boolean {
    return this.type === "programchange";
  }

  /**
   * Get the note name (C4, D#3, etc.) if this is a note message
   */
  getNoteName(): string | undefined {
    if (this.note === undefined) return undefined;

    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(this.note / 12) - 1;
    const noteName = noteNames[this.note % 12];

    return `${noteName}${octave}`;
  }

  /**
   * Get the MIDI note frequency in Hz
   */
  getNoteFrequency(): number | undefined {
    if (this.note === undefined) return undefined;

    // A4 (note 69) = 440 Hz
    return 440 * Math.pow(2, (this.note - 69) / 12);
  }

  /**
   * Get the velocity as a percentage (0-100)
   */
  getVelocityPercentage(): number | undefined {
    if (this.velocity === undefined) return undefined;
    return Math.round((this.velocity / 127) * 100);
  }

  /**
   * Get the controller value as a percentage (0-100)
   */
  getValuePercentage(): number | undefined {
    if (this.value === undefined) return undefined;
    return Math.round((this.value / 127) * 100);
  }

  /**
   * Get the pitch bend as a normalized value (-1 to 1)
   */
  getPitchBendNormalized(): number | undefined {
    if (this.pitch === undefined) return undefined;
    return this.pitch / 8192;
  }

  /**
   * Convert message to a human-readable string
   */
  toString(): string {
    const parts: string[] = [this.type];

    if (this.channel !== undefined) {
      parts.push(`Ch${this.channel}`);
    }

    switch (this.type) {
      case "noteon":
      case "noteoff":
        if (this.note !== undefined) {
          parts.push(this.getNoteName() || `Note${this.note}`);
        }
        if (this.velocity !== undefined) {
          parts.push(`Vel:${this.velocity}`);
        }
        break;
      case "controlchange":
        if (this.controller !== undefined) {
          parts.push(`CC${this.controller}`);
        }
        if (this.value !== undefined) {
          parts.push(`Val:${this.value}`);
        }
        break;
      case "pitchbend":
        if (this.pitch !== undefined) {
          parts.push(`Bend:${this.pitch}`);
        }
        break;
      case "programchange":
        if (this.program !== undefined) {
          parts.push(`Prog:${this.program}`);
        }
        break;
    }

    return parts.join(" ");
  }

  /**
   * Create a clone of this message
   */
  clone(): MidiMessage {
    return new MidiMessage({
      device: this.device,
      timestamp: this.timestamp,
      data: new Uint8Array(this.data),
      type: this.type,
      channel: this.channel,
      note: this.note,
      velocity: this.velocity,
      controller: this.controller,
      value: this.value,
      program: this.program,
      pitch: this.pitch,
    } as any);
  }
}
