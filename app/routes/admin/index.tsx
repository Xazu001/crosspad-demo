// ──────────────────────────────────────────────────────────────
// Imports
// ──────────────────────────────────────────────────────────────
import { adminCommands, useAdminContext } from "#/lib/admin";

import { AdminTerminal } from "./index.admin-terminal";

// Re-export for React Router route discovery
export { loader } from "./index.server";

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

export default function AdminCLI() {
  const { context } = useAdminContext();

  return (
    <div className="admin-cli">
      <div className="admin-cli__container">
        <AdminTerminal
          commands={adminCommands}
          context={context}
          username="admin"
          hostname="crosspad"
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Meta
// ──────────────────────────────────────────────────────────────

export function meta() {
  return [{ title: "Admin CLI - Crosspad" }, { name: "robots", content: "noindex" }];
}
