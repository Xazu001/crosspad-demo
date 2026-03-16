// ──────────────────────────────────────────────────────────────
// Mobile Info Panel
// ──────────────────────────────────────────────────────────────
import { useLoaderData } from "react-router";

import { Avatar } from "#/components/ui/avatar";
import type { InfoPreviewData } from "#/components/uiTypes";
import { getAvatarUrl } from "#/lib/utils";
import type { loader } from "#/routes/main/kit/play.$id";

interface InfoProps {
  active?: boolean;
  previewData?: InfoPreviewData;
}

/**
 * Mobile info panel component.
 * Displays kit owner information and description.
 * Uses previewData when in preview mode, otherwise reads from route loader.
 */
export function Info({ active, previewData }: InfoProps) {
  if (previewData) {
    return (
      <InfoContent
        active={active}
        owner={previewData.owner}
        kitDescription={previewData.kit_description}
      />
    );
  }
  return <InfoFromLoader active={active} />;
}

function InfoFromLoader({ active }: { active?: boolean }) {
  const { owner, kit_description } = useLoaderData<typeof loader>();
  return <InfoContent active={active} owner={owner} kitDescription={kit_description} />;
}

function InfoContent({
  active,
  owner,
  kitDescription,
}: {
  active?: boolean;
  owner: { user_name: string | null; user_avatar_source: string | null };
  kitDescription: string | null;
}) {
  return (
    <div
      className={`kit-play-mobile__info-wrapper ${active ? "kit-play-mobile__info-wrapper--active" : ""}`}
    >
      <div className="kit-play-mobile__info-container">
        <Avatar
          src={getAvatarUrl(owner.user_avatar_source)}
          alt="Kit Owner Avatar"
          size="xl"
          shape="circle"
          bordered
          boxStyle={{
            height: "16rem",
            width: "16rem",
          }}
        />
        <strong className="kit-play-mobile__info-owner-name">{owner.user_name}</strong>
        <p className="kit-play-mobile__info-description">{kitDescription}</p>
      </div>
    </div>
  );
}
