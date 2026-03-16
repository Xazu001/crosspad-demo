import type { KitColors } from "$/database/schema";
import { DEFAULT_KIT_COLORS, createResourceUrl } from "@/constants";

import { useEffect } from "react";

import {
  Outlet,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import { MobileMessage } from "#/components/custom/mobile-message";
import { ButtonGroup, ButtonGroupItem } from "#/components/ui/button-group";
import { createMeta } from "#/lib/seo";
import { useEditKitStore } from "#/lib/stores/editKit";

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

export const meta: Route.MetaFunction = ({ matches }) => {
  return createMeta(matches);
};

// ──────────────────────────────────────────────────────────────

export default function Layout() {
  const { kit } = useLoaderData<typeof loader>();
  const { initialize, kitId } = useEditKitStore();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const basePath = `/kit/edit/${params.kitId}`;
  const currentPath = location.pathname;

  useEffect(() => {
    if (!kit || kitId === kit.kit_id) return;

    const pads = Array.from({ length: 16 }, (_, i) => {
      const serverPad = kit.pads?.find((p: any) => p.pad_position === i);
      return {
        name: serverPad?.pad_name || `Pad ${i + 1}`,
        samples:
          serverPad?.samples?.map((s: any) => createResourceUrl("sample", s.sample_source)) || [],
        chokeGroup: serverPad?.pad_choke_group ?? undefined,
        playMode: serverPad?.pad_play_mode ?? undefined,
      };
    });

    // Only store color overrides — values matching defaults stay undefined
    const colorOverrides: KitColors = {};
    const colorKeys: (keyof KitColors)[] = [
      "main",
      "mainHover",
      "mainForeground",
      "border",
      "card",
      "cardBorder",
      "background",
      "foreground",
    ];
    for (const key of colorKeys) {
      const val = kit.colors?.[key];
      if (val && val.toLowerCase() !== DEFAULT_KIT_COLORS[key]?.toLowerCase()) {
        colorOverrides[key] = val;
      }
    }

    const existingLogoUrl = kit.kit_logo_source
      ? createResourceUrl("logo", kit.kit_logo_source)
      : undefined;

    initialize(
      kit.kit_id,
      {
        pads,
        colors: colorOverrides,
        about: {
          name: kit.kit_name || "",
          description: kit.kit_description || "",
          logo: undefined,
        },
        categories: kit.categories?.map((c: any) => c.category_id).filter(Boolean) || [],
      },
      existingLogoUrl,
    );
  }, [kit, kitId, initialize]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <>
      <MobileMessage description="Edit Kit is not supported on mobile yet!" />
      <main>
        <section className="kit-create">
          <div className="kit-create__container">
            <ButtonGroup size="lg" direction="column" variant="card" className="kit-create__menu">
              <ButtonGroupItem
                isActive={currentPath === `${basePath}/samples`}
                onClick={() => handleNavigation(`${basePath}/samples`)}
              >
                Samples
              </ButtonGroupItem>
              <ButtonGroupItem
                isActive={currentPath === `${basePath}/modes`}
                onClick={() => handleNavigation(`${basePath}/modes`)}
              >
                Modes
              </ButtonGroupItem>
              <ButtonGroupItem
                isActive={currentPath === `${basePath}/choke-groups`}
                onClick={() => handleNavigation(`${basePath}/choke-groups`)}
              >
                Choke Groups
              </ButtonGroupItem>
              <ButtonGroupItem
                isActive={currentPath === `${basePath}/colors`}
                onClick={() => handleNavigation(`${basePath}/colors`)}
              >
                Colors
              </ButtonGroupItem>
              <ButtonGroupItem
                isActive={currentPath === `${basePath}/about`}
                onClick={() => handleNavigation(`${basePath}/about`)}
              >
                About
              </ButtonGroupItem>
            </ButtonGroup>
            <div className="kit-create__wrapper">
              <Outlet context={{ fetcher }} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
