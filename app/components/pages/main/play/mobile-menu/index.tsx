// ──────────────────────────────────────────────────────────────
// Mobile Menu Component
// ──────────────────────────────────────────────────────────────
import { Button } from "#/components/ui/button";
import type { InfoPreviewData } from "#/components/uiTypes";
import { useMenuLogic } from "#/lib/hooks/useMenuLogic";
import { menuItems } from "#/lib/play-menu/config";
import { renderIcon } from "#/lib/play-menu/utils";

import { Controls } from "./controls";
import { Info } from "./info";
import { Metronome } from "./metronome";
import { Recording } from "./recording";
import { Sliders } from "./sliders";

/**
 * Mobile menu for kit playback controls.
 * Renders panels and menu buttons for mobile layout.
 */
export function KitPlayMobileMenu({ previewData }: { previewData?: InfoPreviewData } = {}) {
  // Shared menu logic for panel management
  const { activatePanel, isPanelActive } = useMenuLogic(true);

  return (
    <>
      <Info active={isPanelActive("info")} previewData={previewData} />
      <Controls active={isPanelActive("controls")} />
      <Sliders active={isPanelActive("sliders")} />
      <Metronome active={isPanelActive("metronome")} />
      <Recording active={isPanelActive("recording")} />
      <div className="kit-play-mobile__menu">
        <div className="kit-play-mobile__ctas">
          {menuItems.map((item) => {
            const isActive = isPanelActive(item.panelId);

            return (
              <Button
                key={item.id}
                isActive={isActive}
                variant="kit-play-card"
                onClick={() => !item.disabled && activatePanel(item.panelId)}
                disabled={item.disabled}
              >
                {renderIcon(item.iconName)}
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
}
