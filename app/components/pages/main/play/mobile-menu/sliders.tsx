import { Slider } from "#/components/custom/slider";
import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { useSlidersLogic } from "#/lib/hooks/useSlidersLogic";

import { MinimalModal } from "./minimal-modal";

export function Sliders({ active }: { active?: boolean }) {
  const {
    volumeValue,
    pitchValue,
    frequencyValue,
    activeItem,
    handleVolumeChange,
    handlePitchChange,
    handleFrequencyChange,
    handlePrevSlide,
    handleNextSlide,
  } = useSlidersLogic();

  return (
    <MinimalModal active={active}>
      <div className="kit-play-mobile__sliders-wrapper">
        <Button
          variant="kit-play-card"
          onClick={handlePrevSlide}
          className="kit-play-mobile__slider-btn kit-play-mobile__slider-btn--left"
        >
          <Icon.ChevronLeft />
        </Button>

        <div
          className="kit-play-mobile__sliders-tape"
          style={{ "--active-item": activeItem } as React.CSSProperties}
        >
          <div className="kit-play-mobile__slider-wrapper">
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
              className="kit-play-mobile__slider"
            />
          </div>
          <div className="kit-play-mobile__slider-wrapper">
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
              className="kit-play-mobile__slider"
            />
          </div>
          <div className="kit-play-mobile__slider-wrapper">
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
              className="kit-play-mobile__slider"
            />
          </div>
        </div>
        <Button
          variant="kit-play-card"
          onClick={handleNextSlide}
          className="kit-play-mobile__slider-btn kit-play-mobile__slider-btn--right"
        >
          <Icon.ChevronRight />
        </Button>
      </div>
    </MinimalModal>
  );
}
