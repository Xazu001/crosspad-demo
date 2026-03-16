import "./info-boundary.style.scss";

import { Link, isRouteErrorResponse } from "react-router";

import { DotLetters } from "#/components/custom/dot-letters";
import { Button } from "#/components/ui/button";

import type { Route } from ".react-router/types/app/routes/main/kit/+types/edit"; // Using this cause i cant import proper root file :/

// ──────────────────────────────────────────────────────────────

/** Error boundary component for displaying route errors */
const InfoBoundary = (props: Route.ErrorBoundaryProps) => {
  const resBody = isRouteErrorResponse(props.error) ? String(props.error.data) : "Unknown";

  const resCode = isRouteErrorResponse(props.error) ? String(props.error.status) : "XXX";

  const resText = isRouteErrorResponse(props.error) ? props.error.statusText : "Unknown";

  return (
    <main>
      <section className="info-boundary">
        <div className="info-boundary__container">
          <div className="info-boundary__left">
            <h2 className="info-boundary__title">
              Something Bad <br /> Happened Just Here
            </h2>
            <p className="info-boundary__body">{resBody}</p>
            <div className="info-boundary__text-wrapper">
              <p className="info-boundary__text">{resText}</p>
            </div>
            <Link to="/" className="info-boundary__link">
              <Button size="lg" variant="ghost">
                Back to Home
              </Button>
            </Link>
          </div>
          <div className="info-boundary__right">
            <DotLetters dotScale={2} outerPadding={2} letterGapColumns={2} letters={resCode} />
          </div>
        </div>
      </section>
    </main>
  );
};

export { InfoBoundary };
