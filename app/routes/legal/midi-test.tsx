/**
 * MIDI Test Page
 * Test Launchpad / MIDI controller input with detailed logging
 */
import "./midi-test.style.scss";

import { useCallback, useEffect, useRef, useState } from "react";

import { MidiController, MidiUtils } from "midifun";

import { Button } from "#/components/ui/button";
import { createMeta } from "#/lib/seo";

import type { Route } from "./+types";

// ──────────────────────────────────────────────────────────────

export const meta: Route.MetaFunction = ({ matches }) => {
  return createMeta(matches);
};
// ──────────────────────────────────────────────────────────────

interface MidiEventLog {
  id: string;
  timestamp: number;
  type: "noteon" | "noteoff" | "controlchange" | "pitchbend" | "programchange" | "unknown";
  channel?: number;
  note?: number;
  noteName?: string;
  velocity?: number;
  controller?: number;
  value?: number;
  program?: number;
  pitch?: number;
  deviceName: string;
}

interface ConnectedDevice {
  id: string;
  name: string;
  manufacturer?: string;
  hasInput: boolean;
  hasOutput: boolean;
}

// ──────────────────────────────────────────────────────────────

export default function MidiTestPage() {
  const [isSupported, setIsSupported] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [eventLogs, setEventLogs] = useState<MidiEventLog[]>([]);
  const [isLogging, setIsLogging] = useState(true);
  const controllerRef = useRef<MidiController | null>(null);
  const maxLogs = 50;

  // Add event to log
  const addEventLog = useCallback(
    (event: MidiEventLog) => {
      if (!isLogging) return;

      setEventLogs((prev) => {
        const newLogs = [event, ...prev];
        return newLogs.slice(0, maxLogs);
      });
    },
    [isLogging],
  );

  // Initialize MIDI
  useEffect(() => {
    setIsSupported(MidiController.isSupported());

    if (!MidiController.isSupported()) {
      setError("Web MIDI API is not supported in this browser");
      return;
    }

    let mounted = true;

    const initMidi = async () => {
      try {
        const controller = new MidiController({
          autoConnect: true,
          onDeviceConnect: (device) => {
            if (!mounted) return;
            setDevices((prev) => {
              if (prev.some((d) => d.id === device.id)) return prev;
              return [
                ...prev,
                {
                  id: device.id,
                  name: device.name,
                  manufacturer: device.manufacturer,
                  hasInput: !!device.input,
                  hasOutput: !!device.output,
                },
              ];
            });
          },
          onDeviceDisconnect: (device) => {
            if (!mounted) return;
            setDevices((prev) => prev.filter((d) => d.id !== device.id));
          },
        });

        await controller.initialize();

        // Set up event handlers
        controller.on("noteon", (message) => {
          addEventLog({
            id: `${Date.now()}-${Math.random()}`,
            timestamp: message.timestamp,
            type: "noteon",
            channel: message.channel,
            note: message.note,
            noteName: message.note !== undefined ? MidiUtils.noteToName(message.note) : undefined,
            velocity: message.velocity,
            deviceName: message.device.name,
          });
        });

        controller.on("noteoff", (message) => {
          addEventLog({
            id: `${Date.now()}-${Math.random()}`,
            timestamp: message.timestamp,
            type: "noteoff",
            channel: message.channel,
            note: message.note,
            noteName: message.note !== undefined ? MidiUtils.noteToName(message.note) : undefined,
            velocity: message.velocity,
            deviceName: message.device.name,
          });
        });

        controller.on("controlchange", (message) => {
          addEventLog({
            id: `${Date.now()}-${Math.random()}`,
            timestamp: message.timestamp,
            type: "controlchange",
            channel: message.channel,
            controller: message.controller,
            value: message.value,
            deviceName: message.device.name,
          });
        });

        controller.on("pitchbend", (message) => {
          addEventLog({
            id: `${Date.now()}-${Math.random()}`,
            timestamp: message.timestamp,
            type: "pitchbend",
            channel: message.channel,
            pitch: message.pitch,
            deviceName: message.device.name,
          });
        });

        controller.on("programchange", (message) => {
          addEventLog({
            id: `${Date.now()}-${Math.random()}`,
            timestamp: message.timestamp,
            type: "programchange",
            channel: message.channel,
            program: message.program,
            deviceName: message.device.name,
          });
        });

        if (mounted) {
          controllerRef.current = controller;
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize MIDI");
        }
      }
    };

    initMidi();

    return () => {
      mounted = false;
    };
  }, [addEventLog]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setEventLogs([]);
  }, []);

  // Toggle logging
  const toggleLogging = useCallback(() => {
    setIsLogging((prev) => !prev);
  }, []);

  // Format timestamp
  const formatTime = (ms: number) => {
    const date = new Date(ms);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  // Get velocity bar color
  const getVelocityColor = (velocity: number | undefined) => {
    if (velocity === undefined) return "transparent";
    const intensity = velocity / 127;
    if (intensity > 0.8) return "var(--color-destructive)";
    if (intensity > 0.5) return "var(--color-primary)";
    if (intensity > 0.2) return "var(--color-secondary)";
    return "var(--color-muted-foreground)";
  };

  return (
    <main className="midi-test">
      <div className="midi-test__container">
        <header className="midi-test__header">
          <h1>MIDI Test</h1>
          <p>Connect your Launchpad or MIDI controller to test input</p>
        </header>

        {/* Status Section */}
        <section className="midi-test__status">
          <div className="midi-test__status-item">
            <span className="midi-test__status-label">MIDI Support</span>
            <span
              className={`midi-test__status-value ${isSupported ? "midi-test__status-value--success" : "midi-test__status-value--error"}`}
            >
              {isSupported ? "✓ Supported" : "✗ Not Supported"}
            </span>
          </div>
          <div className="midi-test__status-item">
            <span className="midi-test__status-label">Controller</span>
            <span
              className={`midi-test__status-value ${isReady ? "midi-test__status-value--success" : ""}`}
            >
              {isReady ? "✓ Ready" : "○ Initializing..."}
            </span>
          </div>
          {error && (
            <div className="midi-test__status-item">
              <span className="midi-test__status-label">Error</span>
              <span className="midi-test__status-value midi-test__status-value--error">
                {error}
              </span>
            </div>
          )}
        </section>

        {/* Devices Section */}
        <section className="midi-test__devices">
          <h2>Connected Devices ({devices.length})</h2>
          {devices.length === 0 ? (
            <p className="midi-test__devices-empty">
              No devices found. Connect a MIDI device and refresh the page.
            </p>
          ) : (
            <div className="midi-test__devices-list">
              {devices.map((device) => (
                <div key={device.id} className="midi-test__device">
                  <div className="midi-test__device-name">{device.name}</div>
                  <div className="midi-test__device-info">
                    {device.manufacturer && <span>{device.manufacturer}</span>}
                    <span className="midi-test__device-io">
                      {device.hasInput && "📥 Input"}
                      {device.hasOutput && " 📤 Output"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Event Log Section */}
        <section className="midi-test__log">
          <div className="midi-test__log-header">
            <h2>Event Log ({eventLogs.length})</h2>
            <div className="midi-test__log-actions">
              <Button variant="outline" size="sm" onClick={toggleLogging}>
                {isLogging ? "⏸ Pause" : "▶ Resume"}
              </Button>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                🗑 Clear
              </Button>
            </div>
          </div>

          {eventLogs.length === 0 ? (
            <p className="midi-test__log-empty">
              {isLogging
                ? "Play some notes on your MIDI controller to see events here..."
                : "Logging paused"}
            </p>
          ) : (
            <div className="midi-test__log-events">
              {eventLogs.map((event) => (
                <div key={event.id} className={`midi-test__event midi-test__event--${event.type}`}>
                  <div className="midi-test__event-type">{event.type.toUpperCase()}</div>
                  <div className="midi-test__event-details">
                    {event.channel !== undefined && (
                      <span className="midi-test__event-detail">
                        <span className="midi-test__event-label">CH</span>
                        {event.channel}
                      </span>
                    )}
                    {event.note !== undefined && (
                      <span className="midi-test__event-detail">
                        <span className="midi-test__event-label">NOTE</span>
                        {event.note} ({event.noteName})
                      </span>
                    )}
                    {event.velocity !== undefined && (
                      <span className="midi-test__event-detail midi-test__event-velocity">
                        <span className="midi-test__event-label">VEL</span>
                        <span className="midi-test__event-velocity-value">{event.velocity}</span>
                        <span
                          className="midi-test__event-velocity-bar"
                          style={{
                            width: `${(event.velocity / 127) * 100}%`,
                            backgroundColor: getVelocityColor(event.velocity),
                          }}
                        />
                      </span>
                    )}
                    {event.controller !== undefined && (
                      <span className="midi-test__event-detail">
                        <span className="midi-test__event-label">CC</span>
                        {event.controller} = {event.value}
                      </span>
                    )}
                    {event.pitch !== undefined && (
                      <span className="midi-test__event-detail">
                        <span className="midi-test__event-label">PITCH</span>
                        {event.pitch}
                      </span>
                    )}
                    {event.program !== undefined && (
                      <span className="midi-test__event-detail">
                        <span className="midi-test__event-label">PGM</span>
                        {event.program}
                      </span>
                    )}
                  </div>
                  <div className="midi-test__event-device">{event.deviceName}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info Section */}
        <section className="midi-test__info">
          <h2>Quick Reference</h2>
          <div className="midi-test__info-grid">
            <div className="midi-test__info-item">
              <h3>Note Numbers</h3>
              <p>C2 = 36, D2 = 38, E2 = 40, F2 = 41, G2 = 43, A2 = 45, B2 = 47, C3 = 48</p>
            </div>
            <div className="midi-test__info-item">
              <h3>Velocity Range</h3>
              <p>0-127 (0 = Note Off, 1-127 = Note On intensity)</p>
            </div>
            <div className="midi-test__info-item">
              <h3>Control Change</h3>
              <p>CC messages control parameters like volume, pan, effects</p>
            </div>
            <div className="midi-test__info-item">
              <h3>Pitch Bend</h3>
              <p>Range: -8192 to +8191 (center = 0)</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
