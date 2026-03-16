import React from "react";

import { Ripple } from "#/components/ui/ripple";
import { usePadContext } from "#/lib/contexts/PadContext";
import type { KitPad } from "#/lib/stores/playKit";

// Custom hook with error handling for HMR
const usePadContextSafe = () => {
  try {
    return usePadContext();
  } catch (error) {
    // Return a safe fallback context during HMR
    return {
      activePads: new Set(),
      pressedPads: new Set(),
      loopingPads: new Set(),
      padProgress: new Map(),
      ripples: [],
      handlePadPointerDown: () => {},
      handlePadPointerUp: () => {},
      handlePadPointerLeave: () => {},
      handlePadClick: () => {},
      addKeyboardRipple: () => {},
      registerPadRef: () => {},
    };
  }
};

// ──────────────────────────────────────────────────────────────

export interface PadProps {
  /** Pad data */
  pad: KitPad;
  /** Pad index */
  index: number;
  /** Device type */
  deviceType: "desktop" | "mobile";
}

// ──────────────────────────────────────────────────────────────

/** Pad component for playing sounds */
export const Pad: React.FC<PadProps> = ({ pad, index, deviceType }) => {
  const {
    activePads,
    pressedPads,
    loopingPads,
    padProgress,
    ripples,
    handlePadPointerDown,
    handlePadPointerUp,
    handlePadPointerLeave,
    handlePadClick,
    registerPadRef,
  } = usePadContextSafe();

  const isActive = activePads.has(index);
  const isPressed = pressedPads.has(index);
  const isLooping = loopingPads.has(index);
  const progress = padProgress.get(index) || 0;
  const padRipples = ripples.filter((r) => r.padIndex === index);

  const padRef = React.useRef<HTMLButtonElement>(null);

  // Register pad ref with context
  React.useEffect(() => {
    registerPadRef(index, padRef.current);
  }, [index, registerPadRef]);

  const prefix = deviceType === "desktop" ? "kit-play-desktop" : "kit-play-mobile";

  const className = `${prefix}__pad ${
    isActive ? `${prefix}__pad--active` : ""
  } ${isPressed ? `${prefix}__pad--pressed` : ""} ${
    isLooping && pad.pad_play_mode === "toggle" ? `${prefix}__pad--toggled` : ""
  }`;

  return (
    <button
      ref={padRef}
      className={className}
      style={
        {
          "--progress": `${progress}`,
        } as React.CSSProperties
      }
      onPointerDown={(e) => handlePadPointerDown(index, e)}
      onPointerUp={(e) => handlePadPointerUp(index, e)}
      onPointerLeave={(e) => handlePadPointerLeave(index, e)}
      onClick={() => handlePadClick(index)}
    >
      {/* Render ripples for this pad */}
      {padRipples.map((ripple) => (
        <Ripple
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
          onComplete={() => {
            // Ripple will be automatically cleaned up by the context
          }}
        />
      ))}
    </button>
  );
};
