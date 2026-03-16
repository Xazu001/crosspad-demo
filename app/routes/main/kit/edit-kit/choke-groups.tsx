import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { useEditKitStore } from "#/lib/stores/editKit";

// ──────────────────────────────────────────────────────────────

export default function ChokeGroups() {
  const { data, setPadChokeGroup } = useEditKitStore();

  return (
    <div className="pads">
      <div className="pads__container">
        {data.pads.map((pad, index) => {
          const displayIndex = index;

          return (
            <div key={`pad-${displayIndex}`} className="pads__pad">
              <Select
                variant="secondary"
                size="sm"
                value={pad.chokeGroup?.toString() || "undefined"}
                onValueChange={(value) => {
                  if (value === "undefined") {
                    setPadChokeGroup(displayIndex, undefined as any);
                  } else {
                    const groupValue = Array.isArray(value) ? value[0] : value;
                    setPadChokeGroup(displayIndex, parseInt(groupValue));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undefined">None</SelectItem>
                  {Array.from({ length: 16 }, (_, num) => (
                    <SelectItem key={num + 1} value={(num + 1).toString()}>
                      {num + 1}
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
