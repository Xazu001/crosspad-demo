import { useEffect, useRef } from "react";

import { audioController } from "#/lib/music/controller";

/**
 * Hook to mute audio when the page loses focus (tab switch, minimize, etc.)
 * and restore volume when focus returns.
 *
 * Uses both:
 * - `visibilitychange` — for tab switching, minimizing window
 * - `blur` on window — for switching to another app/browser tab via click
 *
 * @param enabled - Whether the focus tracking is active (default: true)
 */
export function useAudioFocus(enabled = true): void {
  const mutedByUsRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const muteIfNotAlready = () => {
      if (!audioController.getIsMuted()) {
        audioController.mute();
        mutedByUsRef.current = true;
      }
    };

    const unmuteIfWeMuted = () => {
      if (mutedByUsRef.current) {
        audioController.unmute();
        mutedByUsRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        muteIfNotAlready();
      } else {
        unmuteIfWeMuted();
      }
    };

    const handleWindowBlur = () => {
      muteIfNotAlready();
    };

    const handleWindowFocus = () => {
      unmuteIfWeMuted();
    };

    // Set up event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [enabled]);
}
