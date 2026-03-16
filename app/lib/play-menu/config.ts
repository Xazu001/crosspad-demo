import { type Icon } from "#/components/ui/icon";
import { type PANEL_IDS } from "#/lib/hooks/usePanelSystem";

// ──────────────────────────────────────────────────────────────

export type IconName = keyof typeof Icon;

export interface MenuItem {
  /** Menu item identifier */
  id: keyof typeof PANEL_IDS;
  /** Display label */
  label: string;
  /** Icon to display */
  iconName: IconName;
  /** Panel ID to activate */
  panelId: string;
  /** Whether the item is disabled */
  disabled?: boolean;
}

// ──────────────────────────────────────────────────────────────

/** Configuration for desktop menu items */
export const menuItems: MenuItem[] = [
  {
    id: "METRONOME",
    label: "Metronome",
    iconName: "CircleGauge",
    panelId: "metronome",
  },
  {
    id: "RECORDING",
    label: "Recording",
    iconName: "Disc3",
    panelId: "recording",
  },
  {
    id: "CONTROLS",
    label: "Controls",
    iconName: "Turntable",
    panelId: "controls",
  },
  {
    id: "SLIDERS",
    label: "Settings",
    iconName: "Settings2",
    panelId: "sliders",
  },
  {
    id: "INFO",
    label: "Info",
    iconName: "Info",
    panelId: "info",
  },
];

// Helper function to check if any panel is active
export const getIsAnyPanelActive = (
  isPanelActive: (panelId: string) => boolean,
  isMobile?: boolean,
) => {
  const panels = ["sliders", "metronome", "recording", "controls"];

  // Only include info for desktop
  if (!isMobile) {
    panels.push("info");
  }

  return panels.some((panelId) => isPanelActive(panelId));
};

// Panel components that need to be rendered
export const panelComponents = {
  INFO: "Info",
  SLIDERS: "Sliders",
  METRONOME: "Metronome",
  RECORDING: "Recording",
  CONTROLS: "Controls",
} as const;
