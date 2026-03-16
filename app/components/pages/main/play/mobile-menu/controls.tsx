import * as React from "react";
import { useMemo } from "react";

import { EditConfigModal } from "#/components/custom/edit-config-modal";
import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { useMidiStore } from "#/lib/stores/midi";

import { MinimalModal } from "./minimal-modal";

export function Controls({ active }: { active?: boolean }) {
  const { inputDevices, selectedDeviceId, selectDevice, isSupported, isReady, error } =
    useMidiStore();

  const handleDeviceChange = (value: string | string[]) => {
    const deviceValue = Array.isArray(value) ? value[0] : value;
    selectDevice(deviceValue === "none" ? null : deviceValue);
  };

  const noneLabel = inputDevices.length === 0 ? "None (Connect and Refresh)" : "None";

  const deviceLabels = useMemo(() => {
    const labels: Record<string, string> = {
      none: noneLabel,
    };
    inputDevices.forEach((d) => {
      labels[d.id] = d.name;
    });
    return labels;
  }, [inputDevices, noneLabel]);

  return (
    <MinimalModal active={active}>
      <div className="kit-play-mobile__controls-content">
        <div className="kit-play-mobile__controls-row">
          <div className="kit-play-mobile__control-select-wrapper">
            {!isSupported ? (
              <p className="kit-play-mobile__control-message kit-play-mobile__control-message--error">
                MIDI not supported
              </p>
            ) : !isReady ? (
              <p className="kit-play-mobile__control-message kit-play-mobile__control-message--loading">
                Initializing...
              </p>
            ) : error ? (
              <p className="kit-play-mobile__control-message kit-play-mobile__control-message--error">
                MIDI Error
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
                direction="up"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select MIDI device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{noneLabel}</SelectItem>
                  {inputDevices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <EditConfigModal
            trigger={
              <Button
                variant="kit-play-card"
                className="kit-play-mobile__edit-config-btn"
                size="lg"
                modifiers={{
                  noPaddingInline: true,
                }}
              >
                <Icon.Bolt size="sm" />
              </Button>
            }
          />
        </div>
      </div>
    </MinimalModal>
  );
}
