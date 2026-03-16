// ──────────────────────────────────────────────────────────────
// Pads Translation Hook
// ──────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";

/**
 * Hook for managing mobile pads container translation.
 * Calculates and applies translation to ensure pads don't overlap with mobile menu.
 */
export function usePadsTranslation() {
  const [translationValue, setTranslationValue] = useState("0rem");

  useEffect(() => {
    const calculateTranslation = () => {
      // Get viewport height
      const viewportHeight = window.innerHeight;

      const bottomMenuElement = document.querySelector(".kit-play-mobile__menu") as HTMLElement;
      const padsContainerElement = document.querySelector(
        ".kit-play-mobile__pads-container",
      ) as HTMLElement;

      // Get space between bottom menu and pads container elements
      const spaceBetweenElements =
        bottomMenuElement && padsContainerElement
          ? bottomMenuElement.getBoundingClientRect().top -
            padsContainerElement.getBoundingClientRect().bottom
          : 0;

      console.log("space between elements", spaceBetweenElements);

      // Calculate total required space (pads container + space between + bottom menu)
      const totalRequiredSpace = 280;

      // Calculate how much space we need to free up
      if (totalRequiredSpace <= spaceBetweenElements) {
        // Enough space - no translation needed
        setTranslationValue("0rem");
      } else {
        // Not enough space - calculate translation
        const shortage = totalRequiredSpace - viewportHeight;
        const translationPx = Math.min(shortage, 200); // Cap at 200px to avoid too much translation
        const translationRem = translationPx / 16; // Convert to rem
        setTranslationValue(`${translationRem}px`);
      }
    };

    // Calculate on mount
    calculateTranslation();

    // Calculate on resize with debouncing
    let timeoutId: number;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(calculateTranslation, 150);
    };

    window.addEventListener("resize", handleResize);

    // Also calculate when fonts are loaded or DOM changes
    const observer = new ResizeObserver(calculateTranslation);
    const navEl = document.querySelector(".nav") as HTMLElement;
    const bottomMenuEl = document.querySelector(".kit-play-mobile__menu") as HTMLElement;

    if (navEl) observer.observe(navEl);
    if (bottomMenuEl) observer.observe(bottomMenuEl);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return translationValue;
}
