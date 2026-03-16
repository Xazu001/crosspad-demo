import type { Kit } from "$/database/tables";
import { createResourceUrl, parseKitColors } from "@/constants";

import "./kit.style.scss";

import { Image } from "#/components/ui/image";

// ──────────────────────────────────────────────────────────────
// Kit Container
// ──────────────────────────────────────────────────────────────

interface KitContainerProps {
  children: React.ReactNode;
}

const KitContainer = ({ children }: KitContainerProps) => {
  return <div className="kit__container">{children}</div>;
};

// ──────────────────────────────────────────────────────────────
// Kit Item
// ──────────────────────────────────────────────────────────────

type KitItemProps = Record<keyof Kit, Kit[keyof Kit]>;

const KitItem = (props: KitItemProps) => {
  const kitColors = parseKitColors(props.kit_colors);

  const shortenDescription = (description: unknown) => {
    if (typeof description !== "string") return "";

    return description;
  };

  return (
    <div
      className="kit__item"
      style={
        {
          "--kit-color-main": kitColors.main,
        } as React.CSSProperties
      }
    >
      <div className="kit__item__image"></div>
      <div className="kit__item__content">
        <Image
          src={createResourceUrl("logo", props.kit_logo_source)}
          className="kit__item__content-img"
          loading="lazy"
        />

        <div className="kit__item__content-info">
          <strong>{props.kit_name}</strong>
          <p>{shortenDescription(props.kit_description)}</p>
        </div>
      </div>
    </div>
  );
};

export { KitContainer, KitItem };
