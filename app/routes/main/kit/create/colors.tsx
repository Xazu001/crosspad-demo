import type { KitColors } from "$/database/schema";
import { DEFAULT_KIT_COLORS } from "@/constants";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useCreateKitStore } from "#/lib/stores/createKit";

// ──────────────────────────────────────────────────────────────

type KitColorKey = keyof KitColors;

/** Color field definitions for kit customization */
const COLOR_FIELDS: { key: KitColorKey; label: string }[] = [
  { key: "main", label: "Main" },
  { key: "mainHover", label: "Main Hover" },
  { key: "mainForeground", label: "Main Foreground" },
  { key: "border", label: "Border" },
  { key: "card", label: "Card" },
  { key: "cardBorder", label: "Card Border" },
  { key: "background", label: "Background" },
  { key: "foreground", label: "Foreground" },
];

// ──────────────────────────────────────────────────────────────

/** Normalize hex color input */
function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";

  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  return withHash;
}

function getOverrides(colors: KitColors): KitColors {
  const overrides: KitColors = {};

  for (const field of COLOR_FIELDS) {
    const key = field.key;
    const value = colors[key];

    if (!value) continue;

    const normalized = normalizeHex(value);
    const defaultValue = DEFAULT_KIT_COLORS[key];

    if (defaultValue && normalized.toLowerCase() === defaultValue.toLowerCase()) {
      continue;
    }

    overrides[key] = normalized;
  }

  return overrides;
}

export default function Colors() {
  const { data, setKitColors } = useCreateKitStore();

  const handleReset = () => {
    setKitColors({
      main: undefined,
      mainHover: undefined,
      mainForeground: undefined,
      border: undefined,
      card: undefined,
      cardBorder: undefined,
      background: undefined,
      foreground: undefined,
    });
  };

  const handleChange = (key: KitColorKey, nextValueRaw: string) => {
    const nextValue = normalizeHex(nextValueRaw);

    const nextColors: KitColors = {
      ...data.colors,
      [key]: nextValue.length === 0 ? undefined : nextValue,
    };

    const overrides = getOverrides(nextColors);

    if (Object.keys(overrides).length === 0) {
      handleReset();
      return;
    }

    setKitColors({
      main: overrides.main,
      mainHover: overrides.mainHover,
      mainForeground: overrides.mainForeground,
      border: overrides.border,
      card: overrides.card,
      cardBorder: overrides.cardBorder,
      background: overrides.background,
      foreground: overrides.foreground,
    });
  };

  return (
    <div className="kit-colors">
      <div className="kit-colors__header">
        <Button variant="card" size="sm" type="button" onClick={handleReset}>
          Reset to default
        </Button>
      </div>

      <div className="kit-colors__grid">
        {COLOR_FIELDS.map(({ key, label }) => {
          const overrideValue = data.colors[key] ?? "";
          const previewValue = data.colors[key] ?? DEFAULT_KIT_COLORS[key] ?? "transparent";

          return (
            <div key={key} className="kit-colors__item">
              <div
                className="kit-colors__swatch"
                style={{
                  background: previewValue,
                }}
              />

              <div className="kit-colors__controls">
                <div className="kit-colors__label">{label}</div>
                <Input
                  variant="secondary"
                  size="sm"
                  placeholder="default"
                  value={overrideValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(key, e.target.value)
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
