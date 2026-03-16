import { type FC, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { Canvas, type CanvasProps } from "@react-three/fiber";

// Suppress Three.js deprecation warnings caused by R3F internals
import "./suppress-warnings";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface ShaderCanvasProps {
  children: ReactNode;
  className?: string;
  /** Background color used for CSS fallback and WebGL clear color */
  backgroundColor?: string;
  /** Device pixel ratio range */
  dpr?: CanvasProps["dpr"];
  /** Frame loop mode */
  frameloop?: CanvasProps["frameloop"];
  /** Additional WebGL context attributes */
  gl?: Omit<NonNullable<CanvasProps["gl"]>, "alpha">;
  /** Inline styles for the canvas element */
  canvasStyle?: React.CSSProperties;
  /** Inline styles for the outer wrapper */
  style?: React.CSSProperties;
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

/**
 * Flash-free WebGL canvas wrapper for shader scenes.
 *
 * Handles three layers of anti-flash protection:
 * 1. CSS background on container + canvas (instant, no white frame)
 * 2. WebGL clear color set on context creation (before first frame)
 * 3. Canvas hidden via opacity until onCreated fires
 * 4. beforeunload hides container to prevent teardown flash
 */
const ShaderCanvas: FC<ShaderCanvasProps> = ({
  children,
  className,
  backgroundColor = "#000000",
  dpr = [1, 2],
  frameloop = "always",
  gl,
  canvasStyle,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Hide container instantly when page starts unloading to prevent
  // white flash from WebGL context teardown
  useEffect(() => {
    const hide = () => {
      if (containerRef.current) {
        containerRef.current.style.visibility = "hidden";
      }
    };
    window.addEventListener("beforeunload", hide);
    return () => window.removeEventListener("beforeunload", hide);
  }, []);

  const handleCreated = useCallback(
    (state: { gl: { setClearColor: (color: string, alpha: number) => void } }) => {
      const alpha = backgroundColor === "transparent" ? 0 : 1;
      const clearColor = backgroundColor === "transparent" ? "#000000" : backgroundColor;
      state.gl.setClearColor(clearColor, alpha);
      setReady(true);
    },
    [backgroundColor],
  );

  return (
    <div
      ref={containerRef}
      className={`shader-canvas ${className || ""}`}
      style={{ backgroundColor, ...style }}
    >
      <Canvas
        dpr={dpr}
        frameloop={frameloop}
        className="shader-canvas__viewport"
        gl={{
          alpha: backgroundColor === "transparent",
          antialias: true,
          ...gl,
        }}
        onCreated={handleCreated}
        style={{
          backgroundColor,
          opacity: ready ? 1 : 0,
          ...canvasStyle,
        }}
      >
        {children}
      </Canvas>
    </div>
  );
};

export { ShaderCanvas };
export type { ShaderCanvasProps };
