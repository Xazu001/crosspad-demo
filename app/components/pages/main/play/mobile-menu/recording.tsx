import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { useRecordingLogic } from "#/lib/hooks/useRecordingLogic";
import { formatTime } from "#/lib/utils/time-utils";

interface RecordingProps {
  active?: boolean;
}

interface MinimalModalProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  active?: boolean;
}

function MinimalModal({ children, active, ...props }: MinimalModalProps) {
  return (
    <div
      className={`kit-play-mobile__minimal-modal ${active ? "kit-play-mobile__minimal-modal--active" : ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Recording({ active }: RecordingProps) {
  const {
    fileInputRef,
    isRecording,
    isPlayingRecording,
    recording,
    recordingTime,
    playbackTime,
    recordingDuration,
    handleRecordClick,
    handlePlayClick,
    handleExportClick,
    handleImportClick,
    handleFileChange,
    clearRecording,
  } = useRecordingLogic();

  return (
    <MinimalModal active={active}>
      <div className="kit-play-mobile__recording-wrapper">
        <div className="kit-play-mobile__recording-display">
          <div className="kit-play-mobile__recording-left">
            <Button
              variant="kit-play-main"
              onClick={handleRecordClick}
              className="kit-play-mobile__recording-btn"
              modifiers={{
                radiusFull: true,
              }}
            >
              {isRecording ? <Icon.Stop size="sm" /> : <Icon.Circle size="sm" />}
            </Button>

            <Button
              variant="kit-play-main"
              onClick={handlePlayClick}
              className="kit-play-mobile__recording-btn"
              disabled={!recording || recording.events.length === 0}
              modifiers={{
                radiusFull: true,
              }}
            >
              {isPlayingRecording ? <Icon.Pause size="sm" /> : <Icon.Play size="sm" />}
            </Button>
            <span className="kit-play-mobile__recording-time-display">
              {isRecording
                ? formatTime(recordingTime)
                : formatTime(recordingDuration - playbackTime)}
            </span>
          </div>

          <div className="kit-play-mobile__recording-actions">
            <Button
              variant="kit-play-card"
              onClick={handleExportClick}
              className="kit-play-mobile__recording-action-btn"
              disabled={!recording || recording.events.length === 0}
            >
              <Icon.Download size="sm" />
            </Button>

            <Button
              variant="kit-play-card"
              onClick={handleImportClick}
              className="kit-play-mobile__recording-action-btn"
            >
              <Icon.Upload size="sm" />
            </Button>

            <Button
              variant="kit-play-card"
              onClick={clearRecording}
              className="kit-play-mobile__recording-action-btn"
              disabled={!recording || recording.events.length === 0}
            >
              <Icon.X size="sm" />
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </MinimalModal>
  );
}
