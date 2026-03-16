import { useEffect } from "react";

import { useLoaderData } from "react-router";

import { KitContainer, KitItem } from "#/components/custom/kit";
import { Button } from "#/components/ui/button";
import { createMeta } from "#/lib/seo";
import { useKitEditStore } from "#/lib/stores/kit-edit";

import type { Route } from "./+types/edit";
import { KitActionMenubar } from "./edit.kit-action-menubar";
import { action, loader } from "./edit.server";
import editStyles from "./edit.style.scss?url";

// Re-export for React Router route discovery
export { loader, action };

// ──────────────────────────────────────────────────────────────

export const links: Route.LinksFunction = () => [
  {
    rel: "preload",
    href: editStyles,
    as: "style",
  },
  {
    rel: "stylesheet",
    href: editStyles,
    precedence: "high",
  },
];

// ──────────────────────────────────────────────────────────────

export const meta: Route.MetaFunction = ({ matches }) => {
  return createMeta(matches, {
    title: "Edit Kit",
  });
};

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────

export default function KitEdit() {
  const { kits, totpEnabled } = useLoaderData<typeof loader>();

  // Use Zustand store for shared state
  const { isClient, deletedKitIds, setClient, setTransferCode } = useKitEditStore();

  // Hydrate transfer codes from server
  const { transferCodes } = useLoaderData<typeof loader>();

  useEffect(() => {
    setClient();
    // Hydrate store with transfer codes from server
    for (const entry of transferCodes) {
      setTransferCode(entry.kitId, {
        code: entry.code,
        expiresAt: entry.expiresAt,
      });
    }
  }, [setClient, transferCodes, setTransferCode]);

  // Filter out deleted kits and deletion_pending kits
  const visibleKits = kits.filter(
    (kit) => !deletedKitIds.has(kit.kit_id) && kit.kit_status !== "deletion_pending",
  );

  return (
    <main>
      <section className="kit-edit">
        <div className="kit-edit__header">
          <h2 className="kit-edit__title">Your Kits</h2>
          <Button variant="primary" size="md" to="/kit/create/samples">
            Create Kit
          </Button>
        </div>
        {visibleKits.length > 0 ? (
          <KitContainer>
            {visibleKits.map((kit) => (
              <div key={`kit-wrapper-${kit.kit_id}`} className="kit-edit__item-wrapper">
                <a href={`/kit/edit/${kit.kit_id}/samples`} className="kit-edit__item-link">
                  <KitItem {...kit} />
                </a>
                {isClient && <KitActionMenubar kit={kit} totpEnabled={totpEnabled} />}
              </div>
            ))}
          </KitContainer>
        ) : (
          <div className="kit-edit__empty">
            <p>You haven't created any kits yet.</p>
            <Button variant="outline" size="md" to="/kit/create/samples">
              Create your first kit
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
