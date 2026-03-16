import "./nav.style.scss";

import * as React from "react";

import { Link, useFetcher, useNavigate, useNavigation, useRouteLoaderData } from "react-router";

import { Avatar } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Menubar, MenubarItem, MenubarSeparator } from "#/components/ui/menubar";
import { type loader as rootLoader } from "#/root";

type RootLoaderData = typeof rootLoader;

interface NavProps {
  /** Left side content */
  leftContent?: React.ReactNode;
  /** Middle content */
  middleContent?: React.ReactNode;
  /** Right side content */
  rightContent?: React.ReactNode;
  /** Container styles */
  containerStyle?: React.CSSProperties;
}

// ──────────────────────────────────────────────────────────────

/** Navigation component */
const Nav = ({ leftContent, middleContent, rightContent, containerStyle }: NavProps) => {
  const loaderData = useRouteLoaderData<RootLoaderData>("root");
  const navigation = useNavigation();

  const user = loaderData?.user;

  // Default left content (logo)
  const defaultLeftContent = (
    <div
      className={`nav__logo ${navigation.state === "loading" || navigation.state === "submitting" ? "nav__logo--loading" : ""}`}
    >
      <Link to="/">
        <img src="/assets/logo.png" alt="Two green S letters connected into one symbol" />
      </Link>
    </div>
  );

  // Default middle content (menu)
  const defaultMiddleContent = <div className="nav__menu"></div>;

  // Default right content (CTAs)
  const defaultRightContent = (
    <div className="nav__ctas">
      {user ? (
        <UserMenu />
      ) : (
        <Button
          variant="primary"
          size="md"
          to="/login"
          prefetch="render"
          style={{
            height: "100%",
          }}
        >
          Sign In
        </Button>
      )}
    </div>
  );

  return (
    <nav className="nav">
      <div className="nav__container" style={containerStyle}>
        {leftContent || defaultLeftContent}
        {middleContent || defaultMiddleContent}
        {rightContent || defaultRightContent}
      </div>
    </nav>
  );
};

// ──────────────────────────────────────────────────────────────

/** User menu component */
const UserMenu = () => {
  const loaderData = useRouteLoaderData<RootLoaderData>("root");
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const user = loaderData?.user;

  const handleSignOut = () => {
    fetcher.submit({}, { method: "POST", action: "/api/logout" });
  };

  // Handle logout response
  React.useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const data = fetcher.data as { success?: boolean; error?: string };
      if (data.success) {
        navigate("/", { replace: true });
      }
    }
  }, [fetcher.data, fetcher.state, navigate]);

  if (!user) return null;

  return (
    <Menubar
      size="sm"
      align="end"
      variant="popover"
      trigger={
        <button className="nav__user-avatar" role="button">
          <Avatar
            size="sm"
            src={user.user_avatar_source || undefined}
            alt={`${user.user_name}'s avatar`}
            bordered
          />
          <span className="nav__user-name">{user.user_name}</span>
        </button>
      }
    >
      <MenubarItem asChild>
        <Link to="/profile/profile">Profile</Link>
      </MenubarItem>
      <MenubarItem asChild>
        <Link to="/profile/settings">Settings</Link>
      </MenubarItem>
      <MenubarSeparator />
      {loaderData.user?.user_create_kit === 1 && (
        <>
          <MenubarItem asChild>
            <Link to="/kit/create/samples">Create Kit</Link>
          </MenubarItem>
          <MenubarItem asChild>
            <Link to="/kit/edit">Edit Kit</Link>
          </MenubarItem>
          <MenubarSeparator />
        </>
      )}

      {loaderData.user?.user_admin === 1 && (
        <MenubarItem asChild>
          <Link to="/admin">Admin</Link>
        </MenubarItem>
      )}
      <MenubarItem className="menubar__item--destructive" onClick={handleSignOut}>
        Sign Out
      </MenubarItem>
    </Menubar>
  );
};

export { Nav };
