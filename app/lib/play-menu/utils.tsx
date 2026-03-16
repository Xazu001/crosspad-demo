import { Icon } from "#/components/ui/icon";

import { type IconName } from "./config";

// ──────────────────────────────────────────────────────────────

/** Renders an icon component based on the icon name */
export const renderIcon = (iconName: IconName) => {
  const IconComponent = Icon[iconName];
  return <IconComponent size="lg" />;
};
