import { Button } from "#/components/ui/button";
import { Icon } from "#/components/ui/icon";
import { useRecordingLogic } from "#/lib/hooks/useRecordingLogic";
import { formatTime } from "#/lib/utils/time-utils";

interface RecordingProps {
  active?: boolean;
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
    <div
      className={`kit-play-desktop__recording-wrapper ${active ? "kit-play-desktop__recording-wrapper--active" : ""}`}
    >
      <div className="kit-play-desktop__recording-header">
        <h3 className="kit-play-desktop__recording-title">Recording Studio</h3>
        <div className="kit-play-desktop__recording-time-display">
          {isRecording ? formatTime(recordingTime) : formatTime(recordingDuration - playbackTime)}
        </div>
      </div>
      <div className="kit-play-desktop__recording-content">
        <div className="kit-play-desktop__recording-controls">
          <div className="kit-play-desktop__recording-main-controls">
            <Button
              variant="kit-play-main"
              onClick={handleRecordClick}
              className="kit-play-desktop__recording-btn"
            >
              {isRecording ? (
                <>
                  <Icon.Stop size="sm" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Icon.Circle size="sm" />
                  Start Recording
                </>
              )}
            </Button>

            <Button
              variant="kit-play-main"
              onClick={handlePlayClick}
              className="kit-play-desktop__recording-btn"
              disabled={!recording || recording.events.length === 0}
            >
              {isPlayingRecording ? (
                <>
                  <Icon.Pause size="sm" />
                  Pause Playback
                </>
              ) : (
                <>
                  <Icon.Play size="sm" />
                  Play Recording
                </>
              )}
            </Button>
          </div>

          <div className="kit-play-desktop__recording-actions">
            <Button
              variant="kit-play-card"
              onClick={handleExportClick}
              className="kit-play-desktop__recording-action-btn"
              disabled={!recording || recording.events.length === 0}
            >
              <Icon.Download size="sm" />
              Export
            </Button>

            <Button
              variant="kit-play-card"
              onClick={handleImportClick}
              className="kit-play-desktop__recording-action-btn"
            >
              <Icon.Upload size="sm" />
              Import
            </Button>

            <Button
              variant="kit-play-card"
              onClick={clearRecording}
              className="kit-play-desktop__recording-action-btn"
              disabled={!recording || recording.events.length === 0}
            >
              <Icon.X size="sm" />
              Clear
            </Button>
          </div>
        </div>

        {recording && (
          <div className="kit-play-desktop__recording-info">
            <div className="kit-play-desktop__recording-stat">
              <span className="kit-play-desktop__recording-stat-label">Duration</span>
              <span className="kit-play-desktop__recording-stat-value">
                {formatTime(recordingDuration)}
              </span>
            </div>
            <div className="kit-play-desktop__recording-stat">
              <span className="kit-play-desktop__recording-stat-label">Events</span>
              <span className="kit-play-desktop__recording-stat-value">
                {recording.events.length}
              </span>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
