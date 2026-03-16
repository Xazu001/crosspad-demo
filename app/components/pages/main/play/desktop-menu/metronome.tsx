import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { useMetronomeLogic } from "#/lib/hooks/useMetronomeLogic";

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
  } = useMetronomeLogic();

  return (
    <div
      className={`kit-play-desktop__metronome-wrapper ${active ? "kit-play-desktop__metronome-wrapper--active" : ""}`}
    >
      <div className="kit-play-desktop__metronome-header">
        <h3 className="kit-play-desktop__metronome-title">Metronome</h3>
      </div>
      <div className="kit-play-desktop__metronome-content">
        <div className="kit-play-desktop__metronome-display">
          <div className="kit-play-desktop__metronome-controls">
            <Button
              variant="kit-play-main"
              onClick={toggleMetronome}
              className="kit-play-desktop__metronome-play-btn"
            >
              {isPlaying ? <Icon.Stop size="sm" /> : <Icon.Play size="sm" />}
            </Button>
          </div>
          <div className="kit-play-desktop__metronome-visual">
            <div
              className={`kit-play-desktop__metronome-pulse ${isPlaying ? "kit-play-desktop__metronome-pulse--active" : ""}`}
            ></div>
          </div>
          <div className="kit-play-desktop__metronome-bpm-section">
            <Button
              variant="kit-play-card"
              onClick={decreaseBpm}
              className="kit-play-desktop__metronome-btn"
            >
              <Icon.Minus size="md" />
            </Button>
            <div className="kit-play-desktop__bpm-display">
              <input
                type="number"
                value={localBpm}
                onChange={handleBpmChange}
                onBlur={handleBpmBlur}
                onKeyDown={handleBpmKeyDown}
                className="kit-play-desktop__bpm-input"
                min={0}
                max={480}
              />
              <span className="kit-play-desktop__bpm-label">BPM</span>
            </div>
            <Button
              variant="kit-play-card"
              onClick={increaseBpm}
              className="kit-play-desktop__metronome-btn"
            >
              <Icon.Plus size="md" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
