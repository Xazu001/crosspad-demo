import { Outlet, useFetcher, useLocation, useNavigate } from "react-router";

import { MobileMessage } from "#/components/custom/mobile-message";
import { ButtonGroup, ButtonGroupItem } from "#/components/ui/button-group";

import type { Route } from "./+types/layout";
import { loader } from "./layout.server";
import layoutStyles from "./layout.style.scss?url";

// Re-export for React Router route discovery
export { loader };

export const links: Route.LinksFunction = () => [
  {
    rel: "preload",
    href: layoutStyles,
    as: "style",
  },
  {
    rel: "stylesheet",
    href: layoutStyles,
    precedence: "high",
  },
];

// ──────────────────────────────────────────────────────────────

/** Kit creation layout with navigation */
export default function Layout() {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const currentPath = location.pathname;

  return (
    <>
      <MobileMessage description="Create Kit is not supported on mobile yet!" />
      <main>
        <section className="kit-create">
          <div className="kit-create__container">
            <ButtonGroup size="lg" direction="column" variant="card" className="kit-create__menu">
              <ButtonGroupItem
                isActive={currentPath === "/kit/create/samples"}
                onClick={() => handleNavigation("/kit/create/samples")}
              >
                Samples
              </ButtonGroupItem>
              <ButtonGroupItem
                isActive={currentPath === "/kit/create/modes"}
                onClick={() => handleNavigation("/kit/create/modes")}
              >
                Modes
              </ButtonGroupItem>
              <ButtonGroupItem
                isActive={currentPath === "/kit/create/choke-groups"}
                onClick={() => handleNavigation("/kit/create/choke-groups")}
              >
                Choke Groups
              </ButtonGroupItem>
              <ButtonGroupItem
                isActive={currentPath === "/kit/create/colors"}
                onClick={() => handleNavigation("/kit/create/colors")}
              >
                Colors
              </ButtonGroupItem>
              <ButtonGroupItem
                isActive={currentPath === "/kit/create/about"}
                onClick={() => handleNavigation("/kit/create/about")}
              >
                About
              </ButtonGroupItem>
            </ButtonGroup>
            <div className="kit-create__wrapper">
              <Outlet context={{ fetcher: fetcher }} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
