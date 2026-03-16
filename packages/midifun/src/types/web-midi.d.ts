/**
 * Type declarations for Web MIDI API
 * Based on the W3C Web MIDI API specification
 * https://webaudio.github.io/web-midi-api/
 */

interface MIDIOptions {
  sysex?: boolean;
  software?: boolean;
}

interface MIDIInputMap {
  [key: string]: MIDIInput;
  entries(): IterableIterator<[string, MIDIInput]>;
  forEach(callback: (input: MIDIInput, key: string) => void): void;
  get(id: string): MIDIInput | undefined;
  has(id: string): boolean;
  keys(): IterableIterator<string>;
  size: number;
  values(): IterableIterator<MIDIInput>;
}

interface MIDIOutputMap {
  [key: string]: MIDIOutput;
  entries(): IterableIterator<[string, MIDIOutput]>;
  forEach(callback: (output: MIDIOutput, key: string) => void): void;
  get(id: string): MIDIOutput | undefined;
  has(id: string): boolean;
  keys(): IterableIterator<string>;
  size: number;
  values(): IterableIterator<MIDIOutput>;
}

interface MIDIMessageEvent extends Event {
  data: Uint8Array;
  timeStamp: number;
  target: MIDIInput;
}

interface MIDIConnectionEvent extends Event {
  port: MIDIPort;
}

interface MIDIPort extends EventTarget {
  id: string;
  manufacturer?: string;
  name?: string;
  type: "input" | "output";
  version?: string;
  state: "connected" | "disconnected";
  connection: "open" | "closed" | "pending";
  onstatechange: ((this: MIDIPort, ev: MIDIConnectionEvent) => any) | null;
  open(): Promise<MIDIPort>;
  close(): Promise<MIDIPort>;
}

interface MIDIInput extends MIDIPort {
  type: "input";
  onmidimessage: ((this: MIDIInput, ev: MIDIMessageEvent) => any) | null;
}

interface MIDIOutput extends MIDIPort {
  type: "output";
  send(data: number[] | Uint8Array, timestamp?: number): void;
  clear(): void;
}

interface WebMidi extends EventTarget {
  inputs: MIDIInputMap;
  outputs: MIDIOutputMap;
  onstatechange: ((this: WebMidi, ev: MIDIConnectionEvent) => any) | null;
  sysexEnabled: boolean;
}

interface Navigator {
  requestMIDIAccess(options?: MIDIOptions): Promise<WebMidi>;
}

// Global declaration for NodeJS.Timeout for throttle and debounce functions
declare namespace NodeJS {
  interface Timeout {
    _idleTimeout: number;
  }
}
