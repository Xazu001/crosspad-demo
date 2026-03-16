import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import { usePlayKitStore } from "#/lib/stores/playKit";

// ──────────────────────────────────────────────────────────────

export interface RippleState {
  /** Unique identifier for the ripple */
  id: string;
  /** X position relative to pad */
  x: number;
  /** Y position relative to pad */
  y: number;
  /** Creation timestamp for cleanup */
  timestamp: number;
  /** Index of the pad that created the ripple */
  padIndex: number;
}

export interface PadContextValue {
  // State from store
  /** Currently active pads */
  activePads: Set<number>;
  /** Currently pressed pads */
  pressedPads: Set<number>;
  /** Currently looping pads */
  loopingPads: Set<number>;
  /** Progress of currently playing pads */
  padProgress: Map<number, number>;

  // Ripple management
  /** Array of active ripples */
  ripples: RippleState[];
  /** Add ripple from pointer event */
  addRipple: (padIndex: number, event: React.PointerEvent) => void;
  /** Add ripple from keyboard event */
  addKeyboardRipple: (padIndex: number, padElement: HTMLElement) => void;

  // Audio handlers
  getPadHandlers: (padIndex: number) => {
    onMouseDown: () => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onClick: () => void;
  };

  // Combined handlers for pads
  handlePadPointerDown: (padIndex: number, event: React.PointerEvent) => void;
  handlePadPointerUp: (padIndex: number, event: React.PointerEvent) => void;
  handlePadPointerLeave: (padIndex: number, event: React.PointerEvent) => void;
  handlePadClick: (padIndex: number) => void;
  registerPadRef: (padIndex: number, element: HTMLElement | null) => void;
}

const PadContext = createContext<PadContextValue | null>(null);

export interface PadProviderProps {
  children: React.ReactNode;
}

export const PadProvider: React.FC<PadProviderProps> = ({ children }) => {
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const padRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Get state and handlers from the play kit store
  const { activePads, pressedPads, loopingPads, padProgress, padHandlers } = usePlayKitStore();

  // Register pad ref
  const registerPadRef = useCallback((padIndex: number, element: HTMLElement | null) => {
    if (element) {
      padRefs.current.set(padIndex, element);
    } else {
      padRefs.current.delete(padIndex);
    }
  }, []);

  // Add ripple when pad is pressed
  const addRipple = useCallback((padIndex: number, event: React.PointerEvent) => {
    // Ignore right button
    if (event.button === 2) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple: RippleState = {
      id: `ripple-${padIndex}-${event.pointerId}-${Date.now()}`,
      x,
      y,
      timestamp: Date.now(),
      padIndex,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Prevent default touch behavior
    if (event.pointerType === "touch") {
      event.preventDefault();
    }
  }, []);

  // Add ripple at center for keyboard events
  const addKeyboardRipple = useCallback((padIndex: number, padElement: HTMLElement) => {
    const rect = padElement.getBoundingClientRect();
    const x = rect.width / 2;
    const y = rect.height / 2;

    const newRipple: RippleState = {
      id: `ripple-${padIndex}-keyboard-${Date.now()}`,
      x,
      y,
      timestamp: Date.now(),
      padIndex,
    };

    setRipples((prev) => [...prev, newRipple]);
  }, []);

  // Combined handlers
  const handlePadPointerDown = useCallback(
    (padIndex: number, event: React.PointerEvent) => {
      addRipple(padIndex, event);
      padHandlers(padIndex).onMouseDown();
    },
    [addRipple, padHandlers],
  );

  const handlePadPointerUp = useCallback(
    (padIndex: number, event: React.PointerEvent) => {
      padHandlers(padIndex).onMouseUp();
    },
    [padHandlers],
  );

  const handlePadPointerLeave = useCallback(
    (padIndex: number, event: React.PointerEvent) => {
      padHandlers(padIndex).onMouseLeave();
    },
    [padHandlers],
  );

  const handlePadClick = useCallback(
    (padIndex: number) => {
      padHandlers(padIndex).onClick();
    },
    [padHandlers],
  );

  // Clean up old ripples
  React.useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setRipples(
        (prev) => prev.filter((ripple) => now - ripple.timestamp < 600), // Remove ripples older than 600ms
      );
    }, 100);

    return () => clearInterval(cleanup);
  }, []);

  // Listen for keyboard and MIDI pad events
  React.useEffect(() => {
    const handlePadDown = (e: CustomEvent) => {
      const padElement = padRefs.current.get(e.detail.padIndex);
      if (padElement) {
        addKeyboardRipple(e.detail.padIndex, padElement);
      }
    };

    window.addEventListener("keyboardPadDown", handlePadDown as EventListener);
    window.addEventListener("midiPadDown", handlePadDown as EventListener);

    return () => {
      window.removeEventListener("keyboardPadDown", handlePadDown as EventListener);
      window.removeEventListener("midiPadDown", handlePadDown as EventListener);
    };
  }, [addKeyboardRipple]);

  const contextValue = useMemo(
    () => ({
      activePads,
      pressedPads,
      loopingPads,
      padProgress,
      ripples,
      addRipple,
      addKeyboardRipple,
      getPadHandlers: padHandlers,
      handlePadPointerDown,
      handlePadPointerUp,
      handlePadPointerLeave,
      handlePadClick,
      registerPadRef,
    }),
    [
      activePads,
      pressedPads,
      loopingPads,
      padProgress,
      ripples,
      addRipple,
      addKeyboardRipple,
      padHandlers,
      handlePadPointerDown,
      handlePadPointerUp,
      handlePadPointerLeave,
      handlePadClick,
      registerPadRef,
    ],
  );

  return <PadContext.Provider value={contextValue}>{children}</PadContext.Provider>;
};

export const usePadContext = (): PadContextValue => {
  const context = useContext(PadContext);
  if (!context) {
    throw new Error("usePadContext must be used within a PadProvider");
  }
  return context;
};
