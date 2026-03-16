import { Slider } from "#/components/custom/slider";
import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { useSlidersLogic } from "#/lib/hooks/useSlidersLogic";

export function Sliders({ active }: { active?: boolean }) {
  const {
    volumeValue,
    pitchValue,
    frequencyValue,
    handleVolumeChange,
    handlePitchChange,
    handleFrequencyChange,
    handleReset,
  } = useSlidersLogic();

  return (
    <div
      className={`kit-play-desktop__sliders-wrapper ${active ? "kit-play-desktop__sliders-wrapper--active" : ""}`}
    >
      <div className="kit-play-desktop__sliders-header">
        <h3 className="kit-play-desktop__sliders-title">Settings</h3>
        <Button
          variant="kit-play-card"
          onClick={handleReset}
          className="kit-play-desktop__reset-btn"
        >
          <Icon.Reset size="sm" />
          Reset All
        </Button>
      </div>
      <div className="kit-play-desktop__sliders-content">
        <div className="kit-play-desktop__slider-wrapper">
          <Slider
            variant="kit-play"
            name="volume"
            min={0}
            max={100}
            value={volumeValue}
            onChange={handleVolumeChange}
            label="Volume"
            showValue={true}
            valueSuffix="%"
            className="kit-play-desktop__slider"
          />
        </div>
        <div className="kit-play-desktop__slider-wrapper">
          <Slider
            variant="kit-play"
            name="pitch"
            min={-12}
            max={12}
            value={pitchValue}
            onChange={handlePitchChange}
            label="Pitch"
            showValue={true}
            valueSuffix=" st"
            className="kit-play-desktop__slider"
          />
        </div>
        <div className="kit-play-desktop__slider-wrapper">
          <Slider
            variant="kit-play"
            name="frequency"
            min={0.1}
            max={2}
            step={0.1}
            value={frequencyValue}
            onChange={handleFrequencyChange}
            label="LPF"
            showValue={true}
            valueSuffix="x"
            className="kit-play-desktop__slider"
          />
        </div>
      </div>
    </div>
  );
}
