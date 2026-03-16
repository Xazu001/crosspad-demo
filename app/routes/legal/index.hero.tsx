import { Suspense, lazy } from "react";

import { PageReveal } from "#/components/custom/animations/page-reveal";
import { Button } from "#/components/ui/button";

// Lazy load BeamsBackground to prevent Three.js from loading on initial page load
const BeamsBackground = lazy(() =>
  import("#/components/custom/beams-background").then((mod) => ({
    default: mod.BeamsBackground,
  })),
);

export function Hero() {
  return (
    <section id="hero" className="hero">
      <Suspense fallback={null}>
        <BeamsBackground className="hero__background" />
      </Suspense>
      <PageReveal>
        <div className="hero__content">
          <h1 className="hero__title">
            Introducing the
            <br />
            Launchpad Platform
          </h1>
          <p className="hero__description">
            Web App for the Best Fingerdrummers
            <br />
            with MIDI devices support and more!
          </p>
          <div className="hero__actions">
            <Button variant="primary" size="lg" to="/">
              Try Our Beats
            </Button>
          </div>
        </div>
      </PageReveal>
    </section>
  );
}
