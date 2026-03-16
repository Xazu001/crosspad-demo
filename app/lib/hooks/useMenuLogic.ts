import { useEffect } from "react";

import { usePanelState } from "#/lib/contexts/PanelContext";
import { useExclusiveActivation } from "#/lib/hooks/usePanelSystem";
import { getIsAnyPanelActive } from "#/lib/play-menu/config";

/**
 * Shared hook for menu logic used by both desktop and mobile components
 */
export function useMenuLogic(isMobile?: boolean) {
  const { activatePanel, isPanelActive } = useExclusiveActivation(null, !isMobile);
  const { setIsAnyPanelActive } = usePanelState();

  // Check if any panel is active (excluding INFO on mobile since it doesn't have Modal/MinimalModal)
  const isAnyPanelActive = getIsAnyPanelActive(isPanelActive, isMobile);

  // Update panel state when any panel becomes active/inactive
  useEffect(() => {
    setIsAnyPanelActive(isAnyPanelActive);
  }, [isAnyPanelActive, setIsAnyPanelActive]);

  return {
    activatePanel,
    isPanelActive,
    isAnyPanelActive,
  };
}
