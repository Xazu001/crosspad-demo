// ──────────────────────────────────────────────────────────────
// Pad Interactions Hook
// ──────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";

export interface RippleState {
  id: string;
  x: number;
  y: number;
  padIndex: number;
  pointerId: number;
  isPrimary: boolean;
}

export interface UsePadInteractionsReturn {
  ripples: RippleState[];
  padRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  handlePadClick: (padIndex: number, event: React.PointerEvent) => void;
  handlePointerUp: (event: React.PointerEvent) => void;
  handlePointerLeave: (event: React.PointerEvent) => void;
  removeRipple: (id: string) => void;
}

/**
 * Hook for managing pad ripple effects using Pointer Events API.
 * Handles multi-touch, mouse, and pen interactions through unified API.
 */
export const usePadInteractions = (): UsePadInteractionsReturn => {
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const padRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activePointers = useRef<Map<number, string>>(new Map());

  // Handler for pointer down - creates ripple
  const handlePadClick = useCallback((padIndex: number, event: React.PointerEvent) => {
    // Ignore right mouse button
    if (event.button === 2) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple: RippleState = {
      id: `pointer-${event.pointerId}-${Date.now()}`,
      x,
      y,
      padIndex,
      pointerId: event.pointerId,
      isPrimary: event.isPrimary,
    };

    // Track this pointer
    activePointers.current.set(event.pointerId, newRipple.id);

    // Add ripple
    setRipples((prev) => [...prev, newRipple]);

    // Prevent default touch behavior
    if (event.pointerType === "touch") {
      event.preventDefault();
    }
  }, []);

  // Global handler dla pointer up - nie usuwamy ripple, kończy animację
  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    // Tylko usuwamy z active pointers, ripple zostaje do końca animacji
    activePointers.current.delete(event.pointerId);
  }, []);

  // Global handler dla pointer leave - nie usuwamy ripple, kończy animację
  const handlePointerLeave = useCallback((event: React.PointerEvent) => {
    // Tylko usuwamy z active pointers, ripple zostaje do końca animacji
    activePointers.current.delete(event.pointerId);
  }, []);

  // Remove ripple po animacji
  const removeRipple = useCallback((id: string) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Global cleanup dla wszystkich aktywnych pointerów
  useEffect(() => {
    const handleGlobalPointerUp = (event: PointerEvent) => {
      // Tylko usuwamy z active pointers, ripple kończy animację
      activePointers.current.delete(event.pointerId);
    };

    const handleGlobalPointerCancel = (event: PointerEvent) => {
      // Przy cancel usuwamy ripple od razu
      const rippleId = activePointers.current.get(event.pointerId);
      if (rippleId) {
        activePointers.current.delete(event.pointerId);
        setRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }
    };

    // Listen for global pointer events
    document.addEventListener("pointerup", handleGlobalPointerUp);
    document.addEventListener("pointercancel", handleGlobalPointerCancel);
    document.addEventListener("pointerleave", handleGlobalPointerUp);

    return () => {
      document.removeEventListener("pointerup", handleGlobalPointerUp);
      document.removeEventListener("pointercancel", handleGlobalPointerCancel);
      document.removeEventListener("pointerleave", handleGlobalPointerUp);
    };
  }, []);

  return {
    ripples,
    padRefs,
    handlePadClick,
    handlePointerUp,
    handlePointerLeave,
    removeRipple,
  };
};
