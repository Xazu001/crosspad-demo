import { useCallback, useEffect, useState } from "react";

import { usePlayKitStore } from "#/lib/stores/playKit";

export interface RippleState {
  id: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface PadControllerState {
  isActive: boolean;
  isPressed: boolean;
  isLooping: boolean;
  progress: number;
  ripples: RippleState[];
}

export interface PadControllerHandlers {
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onPointerLeave: (event: React.PointerEvent) => void;
  onClick: () => void;
}

export interface UsePadControllerReturn {
  state: PadControllerState;
  handlers: PadControllerHandlers;
}

/**
 * Unified hook for managing individual pad interactions
 * Combines audio logic, visual feedback, and state management
 */
export const usePadController = (padIndex: number): UsePadControllerReturn => {
  const [ripples, setRipples] = useState<RippleState[]>([]);

  // Get state and handlers from the play kit store
  const { kit, activePads, pressedPads, loopingPads, padProgress, padHandlers } = usePlayKitStore();

  // Calculate pad state
  const state: PadControllerState = {
    isActive: activePads.has(padIndex),
    isPressed: pressedPads.has(padIndex),
    isLooping: loopingPads.has(padIndex),
    progress: padProgress.get(padIndex) || 0,
    ripples,
  };

  // Create ripple on pointer down
  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
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
      };

      setRipples((prev) => [...prev, newRipple]);

      // Prevent default touch behavior
      if (event.pointerType === "touch") {
        event.preventDefault();
      }

      // Trigger audio handler
      padHandlers(padIndex).onMouseDown();
    },
    [padIndex, padHandlers],
  );

  // Handle pointer up
  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      padHandlers(padIndex).onMouseUp();
    },
    [padIndex, padHandlers],
  );

  // Handle pointer leave
  const handlePointerLeave = useCallback(
    (event: React.PointerEvent) => {
      padHandlers(padIndex).onMouseLeave();
    },
    [padIndex, padHandlers],
  );

  // Handle click
  const onClick = useCallback(() => {
    padHandlers(padIndex).onClick();
  }, [padIndex, padHandlers]);

  // Clean up old ripples
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setRipples(
        (prev) => prev.filter((ripple) => now - ripple.timestamp < 600), // Remove ripples older than 600ms
      );
    }, 100);

    return () => clearInterval(cleanup);
  }, []);

  const handlers: PadControllerHandlers = {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerLeave: handlePointerLeave,
    onClick: onClick,
  };

  return {
    state,
    handlers,
  };
};
