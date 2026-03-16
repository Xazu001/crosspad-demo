import { Outlet } from "react-router";

import { Nav } from "#/components/custom/nav";

// ──────────────────────────────────────────────────────────────

/** Main app layout with navigation */
export default function MainAppLayout() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}
