import { Suspense, lazy } from "react";

import { Outlet, useLocation, useNavigate } from "react-router";

import {
  AsideMenu,
  AsideMenuContent,
  AsideMenuItem,
  AsideMenuPanel,
  AsideMenuTrigger,
} from "#/components/ui/aside-menu";
import { Button } from "#/components/ui/button";
import { ButtonGroup, ButtonGroupItem } from "#/components/ui/button-group";
import { Icon } from "#/components/ui/icon";
import { createMeta } from "#/lib/seo";

import type { Route } from "./+types/layout";
import { loader } from "./layout.server";
import layoutStyles from "./layout.style.scss?url";

// Re-export for React Router route discovery
export { loader };

// ──────────────────────────────────────────────────────────────

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

// Lazy load BeamsBackground to prevent Three.js from loading immediately
const BeamsBackground = lazy(() =>
  import("#/components/custom/beams-background").then((mod) => ({
    default: mod.BeamsBackground,
  })),
);

// ──────────────────────────────────────────────────────────────

export const meta: Route.MetaFunction = ({ matches }) => {
  return createMeta(matches);
};

// ──────────────────────────────────────────────────────────────

/** Profile layout with navigation */
export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const currentPath = location.pathname;

  return (
    <AsideMenu>
      <AsideMenuPanel variant="glass-popover">
        <AsideMenuContent>
          <AsideMenuItem
            isActive={currentPath === "/profile/profile"}
            onClick={() => handleNavigation("/profile/profile")}
          >
            Profile
          </AsideMenuItem>
          <AsideMenuItem
            isActive={currentPath === "/profile/settings"}
            onClick={() => handleNavigation("/profile/settings")}
          >
            Settings
          </AsideMenuItem>
          <AsideMenuItem
            isActive={currentPath === "/profile/notifications"}
            onClick={() => handleNavigation("/profile/notifications")}
          >
            Notifications
          </AsideMenuItem>
        </AsideMenuContent>
      </AsideMenuPanel>
      <main
        className="nopt"
        style={{
          background: "#000",
        }}
      >
        <Suspense fallback={null}>
          <BeamsBackground />
        </Suspense>
        <div className="profile__top-bar">
          <div className=""></div>
          <Button
            to="/"
            variant="glass-card"
            aspectSquare
            className="profile__go-home"
            modifiers={{
              noPaddingInline: true,
            }}
          >
            <Icon.Home size="md" />
          </Button>
          <AsideMenuTrigger className="profile__menu-trigger" asChild>
            <Button
              variant="glass-card"
              aspectSquare
              modifiers={{
                noPaddingInline: true,
              }}
            >
              <Icon.Menu size="md" />
            </Button>
          </AsideMenuTrigger>
        </div>
        <section className="profile">
          <div className="profile__container">
            <div className="profile__menu">
              <ButtonGroup
                size="lg"
                direction="column"
                variant="glass-card"
                className="profile__menu-group"
              >
                <ButtonGroupItem
                  isActive={currentPath === "/profile/profile"}
                  onClick={() => handleNavigation("/profile/profile")}
                >
                  Profile
                </ButtonGroupItem>
                <ButtonGroupItem
                  isActive={currentPath === "/profile/settings"}
                  onClick={() => handleNavigation("/profile/settings")}
                >
                  Settings
                </ButtonGroupItem>
                <ButtonGroupItem
                  isActive={currentPath === "/profile/notifications"}
                  onClick={() => handleNavigation("/profile/notifications")}
                >
                  Notifications
                </ButtonGroupItem>
              </ButtonGroup>
            </div>
            <div className="profile__content">
              <Outlet />
            </div>
          </div>
        </section>
      </main>
    </AsideMenu>
  );
}
