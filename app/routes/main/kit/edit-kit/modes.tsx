import { PadPlayMode } from "@/enums";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { useEditKitStore } from "#/lib/stores/editKit";

// ──────────────────────────────────────────────────────────────

export default function Modes() {
  const { data, setPadPlayMode } = useEditKitStore();

  return (
    <div className="pads">
      <div className="pads__container">
        {data.pads.map((pad, index) => {
          const displayIndex = index;
          const hasMultipleSamples = pad.samples && pad.samples.length > 1;
          const isCycleMode = pad.playMode === PadPlayMode.CYCLE;

          const availableModes =
            hasMultipleSamples || isCycleMode
              ? Object.values(PadPlayMode)
              : Object.values(PadPlayMode).filter((mode) => mode !== PadPlayMode.CYCLE);

          return (
            <div key={`pad-${displayIndex}`} className="pads__pad">
              <Select
                variant="secondary"
                size="sm"
                value={pad.playMode}
                onValueChange={(value) => setPadPlayMode(displayIndex, value as any)}
              >
                <SelectTrigger disabled={hasMultipleSamples}>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {availableModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
