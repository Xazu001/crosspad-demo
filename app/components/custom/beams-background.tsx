import "./beams-background.style.scss";

import { Suspense, lazy } from "react";

import { ClientOnly } from "#/components/custom/client-only";

// ──────────────────────────────────────────────────────────────

// Lazy load Beams component to prevent Three.js from loading on pages that don't use it
const Beams = lazy(() =>
  import("#/components/custom/beams.client").then((mod) => ({
    default: mod.Beams,
  })),
);

/** Animated beams background component */
const BeamsBackground = ({ className }: { className?: string }) => {
  return (
    <div className={`beams-background ${className || ""}`}>
      <ClientOnly>
        <Suspense fallback={null}>
          <Beams
            beamWidth={2}
            beamHeight={100}
            beamNumber={30}
            lightColor="#9CE232"
            speed={3}
            noiseIntensity={3}
            scale={0.15}
            rotation={135}
          />
        </Suspense>
      </ClientOnly>
    </div>
  );
};

export { BeamsBackground };
