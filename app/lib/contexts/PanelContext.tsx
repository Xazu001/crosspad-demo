import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// ──────────────────────────────────────────────────────────────

interface PanelContextType {
  /** Whether any panel is currently active */
  isAnyPanelActive: boolean;
  /** Set the active state of panels */
  setIsAnyPanelActive: (active: boolean) => void;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

// ──────────────────────────────────────────────────────────────

/** Provider for panel state management */
export function PanelProvider({ children }: { children: ReactNode }) {
  // Check if we're on desktop (default to true for SSR)
  const [isDesktop, setIsDesktop] = useState(true);

  // Initial state: always active on desktop, inactive on mobile
  const [isAnyPanelActive, setIsAnyPanelActive] = useState(true);

  return (
    <PanelContext.Provider value={{ isAnyPanelActive, setIsAnyPanelActive }}>
      {children}
    </PanelContext.Provider>
  );
}

// ──────────────────────────────────────────────────────────────

/** Hook to access panel state */
export function usePanelState() {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error("usePanelState must be used within a PanelProvider");
  }
  return context;
}
