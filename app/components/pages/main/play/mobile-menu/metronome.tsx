// ──────────────────────────────────────────────────────────────
// Mobile Metronome Panel
// ──────────────────────────────────────────────────────────────
import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { Input } from "#/components/ui/input";
import { useMetronomeLogic } from "#/lib/hooks/useMetronomeLogic";

import { MinimalModal } from "./minimal-modal";

/**
 * Mobile metronome panel component.
 * Provides BPM control and play/pause functionality.
 */
export function Metronome({ active }: { active?: boolean }) {
  const {
    isPlaying,
    bpm,
    localBpm,
    handleBpmChange,
    handleBpmBlur,
    handleBpmKeyDown,
    toggleMetronome,
    increaseBpm,
    decreaseBpm,
  } = useMetronomeLogic({ minBpm: 0, maxBpm: 240 });

  return (
    <MinimalModal active={active}>
      <div className="kit-play-mobile__metronome-wrapper">
        <div className="kit-play-mobile__metronome-display">
          <Button
            variant="kit-play-main"
            onClick={toggleMetronome}
            className="kit-play-mobile__metronome-play-btn"
            modifiers={{
              radiusFull: true,
            }}
          >
            {isPlaying ? <Icon.Stop size="sm" /> : <Icon.Play size="sm" />}
          </Button>
          <div className="kit-play-mobile__metronome-bpm-section">
            <Button
              variant="kit-play-card"
              onClick={decreaseBpm}
              className="kit-play-mobile__metronome-btn"
            >
              <Icon.Minus size="sm" />
            </Button>
            <div className="kit-play-mobile__bpm-display">
              <Input
                type="number"
                variant="clean"
                displayModalOnMobile
                value={localBpm}
                onChange={handleBpmChange}
                onBlur={handleBpmBlur}
                onKeyDown={handleBpmKeyDown}
                className="kit-play-mobile__bpm-input"
                min={0}
                max={480}
              />
              <span className="kit-play-mobile__bpm-label">BPM</span>
            </div>
            <Button
              variant="kit-play-card"
              onClick={increaseBpm}
              className="kit-play-mobile__metronome-btn"
            >
              <Icon.Plus size="sm" />
            </Button>
          </div>
        </div>
      </div>
    </MinimalModal>
  );
}
