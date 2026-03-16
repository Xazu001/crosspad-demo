import * as React from "react";
import { useMemo } from "react";

import { EditConfigModal } from "#/components/custom/edit-config-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { useMidiStore } from "#/lib/stores/midi";

export function Controls({ active }: { active?: boolean }) {
  const { inputDevices, selectedDeviceId, selectDevice, isSupported, isReady, error } =
    useMidiStore();

  const handleDeviceChange = (value: string | string[]) => {
    const deviceValue = Array.isArray(value) ? value[0] : value;
    selectDevice(deviceValue === "none" ? null : deviceValue);
  };

  const deviceLabels = useMemo(() => {
    const labels: Record<string, string> = { none: "None" };
    inputDevices.forEach((d) => {
      labels[d.id] = d.name;
    });
    return labels;
  }, [inputDevices]);

  return (
    <div
      className={`kit-play-desktop__controls-wrapper ${active ? "kit-play-desktop__controls-wrapper--active" : ""}`}
    >
      <div className="kit-play-desktop__controls-header">
        <h3 className="kit-play-desktop__controls-title">Controls</h3>
        <EditConfigModal />
      </div>
      <div className="kit-play-desktop__controls-content">
        <div className="kit-play-desktop__control-item">
          <label className="kit-play-desktop__control-label">MIDI Device</label>
          {!isSupported ? (
            <p className="kit-play-desktop__control-message kit-play-desktop__control-message--error">
              MIDI not supported in this browser
            </p>
          ) : !isReady ? (
            <p className="kit-play-desktop__control-message kit-play-desktop__control-message--loading">
              Initializing MIDI...
            </p>
          ) : error ? (
            <p className="kit-play-desktop__control-message kit-play-desktop__control-message--error">
              {error.message}
            </p>
          ) : inputDevices.length === 0 ? (
            <p className="kit-play-desktop__control-message kit-play-desktop__control-message--empty">
              No MIDI devices found. Connect a MIDI device and refresh the page.
            </p>
          ) : (
            <Select
              value={selectedDeviceId || "none"}
              onValueChange={handleDeviceChange}
              labels={deviceLabels}
              variant="outline"
              contentVariant="outline"
              itemsSize="lg"
              size="lg"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {inputDevices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
}
