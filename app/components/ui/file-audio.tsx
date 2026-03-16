import "./file-audio.style.scss";

import * as React from "react";

import { Icon } from "#/components/ui/icon";
import { cn } from "#/components/utils";
import { type VariantProps, createVariants } from "#/components/utils/variants";

// ──────────────────────────────────────────────────────────────
// File Audio Component
// ──────────────────────────────────────────────────────────────

/** File audio variants for different sizes */
const fileAudioVariants = createVariants("file-audio", {
  variants: {
    size: {
      md: "file-audio--md", // Medium size
    },
  },
  defaultVariants: {
    size: "md",
  },
});

/** Audio file player component with controls */
export interface FileAudioProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof fileAudioVariants> {
  /** Audio file to play */
  file?: File;
  /** Display name override (used for server-side samples) */
  name?: string;
  /** Callback when play is triggered */
  onPlay?: () => void;
  /** Callback when stop is triggered */
  onStop?: () => void;
  /** Callback when delete is triggered */
  onDelete?: () => void;
  /** Callback when loop toggle is triggered */
  onLoopToggle?: (loop: boolean) => void;
  /** Whether the audio is currently playing */
  isPlaying?: boolean;
  /** Whether the audio is looping */
  isLooping?: boolean;
  /** Disable all controls */
  disabled?: boolean;
}

const FileAudio = React.forwardRef<HTMLDivElement, FileAudioProps>(
  (
    {
      className,
      size,
      file,
      name,
      onPlay,
      onStop,
      onDelete,
      onLoopToggle,
      isPlaying = false,
      isLooping = false,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const handlePlay = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && onPlay) {
          onPlay();
        }
      },
      [disabled, onPlay],
    );

    const handleLoop = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && onLoopToggle) {
          onLoopToggle(!isLooping);
        }
      },
      [disabled, isLooping, onLoopToggle],
    );

    const handleStop = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
          if (isLooping && onLoopToggle) {
            onLoopToggle(false);
          }
          if (onStop) {
            onStop();
          }
        }
      },
      [disabled, isLooping, onLoopToggle, onStop],
    );

    const handleDelete = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && onDelete) {
          onDelete();
        }
      },
      [disabled, onDelete],
    );

    return (
      <div
        ref={ref}
        className={cn(fileAudioVariants({ size, className }))}
        data-disabled={disabled}
        data-playing={isPlaying}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePlay(e as any);
          }
        }}
        {...props}
      >
        <div className="file-audio__content">
          <span className="file-audio__name" title={name || file?.name}>
            {name || file?.name || "No file selected"}
          </span>
          <div className="file-audio__controls">
            <button
              type="button"
              className="file-audio__cta file-audio__cta--delete"
              onClick={handleDelete}
              disabled={disabled}
              aria-label="Delete sample"
            >
              <Icon.X size="md" />
            </button>
            <button
              type="button"
              className={`file-audio__cta ${isLooping ? "file-audio__cta--active" : ""}`}
              onClick={handleLoop}
              disabled={disabled}
              aria-label={isLooping ? "Disable loop" : "Enable loop"}
            >
              <Icon.Repeat size="md" />
            </button>
            {isLooping ? (
              <button
                type="button"
                className="file-audio__cta"
                onClick={handleStop}
                disabled={disabled}
                aria-label="Stop"
              >
                <Icon.Stop size="md" />
              </button>
            ) : (
              <button
                type="button"
                className={`file-audio__cta ${isPlaying ? "file-audio__cta--active" : ""}`}
                onClick={handlePlay}
                disabled={disabled}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Icon.Pause size="md" className="file-audio__icon file-audio__icon--pause" />
                ) : (
                  <Icon.Play size="md" className="file-audio__icon file-audio__icon--play" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
);

FileAudio.displayName = "FileAudio";

export { FileAudio, fileAudioVariants };
