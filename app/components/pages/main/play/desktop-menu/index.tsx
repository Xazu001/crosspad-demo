// ──────────────────────────────────────────────────────────────
// Desktop Menu Component
// ──────────────────────────────────────────────────────────────
/** Desktop menu component for kit playback */
import { Button } from "#/components/ui/button";
import type { InfoPreviewData } from "#/components/uiTypes";
import { cn } from "#/components/utils";
import { useMenuLogic } from "#/lib/hooks/useMenuLogic";
import { menuItems } from "#/lib/play-menu/config";
import { renderIcon } from "#/lib/play-menu/utils";

import { Controls } from "./controls";
import { Info } from "./info";
import { Metronome } from "./metronome";
import { Modal } from "./modal";
import { Recording } from "./recording";
import { Sliders } from "./sliders";

/**
 * Desktop menu for kit playback controls.
 * Provides access to info, metronome, recording, and sliders panels.
 */
export function KitPlayDesktopMenu({ previewData }: { previewData?: InfoPreviewData } = {}) {
  // Shared menu logic for panel management
  const { activatePanel, isPanelActive, isAnyPanelActive } = useMenuLogic(false);

  return (
    <>
      <div className="kit-play-desktop__menu" aria-label="Kit controls">
        <div className="kit-play-desktop__list">
          {menuItems
            // .filter((item, index) => 0)
            .map((item) => {
              const isActive = isPanelActive(item.panelId);
              return (
                <Button
                  key={item.id}
                  variant="kit-play-card"
                  size="lg"
                  className={cn("kit-play-desktop-menu__button")}
                  isActive={isActive}
                  onClick={() => !item.disabled && activatePanel(item.panelId)}
                  disabled={item.disabled}
                >
                  <span className="kit-play-desktop-menu__button-icon" aria-hidden="true">
                    {renderIcon(item.iconName)}
                  </span>
                </Button>
              );
            })}
        </div>
        <Modal isActive={isAnyPanelActive}>
          <div className="kit-play-desktop__menu-content">
            <Metronome active={isPanelActive("metronome")} />
            <Recording active={isPanelActive("recording")} />
            <Controls active={isPanelActive("controls")} />
            <Sliders active={isPanelActive("sliders")} />
            <Info active={isPanelActive("info")} previewData={previewData} />
          </div>
        </Modal>
      </div>
    </>
  );
}
