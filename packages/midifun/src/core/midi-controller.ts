/**
 * Main MIDI Controller class - the heart of MIDI Fun library
 * Based on AudioController pattern from the main project
 */
import type {
  LaunchpadColor,
  LaunchpadPresetColor,
  LaunchpadRGBColor,
  MidiControllerConfig,
  MidiDevice,
  MidiEventHandler,
  MidiEventType,
  MidiMessage,
} from "../types";
import { MidiDevice as MidiDeviceClass } from "./midi-device";
import { MidiMessage as MidiMessageClass } from "./midi-message";

export class MidiController {
  private access: WebMidi | null = null;
  private devices: Map<string, MidiDevice> = new Map();
  private config: MidiControllerConfig;
  private isInitialized = false;
  private eventHandlers: Map<MidiEventType, MidiEventHandler[]> = new Map();
  private globalMessageHandlers: MidiEventHandler[] = [];

  constructor(config: Partial<MidiControllerConfig> = {}) {
    this.config = {
      autoConnect: true,
      sysex: false,
      ignore: false,
      ...config,
    };

    // Initialize event handler maps
    const eventTypes: MidiEventType[] = [
      "noteon",
      "noteoff",
      "controlchange",
      "pitchbend",
      "programchange",
      "deviceconnect",
      "devicedisconnect",
    ];
    eventTypes.forEach((type) => {
      this.eventHandlers.set(type, []);
    });
  }

  /**
   * Initialize MIDI controller and request MIDI access
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.access = await navigator.requestMIDIAccess({
        sysex: this.config.sysex,
        software: false,
      });

      this.setupDeviceHandlers();

      if (this.config.autoConnect) {
        await this.connectAllDevices();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("[MidiController] Failed to initialize MIDI:", error);
      throw error;
    }
  }

  /**
   * Check if MIDI is supported in the current browser
   */
  static isSupported(): boolean {
    return "requestMIDIAccess" in navigator;
  }

  /**
   * Get the current configuration
   */
  getConfig(): MidiControllerConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   */
  updateConfig(config: Partial<MidiControllerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private setupDeviceHandlers(): void {
    if (!this.access) return;

    this.access.onstatechange = (event) => {
      const { port } = event;

      if (port) {
        const isNewDevice = !this.findDeviceByName(port.name || "", port.manufacturer || undefined);
        const device = this.findOrCreateDevice(port);

        if (port.state === "connected") {
          device.state = "connected";
          // Fire only for NEW devices that have input — merge cases are handled
          // inside findOrCreateDevice to avoid double-firing
          if (isNewDevice && device.input) {
            this.handleDeviceConnect(device);
          }
        } else if (port.state === "disconnected") {
          device.state = "disconnected";
          this.handleDeviceDisconnect(device);
        }
      }
    };
  }

  private findOrCreateDevice(port: MIDIPort): MidiDevice {
    // Launchpad Mini has separate input/output ports with DIFFERENT IDs
    // (e.g., input-0 and output-1), so we need to match by name
    const existingDevice = this.findDeviceByName(port.name || "", port.manufacturer || undefined);
    if (existingDevice) {
      // Merge input/output ports into the same device
      console.log(
        `[MidiController] Merging ${port.type} port into existing device: ${port.name} (${port.id})`,
      );
      if (port.type === "input" && !existingDevice.input) {
        existingDevice.input = port as MIDIInput;
        (existingDevice as MidiDeviceClass).setupInputHandlers(port as MIDIInput);
        // Add bridge handler when merging input into existing device
        existingDevice.onMessage((message) => this.handleMessage(message));
        // Store the merged device under BOTH port IDs so it can be found by either
        this.devices.set(port.id, existingDevice);
        console.log(`[MidiController] Device now has input + output:`, {
          hasInput: !!existingDevice.input,
          hasOutput: !!existingDevice.output,
          storedUnderIds: [existingDevice.id, port.id],
        });
        // Fire onDeviceConnect again now that input is available
        // This ensures the UI sees the device as having input
        if (port.state === "connected") {
          this.handleDeviceConnect(existingDevice);
        }
      } else if (port.type === "output" && !existingDevice.output) {
        existingDevice.output = port as MIDIOutput;
        // Store the merged device under BOTH port IDs so it can be found by either
        this.devices.set(port.id, existingDevice);
        console.log(`[MidiController] Device now has input + output:`, {
          hasInput: !!existingDevice.input,
          hasOutput: !!existingDevice.output,
          storedUnderIds: [existingDevice.id, port.id],
        });
        // Fire onDeviceConnect again now that output is available
        // This ensures LEDs can be set on the output port
        if (port.state === "connected" && existingDevice.input) {
          this.handleDeviceConnect(existingDevice);
        }
      }
      return existingDevice;
    }

    let device: MidiDevice;

    if (port.type === "input") {
      device = new MidiDeviceClass(port as MIDIInput);
      // Set up the bridge handler for new input devices
      device.onMessage((message) => this.handleMessage(message));
    } else if (port.type === "output") {
      device = new MidiDeviceClass(undefined, port as MIDIOutput);
    } else {
      // Create a placeholder device
      device = new MidiDeviceClass();
    }

    this.devices.set(port.id, device);
    return device;
  }

  private findDeviceByName(name: string, manufacturer?: string): MidiDevice | undefined {
    // Construct the comparison name the same way MidiDevice does
    const comparisonName =
      manufacturer && !name.toLowerCase().includes(manufacturer.toLowerCase())
        ? `${manufacturer} ${name}`
        : name;

    for (const device of this.devices.values()) {
      if (device.name === comparisonName) {
        return device;
      }
    }
    return undefined;
  }

  private async connectAllDevices(): Promise<void> {
    if (!this.access) return;

    const inputs = Array.from(this.access.inputs.values());
    const outputs = Array.from(this.access.outputs.values());

    // Connect input devices
    for (const input of inputs) {
      const device = this.findOrCreateDevice(input);
      // Bridge handler is already set in findOrCreateDevice for input devices

      try {
        await device.open();
      } catch (error) {
        console.warn(`[MidiController] Failed to open device ${device.name}:`, error);
      }
    }

    // Connect output devices
    for (const output of outputs) {
      const device = this.findOrCreateDevice(output);
      try {
        await device.open();
      } catch (error) {
        console.warn(`[MidiController] Failed to open device ${device.name}:`, error);
      }
    }

    // Fire onDeviceConnect for all devices that have input (already plugged in)
    // onstatechange doesn't fire for pre-existing devices on page load
    this.devices.forEach((device) => {
      if (device.state === "connected" && device.input) {
        this.handleDeviceConnect(device);
      }
    });
  }

  private handleMessage(message: MidiMessage): void {
    const messageObj = new MidiMessageClass(message);

    // Call global message handlers
    this.globalMessageHandlers.forEach((handler) => handler(messageObj));

    // Call specific event type handlers
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(messageObj));
    }

    // Call config callback
    if (this.config.onMessage) {
      this.config.onMessage(messageObj);
    }
  }

  private handleDeviceConnect(device: MidiDevice): void {
    const handlers = this.eventHandlers.get("deviceconnect");
    if (handlers) {
      const message = new MidiMessageClass({
        device,
        timestamp: Date.now(),
        data: new Uint8Array(),
        type: "deviceconnect",
      } as any);
      handlers.forEach((handler) => handler(message));
    }

    if (this.config.onDeviceConnect) {
      this.config.onDeviceConnect(device);
    }
  }

  private handleDeviceDisconnect(device: MidiDevice): void {
    const handlers = this.eventHandlers.get("devicedisconnect");
    if (handlers) {
      const message = new MidiMessageClass({
        device,
        timestamp: Date.now(),
        data: new Uint8Array(),
        type: "devicedisconnect",
      } as any);
      handlers.forEach((handler) => handler(message));
    }

    if (this.config.onDeviceDisconnect) {
      this.config.onDeviceDisconnect(device);
    }
  }

  /**
   * Get all connected MIDI devices
   */
  getDevices(): MidiDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get input devices only
   */
  getInputDevices(): MidiDevice[] {
    return this.getDevices().filter((device) => device.input !== undefined);
  }

  /**
   * Clear all message handlers from the controller.
   * Does NOT clear device-level handlers (the device-to-controller bridge).
   * Does NOT clear system event handlers like deviceconnect/devicedisconnect.
   */
  clearHandlers(): void {
    // Clear controller-level message handlers only
    const messageEventTypes: MidiEventType[] = [
      "noteon",
      "noteoff",
      "controlchange",
      "pitchbend",
      "programchange",
      "unknown",
    ];

    messageEventTypes.forEach((type) => {
      const handlers = this.eventHandlers.get(type);
      if (handlers) {
        handlers.length = 0;
      }
    });

    this.globalMessageHandlers.length = 0;

    console.log("[MidiController] Message handlers cleared");
  }

  /**
   * Clear message handlers for a specific device
   */
  clearHandlersOnDevice(deviceId: string): void {
    const device = this.getDevice(deviceId);
    if (device) {
      (device as MidiDeviceClass).clearHandlers();
      console.log(`[MidiController] Handlers cleared for device: ${device.name}`);
    }
  }

  /**
   * Get output devices only
   */
  getOutputDevices(): MidiDevice[] {
    return this.getDevices().filter((device) => device.output !== undefined);
  }

  /**
   * Get a device by ID
   */
  getDevice(id: string): MidiDevice | undefined {
    return this.devices.get(id);
  }

  /**
   * Get a device by name (first match)
   */
  getDeviceByName(name: string): MidiDevice | undefined {
    return this.getDevices().find((device) =>
      device.name.toLowerCase().includes(name.toLowerCase()),
    );
  }

  /**
   * Add an event handler for specific MIDI event types
   */
  on(eventType: MidiEventType, handler: MidiEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.push(handler);
    }
  }

  /**
   * Remove an event handler
   */
  off(eventType: MidiEventType, handler: MidiEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Add a global message handler (receives all messages)
   */
  onMessage(handler: MidiEventHandler): void {
    this.globalMessageHandlers.push(handler);
  }

  /**
   * Remove a global message handler
   */
  offMessage(handler: MidiEventHandler): void {
    const index = this.globalMessageHandlers.indexOf(handler);
    if (index > -1) {
      this.globalMessageHandlers.splice(index, 1);
    }
  }

  /**
   * Send a MIDI message to all output devices
   */
  send(data: number[], timestamp?: number): void {
    this.getOutputDevices().forEach((device) => {
      device.send(data, timestamp);
    });
  }

  /**
   * Send a MIDI message to a specific device
   */
  sendToDevice(deviceId: string, data: number[], timestamp?: number): void {
    const device = this.getDevice(deviceId);
    if (device) {
      device.send(data, timestamp);
    }
  }

  /**
   * Send Note On to all output devices
   */
  sendNoteOn(note: number, velocity: number = 127, channel: number = 1): void {
    this.getOutputDevices().forEach((device) => {
      device.sendNoteOn(note, velocity, channel);
    });
  }

  /**
   * Send Note Off to all output devices
   */
  sendNoteOff(note: number, velocity: number = 127, channel: number = 1): void {
    this.getOutputDevices().forEach((device) => {
      device.sendNoteOff(note, velocity, channel);
    });
  }

  /**
   * Send Control Change to all output devices
   */
  sendControlChange(controller: number, value: number, channel: number = 1): void {
    this.getOutputDevices().forEach((device) => {
      device.sendControlChange(controller, value, channel);
    });
  }

  /**
   * Send Program Change to all output devices
   */
  sendProgramChange(program: number, channel: number = 1): void {
    this.getOutputDevices().forEach((device) => {
      device.sendProgramChange(program, channel);
    });
  }

  /**
   * Send Pitch Bend to all output devices
   */
  sendPitchBend(bend: number, channel: number = 1): void {
    this.getOutputDevices().forEach((device) => {
      device.sendPitchBend(bend, channel);
    });
  }

  /**
   * Start learning mode - returns a promise that resolves with the next MIDI message
   */
  async learn(): Promise<MidiMessage> {
    return new Promise((resolve) => {
      const handler = (message: MidiMessage) => {
        this.offMessage(handler);
        resolve(message);
      };

      this.onMessage(handler);
    });
  }

  /**
   * Check if the controller is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.access !== null;
  }

  /**
   * Get the WebMidi access object (for advanced usage)
   */
  getMidiAccess(): WebMidi | null {
    return this.access;
  }

  // ──────────────────────────────────────────────────────────────
  // Launchpad LED Control Methods
  // ──────────────────────────────────────────────────────────────

  /**
   * Set LED color on all Launchpad output devices
   */
  setLedColor(note: number, color: LaunchpadColor): void {
    this.getOutputDevices().forEach((device) => {
      device.setLedColor(note, color);
    });
  }

  /**
   * Set LED color using preset on all Launchpad output devices
   */
  setLedPreset(note: number, preset: LaunchpadPresetColor): void {
    this.getOutputDevices().forEach((device) => {
      device.setLedPreset(note, preset);
    });
  }

  /**
   * Turn off LED on all Launchpad output devices
   */
  setLedOff(note: number): void {
    this.getOutputDevices().forEach((device) => {
      device.setLedOff(note);
    });
  }

  /**
   * Clear all LEDs on all Launchpad output devices
   */
  clearAllLeds(): void {
    this.getOutputDevices().forEach((device) => {
      device.clearAllLeds();
    });
  }

  /**
   * Set multiple LED colors on all Launchpad output devices
   */
  setLedColors(pads: Array<{ note: number; color: LaunchpadColor }>): void {
    this.getOutputDevices().forEach((device) => {
      device.setLedColors(pads);
    });
  }

  /**
   * Set LED color on a specific device
   */
  setLedColorOnDevice(deviceId: string, note: number, color: LaunchpadColor): void {
    const device = this.getDevice(deviceId);
    if (device) {
      device.setLedColor(note, color);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Launchpad RGB LED Control Methods (Mini MK3, X, Pro, MK2)
  // ──────────────────────────────────────────────────────────────

  /**
   * Set LED RGB color on all Launchpad output devices
   */
  setLedRGB(note: number, color: LaunchpadRGBColor): void {
    this.getOutputDevices().forEach((device) => {
      device.setLedRGB(note, color);
    });
  }

  /**
   * Set LED RGB color using preset on all Launchpad output devices
   */
  setLedRGBPreset(note: number, preset: LaunchpadPresetColor): void {
    this.getOutputDevices().forEach((device) => {
      device.setLedRGBPreset(note, preset);
    });
  }

  /**
   * Set multiple RGB LED colors on all Launchpad output devices
   */
  setLedRGBColors(pads: Array<{ note: number; color: LaunchpadRGBColor }>): void {
    this.getOutputDevices().forEach((device) => {
      device.setLedRGBColors(pads);
    });
  }

  /**
   * Set LED RGB color on a specific device
   */
  setLedRGBOnDevice(deviceId: string, note: number, color: LaunchpadRGBColor): void {
    const device = this.getDevice(deviceId);
    if (device) {
      device.setLedRGB(note, color);
    }
  }

  /**
   * Dispose the controller and clean up resources
   */
  async dispose(): Promise<void> {
    // Close all devices
    const closePromises = this.getDevices().map((device) => device.close());
    await Promise.all(closePromises);

    // Clear handlers
    this.eventHandlers.clear();
    this.globalMessageHandlers.length = 0;
    this.devices.clear();

    // Reset state
    this.access = null;
    this.isInitialized = false;
  }
}
