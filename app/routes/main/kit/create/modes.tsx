import { PadPlayMode } from "@/enums";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { useCreateKitStore } from "#/lib/stores/createKit";

// ──────────────────────────────────────────────────────────────

/** Kit creation - pad modes configuration */
export default function Index() {
  const { data, setPadPlayMode } = useCreateKitStore();

  return (
    <div className="pads">
      <div className="pads__container">
        {data.pads.map((pad, index) => {
          // Direct mapping: index is both display and storage
          const displayIndex = index;
          const hasMultipleSamples = pad.samples && pad.samples.length > 1;
          const isCycleMode = pad.playMode === PadPlayMode.CYCLE;

          // Filter available modes - remove cycle if pad has only one sample
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
