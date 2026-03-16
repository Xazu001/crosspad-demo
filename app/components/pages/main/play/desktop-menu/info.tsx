// ──────────────────────────────────────────────────────────────
// Desktop Info Panel
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
 * Info panel component for desktop menu.
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
  owner: { user_name: string | null; user_avatar_source: string | null; is_featured?: boolean };
  kitDescription: string | null;
}) {
  const avatar_src = owner?.is_featured
    ? owner.user_avatar_source
    : getAvatarUrl(owner.user_avatar_source);

  return (
    <div
      className={`kit-play-desktop__info-wrapper ${active ? "kit-play-desktop__info-wrapper--active" : ""}`}
    >
      <div className="kit-play-desktop__info-content">
        <Avatar
          src={avatar_src || undefined}
          alt="Kit Owner Avatar"
          size="2xl"
          shape="circle"
          className="kit-play-desktop__info-avatar"
          bordered
        />
        <strong className="kit-play-desktop__info-owner-name">{owner.user_name}</strong>
        <p className="kit-play-desktop__info-description">{kitDescription}</p>
      </div>
    </div>
  );
}
