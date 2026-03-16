import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

// ──────────────────────────────────────────────────────────────

// Application route configuration
export default [
  /* API */
  route("api/cookie-consent", "routes/api/cookie-consent.ts"),
  route("api/logout", "routes/api/logout.ts"),

  /* CATCH ALL - 404 */
  route("*", "routes/$.tsx"),

  /* LEGAL */
  layout("routes/legal/layout.tsx", [
    route("landing", "routes/legal/index.tsx"),
    route("midi-test", "routes/legal/midi-test.tsx"),
    route("blog", "routes/legal/blog.tsx"),
    route("blog/:slug", "routes/legal/blog.$slug.tsx"),
    route("changelog", "routes/legal/changelog.tsx"),
    route("contact", "routes/legal/contact.tsx"),
    route("legal/all", "routes/legal/all.tsx"),
    route("legal/terms", "routes/legal/terms.tsx"),
    route("legal/privacy", "routes/legal/privacy.tsx"),
    route("legal/cookies", "routes/legal/cookies.tsx"),
    route("legal/account-rules", "routes/legal/account-rules.tsx"),
  ]),

  layout("routes/main/layout.tsx", [
    index("routes/main/home.tsx"),

    // Kit
    route("kit/edit", "routes/main/kit/edit.tsx"),
    // Edit Kit
    layout("routes/main/kit/edit-kit/layout.tsx", [
      route("kit/edit/:kitId/samples", "routes/main/kit/edit-kit/samples.tsx", {
        index: true,
      }),
      route("kit/edit/:kitId/modes", "routes/main/kit/edit-kit/modes.tsx"),
      route("kit/edit/:kitId/choke-groups", "routes/main/kit/edit-kit/choke-groups.tsx"),
      route("kit/edit/:kitId/colors", "routes/main/kit/edit-kit/colors.tsx"),
      route("kit/edit/:kitId/about", "routes/main/kit/edit-kit/about.tsx"),
    ]),
    // Edit Kit Preview
    route("kit/edit/:kitId/preview", "routes/main/kit/edit-kit/preview.tsx"),

    // Create Kit
    layout("routes/main/kit/create/layout.tsx", [
      route("kit/create/samples", "routes/main/kit/create/index.tsx", {
        index: true,
      }),
      route("kit/create/modes", "routes/main/kit/create/modes.tsx"),
      route("kit/create/choke-groups", "routes/main/kit/create/choke-groups.tsx"),
      route("kit/create/colors", "routes/main/kit/create/colors.tsx"),
      route("kit/create/about", "routes/main/kit/create/about.tsx"),
    ]),
  ]),
  // Preview Kits
  route("kit/create/preview", "routes/main/kit/create/preview.tsx"),

  // Play Kit
  route("kit/play/:id", "routes/main/kit/play.$id.tsx"),

  /* AUTH */
  layout("routes/auth/layout.tsx", [
    route("login", "routes/auth/login.tsx"),
    route("register", "routes/auth/register.tsx"),
  ]),

  /* PROFILE */
  layout("routes/profile/layout.tsx", [
    route("profile/profile", "routes/profile/index.tsx", { index: true }),
    route("profile/notifications", "routes/profile/notifications.tsx"),
    route("profile/settings", "routes/profile/settings.tsx"),
  ]),

  /* ADMIN */
  route("admin", "routes/admin/index.tsx"),

  /* TESTS */
] satisfies RouteConfig;
