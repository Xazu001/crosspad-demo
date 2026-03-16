import { DotLetters } from "#/components/custom/dot-letters";
import { Button } from "#/components/ui/button";
import { createErrorMeta } from "#/lib/seo";

import type { Route } from "./+types/$";

// ──────────────────────────────────────────────────────────────

/** Meta tags for 404 page */
export const meta: Route.MetaFunction = () => createErrorMeta("404");

/** 404 Not Found page */
export default function Index() {
  return (
    <main>
      <section className="info-boundary">
        <div className="info-boundary__container">
          <div className="info-boundary__left">
            <h2 className="info-boundary__title">
              Page Not Found <br /> The URL doesn't <br /> Exist
            </h2>
            <p className="info-boundary__desc">404 Not Found</p>
            <Button size="lg" variant="ghost" to="/">
              Back to Home
            </Button>
          </div>
          <div className="info-boundary__right">
            <DotLetters dotScale={2} outerPadding={2} letterGapColumns={2} letters="404" />
          </div>
        </div>
      </section>
    </main>
  );
}
