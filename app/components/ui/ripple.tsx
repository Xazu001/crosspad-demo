import "./ripple.style.scss";

import { useEffect, useRef } from "react";

// ──────────────────────────────────────────────────────────────

interface RippleProps {
  x: number;
  y: number;
  onComplete: () => void;
}

/** Ripple component for pad interactions */
export function Ripple({ x, y, onComplete }: RippleProps) {
  const rippleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ripple = rippleRef.current;
    if (!ripple) return;

    // Set position
    ripple.style.setProperty("--x", `${x}px`);
    ripple.style.setProperty("--y", `${y}px`);

    // Start animation
    ripple.classList.add("ripple--animate");

    // Clean up when animation ends
    const handleAnimationEnd = () => {
      onComplete();
    };

    ripple.addEventListener("animationend", handleAnimationEnd);

    return () => {
      ripple.removeEventListener("animationend", handleAnimationEnd);
    };
  }, [x, y, onComplete]);

  return <div ref={rippleRef} className="ripple" />;
}
