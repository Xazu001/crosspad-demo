import { useEffect, useState } from "react";

import { usePlayKit } from "#/lib/stores/playKit";

import { useMetronome } from "./useMetronome";

interface UseMetronomeLogicProps {
  minBpm?: number;
  maxBpm?: number;
}

export function useMetronomeLogic({ minBpm = 40, maxBpm = 360 }: UseMetronomeLogicProps = {}) {
  const { volumeValue } = usePlayKit();
  const { isPlaying, bpm, volume, setVolume, toggleMetronome, increaseBpm, decreaseBpm, setBpm } =
    useMetronome(volumeValue);
  const [localBpm, setLocalBpm] = useState(bpm.toString());

  // Update local state when bpm changes from outside
  useEffect(() => {
    setLocalBpm(bpm.toString());
  }, [bpm]);

  // Sync metronome volume with main volume
  useEffect(() => {
    setVolume(volumeValue);
  }, [volumeValue, setVolume]);

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty input
    if (value === "") {
      setLocalBpm(value);
      return;
    }

    // Parse number
    const numValue = parseInt(value);

    // If not a number, don't update
    if (isNaN(numValue)) {
      return;
    }

    // Apply min/max constraints
    if (numValue < minBpm) {
      setLocalBpm(minBpm.toString());
      setBpm(minBpm);
    } else if (numValue > maxBpm) {
      setLocalBpm(maxBpm.toString());
      setBpm(maxBpm);
    } else {
      setLocalBpm(value);
      setBpm(numValue);
    }
  };

  const handleBpmBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < minBpm) {
      setBpm(minBpm);
      setLocalBpm(minBpm.toString());
    } else if (value > maxBpm) {
      setBpm(maxBpm);
      setLocalBpm(maxBpm.toString());
    } else {
      setBpm(value);
    }
  };

  const handleBpmKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return {
    isPlaying,
    bpm,
    localBpm,
    handleBpmChange,
    handleBpmBlur,
    handleBpmKeyDown,
    toggleMetronome,
    increaseBpm,
    decreaseBpm,
  };
}
