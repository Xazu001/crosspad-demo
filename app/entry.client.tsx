import { StrictMode, startTransition } from "react";

import { hydrateRoot } from "react-dom/client";

import { HydratedRouter } from "react-router/dom";

// ──────────────────────────────────────────────────────────────

// Hydrate the app on the client
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
