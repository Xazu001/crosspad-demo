/**
 * MIDI Utility functions
 */

export class MidiUtils {
  /**
   * Convert MIDI note number to note name (C4, D#3, etc.)
   */
  static noteToName(note: number): string {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(note / 12) - 1;
    const noteName = noteNames[note % 12];
    return `${noteName}${octave}`;
  }

  /**
   * Convert note name to MIDI note number
   */
  static nameToNote(noteName: string): number {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const match = noteName.match(/^([A-G]#?)(-?\d+)$/);

    if (!match) {
      throw new Error(`Invalid note name: ${noteName}`);
    }

    const [, name, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    const noteIndex = noteNames.indexOf(name);

    if (noteIndex === -1) {
      throw new Error(`Invalid note name: ${name}`);
    }

    return (octave + 1) * 12 + noteIndex;
  }

  /**
   * Convert MIDI note number to frequency in Hz
   */
  static noteToFrequency(note: number): number {
    // A4 (note 69) = 440 Hz
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  /**
   * Convert frequency to nearest MIDI note number
   */
  static frequencyToNote(frequency: number): number {
    return Math.round(12 * Math.log2(frequency / 440) + 69);
  }

  /**
   * Convert velocity (0-127) to percentage (0-100)
   */
  static velocityToPercentage(velocity: number): number {
    return Math.round((velocity / 127) * 100);
  }

  /**
   * Convert percentage (0-100) to velocity (0-127)
   */
  static percentageToVelocity(percentage: number): number {
    return Math.round((percentage / 100) * 127);
  }

  /**
   * Convert control value (0-127) to percentage (0-100)
   */
  static valueToPercentage(value: number): number {
    return Math.round((value / 127) * 100);
  }

  /**
   * Convert percentage (0-100) to control value (0-127)
   */
  static percentageToValue(percentage: number): number {
    return Math.round((percentage / 100) * 127);
  }

  /**
   * Convert pitch bend value (-8192..8191) to normalized (-1..1)
   */
  static pitchBendToNormalized(pitchBend: number): number {
    return pitchBend / 8192;
  }

  /**
   * Convert normalized pitch bend (-1..1) to MIDI value (-8192..8191)
   */
  static normalizedToPitchBend(normalized: number): number {
    return Math.round(normalized * 8192);
  }

  /**
   * Clamp a value between min and max
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Linear interpolation between two values
   */
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Map a value from one range to another
   */
  static map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  /**
   * Check if a value is a valid MIDI note (0-127)
   */
  static isValidNote(note: number): boolean {
    return Number.isInteger(note) && note >= 0 && note <= 127;
  }

  /**
   * Check if a value is a valid MIDI velocity (0-127)
   */
  static isValidVelocity(velocity: number): boolean {
    return Number.isInteger(velocity) && velocity >= 0 && velocity <= 127;
  }

  /**
   * Check if a value is a valid MIDI channel (1-16)
   */
  static isValidChannel(channel: number): boolean {
    return Number.isInteger(channel) && channel >= 1 && channel <= 16;
  }

  /**
   * Check if a value is a valid MIDI control value (0-127)
   */
  static isValidControlValue(value: number): boolean {
    return Number.isInteger(value) && value >= 0 && value <= 127;
  }

  /**
   * Check if a value is a valid pitch bend value (-8192..8191)
   */
  static isValidPitchBend(pitchBend: number): boolean {
    return Number.isInteger(pitchBend) && pitchBend >= -8192 && pitchBend <= 8191;
  }

  /**
   * Format a MIDI message as hex string
   */
  static formatMessage(data: Uint8Array): string {
    return Array.from(data)
      .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
      .join(" ");
  }

  /**
   * Parse a hex string to MIDI message data
   */
  static parseMessage(hexString: string): Uint8Array {
    const hexValues = hexString.trim().split(/\s+/);
    return new Uint8Array(hexValues.map((hex) => parseInt(hex, 16)));
  }

  /**
   * Get the status byte from MIDI data
   */
  static getStatusByte(data: Uint8Array): number | undefined {
    return data.length > 0 ? data[0] : undefined;
  }

  /**
   * Get the message type from status byte
   */
  static getMessageType(statusByte: number): string {
    if (statusByte >= 0x80 && statusByte < 0x90) return "noteoff";
    if (statusByte >= 0x90 && statusByte < 0xa0) return "noteon";
    if (statusByte >= 0xa0 && statusByte < 0xb0) return "polyphonicpressure";
    if (statusByte >= 0xb0 && statusByte < 0xc0) return "controlchange";
    if (statusByte >= 0xc0 && statusByte < 0xd0) return "programchange";
    if (statusByte >= 0xd0 && statusByte < 0xe0) return "channelpressure";
    if (statusByte >= 0xe0 && statusByte < 0xf0) return "pitchbend";
    if (statusByte === 0xf0) return "sysex";
    if (statusByte === 0xf1) return "timecode";
    if (statusByte === 0xf2) return "songposition";
    if (statusByte === 0xf3) return "songselect";
    if (statusByte === 0xf8) return "timingclock";
    if (statusByte === 0xfa) return "start";
    if (statusByte === 0xfb) return "continue";
    if (statusByte === 0xfc) return "stop";
    if (statusByte === 0xfe) return "activesensing";
    if (statusByte === 0xff) return "reset";

    return "unknown";
  }

  /**
   * Get the channel from status byte (1-16)
   */
  static getChannel(statusByte: number): number | undefined {
    if (statusByte >= 0x80 && statusByte < 0xf0) {
      return (statusByte & 0x0f) + 1;
    }
    return undefined;
  }

  /**
   * Create a Note On message
   */
  static createNoteOnMessage(
    note: number,
    velocity: number = 127,
    channel: number = 1,
  ): Uint8Array {
    if (!this.isValidNote(note)) throw new Error(`Invalid note: ${note}`);
    if (!this.isValidVelocity(velocity)) {
      throw new Error(`Invalid velocity: ${velocity}`);
    }
    if (!this.isValidChannel(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    return new Uint8Array([0x90 | ((channel - 1) & 0x0f), note, velocity]);
  }

  /**
   * Create a Note Off message
   */
  static createNoteOffMessage(
    note: number,
    velocity: number = 127,
    channel: number = 1,
  ): Uint8Array {
    if (!this.isValidNote(note)) throw new Error(`Invalid note: ${note}`);
    if (!this.isValidVelocity(velocity)) {
      throw new Error(`Invalid velocity: ${velocity}`);
    }
    if (!this.isValidChannel(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    return new Uint8Array([0x80 | ((channel - 1) & 0x0f), note, velocity]);
  }

  /**
   * Create a Control Change message
   */
  static createControlChangeMessage(
    controller: number,
    value: number,
    channel: number = 1,
  ): Uint8Array {
    if (!this.isValidControlValue(controller)) {
      throw new Error(`Invalid controller: ${controller}`);
    }
    if (!this.isValidControlValue(value)) {
      throw new Error(`Invalid value: ${value}`);
    }
    if (!this.isValidChannel(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    return new Uint8Array([0xb0 | ((channel - 1) & 0x0f), controller, value]);
  }

  /**
   * Create a Program Change message
   */
  static createProgramChangeMessage(program: number, channel: number = 1): Uint8Array {
    if (!this.isValidControlValue(program)) {
      throw new Error(`Invalid program: ${program}`);
    }
    if (!this.isValidChannel(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    return new Uint8Array([0xc0 | ((channel - 1) & 0x0f), program]);
  }

  /**
   * Create a Pitch Bend message
   */
  static createPitchBendMessage(bend: number, channel: number = 1): Uint8Array {
    if (!this.isValidPitchBend(bend)) {
      throw new Error(`Invalid pitch bend: ${bend}`);
    }
    if (!this.isValidChannel(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    const bendValue = bend + 8192;
    const lsb = bendValue & 0x7f;
    const msb = (bendValue >> 7) & 0x7f;

    return new Uint8Array([0xe0 | ((channel - 1) & 0x0f), lsb, msb]);
  }

  /**
   * Throttle function calls
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => void {
    let timeoutId: number | null = null;
    let lastExecTime = 0;

    return (...args: Parameters<T>) => {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = window.setTimeout(
          () => {
            func(...args);
            lastExecTime = Date.now();
          },
          delay - (currentTime - lastExecTime),
        );
      }
    };
  }

  /**
   * Debounce function calls
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => void {
    let timeoutId: number | null = null;

    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => func(...args), delay);
    };
  }
}
