// ──────────────────────────────────────────────────────────────
// Sliders Logic Hook
// ──────────────────────────────────────────────────────────────
import { useState } from "react";

import { createSliderHandler } from "#/lib/music/slider-utils";
import { usePlayKit } from "#/lib/stores/playKit";

interface UseSlidersLogicProps {
  maxItems?: number;
  defaultActiveItem?: number;
}

/**
 * Hook for managing slider controls logic.
 * Handles volume, pitch, and frequency sliders with navigation.
 */
export function useSlidersLogic({
  maxItems = 2,
  defaultActiveItem = 2,
}: UseSlidersLogicProps = {}) {
  const { volumeValue, setVolume, pitchValue, setPitchValue, frequencyValue, setFrequencyValue } =
    usePlayKit();

  const [activeItem, setActiveItem] = useState(defaultActiveItem);

  const handleVolumeChange = createSliderHandler(setVolume);
  const handlePitchChange = createSliderHandler(setPitchValue);
  const handleFrequencyChange = createSliderHandler(setFrequencyValue);

  const handlePrevSlide = () => {
    setActiveItem((prev) => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    setActiveItem((prev) => Math.min(maxItems, prev + 1));
  };

  /** Reset all sliders to default values */
  const handleReset = () => {
    setVolume(100);
    setPitchValue(0);
    setFrequencyValue(1);
  };

  return {
    // Values
    volumeValue,
    pitchValue,
    frequencyValue,
    activeItem,

    // Handlers
    handleVolumeChange,
    handlePitchChange,
    handleFrequencyChange,
    handlePrevSlide,
    handleNextSlide,
    handleReset,
  };
}
