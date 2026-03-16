import { useState } from "react";

/**
 * Simple system for managing exclusive activation of multiple panels
 * Only allows one panel to be active at a time
 */
export function useExclusiveActivation(
  initialActive: string | null = null,
  alwaysActive: boolean = false,
) {
  const [activePanel, setActivePanel] = useState<string | null>(
    alwaysActive ? initialActive || "sliders" : initialActive,
  );

  const activatePanel = (panelId: string) => {
    // If alwaysActive, don't allow closing panels
    if (alwaysActive) {
      setActivePanel(panelId);
    } else {
      // If clicking the same panel, close it
      if (activePanel === panelId) {
        setActivePanel(null);
      } else {
        setActivePanel(panelId);
      }
    }
  };

  const deactivatePanel = () => {
    if (!alwaysActive) {
      setActivePanel(null);
    }
  };

  const isPanelActive = (panelId: string) => activePanel === panelId;

  return {
    activePanel,
    activatePanel,
    deactivatePanel,
    isPanelActive,
  };
}

/**
 * Complex system for managing multiple panels with advanced features
 * Supports up to 5 different panels with additional controls
 */
export function usePanelSystem() {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [panelHistory, setPanelHistory] = useState<string[]>([]);
  const [panelStates, setPanelStates] = useState<Record<string, any>>({});

  const activatePanel = (panelId: string, state?: any) => {
    // Add to history before switching
    if (activePanel && activePanel !== panelId) {
      setPanelHistory((prev) => [...prev.slice(-4), activePanel]); // Keep last 5
    }

    // If clicking the same panel, close it
    if (activePanel === panelId) {
      setActivePanel(null);
    } else {
      setActivePanel(panelId);
      if (state !== undefined) {
        setPanelStates((prev) => ({ ...prev, [panelId]: state }));
      }
    }
  };

  const deactivatePanel = () => {
    if (activePanel) {
      setPanelHistory((prev) => [...prev.slice(-4), activePanel]);
    }
    setActivePanel(null);
  };

  const goToPreviousPanel = () => {
    if (panelHistory.length > 0) {
      const previousPanel = panelHistory[panelHistory.length - 1];
      setActivePanel(previousPanel);
      setPanelHistory((prev) => prev.slice(0, -1));
    }
  };

  const isPanelActive = (panelId: string) => activePanel === panelId;

  const getPanelState = (panelId: string) => panelStates[panelId];

  const setPanelState = (panelId: string, state: any) => {
    setPanelStates((prev) => ({ ...prev, [panelId]: state }));
  };

  return {
    activePanel,
    panelHistory,
    activatePanel,
    deactivatePanel,
    goToPreviousPanel,
    isPanelActive,
    getPanelState,
    setPanelState,
  };
}

// Panel IDs for type safety
export const PANEL_IDS = {
  SLIDERS: "sliders",
  INFO: "info",
  METRONOME: "metronome",
  RECORDING: "recording",
  CONTROLS: "controls",
} as const;

export type PanelId = (typeof PANEL_IDS)[keyof typeof PANEL_IDS];
