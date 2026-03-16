// ──────────────────────────────────────────────────────────────
// Recording Logic Hook
// ──────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";

import { usePlayKit } from "#/lib/stores/playKit";

/**
 * Hook for managing recording state and timing.
 * Provides utilities for recording duration and playback time tracking.
 */
export function useRecordingLogic() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isRecording,
    isPlayingRecording,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    recording,
    clearRecording,
    loadRecordingFromJSON,
  } = usePlayKit();

  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Update recording time when actively recording
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 0.1);
      }, 100) as any;
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Update recording duration from the recording object
  useEffect(() => {
    if (recording) {
      setRecordingDuration(recording.duration / 1000); // Convert ms to seconds
    } else {
      // Reset duration and playback time when recording is cleared
      setRecordingDuration(0);
      setPlaybackTime(0);
    }
  }, [recording]);

  // Update playback time during playback
  useEffect(() => {
    let interval: number;
    if (isPlayingRecording) {
      interval = setInterval(() => {
        setPlaybackTime((prev) => prev + 0.1);
      }, 100) as any;
    } else {
      setPlaybackTime(0);
    }
    return () => clearInterval(interval);
  }, [isPlayingRecording]);

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      clearRecording();
      startRecording();
    }
  };

  const handleClearRecording = () => {
    // Stop playback if currently playing
    if (isPlayingRecording) {
      stopPlayback();
    }
    // Clear the recording
    clearRecording();
  };

  const handlePlayClick = async () => {
    if (isPlayingRecording) {
      stopPlayback();
    } else {
      await playRecording();
    }
  };

  const handleExportClick = () => {
    if (!recording || recording.events.length === 0) return;

    const dataStr = JSON.stringify(recording, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedRecording = JSON.parse(content);

        // Validate the recording structure
        if (importedRecording.events && Array.isArray(importedRecording.events)) {
          // Clear current recording and load the imported one
          clearRecording();
          const loadedRecording = loadRecordingFromJSON(content);
          console.log("Imported recording:", importedRecording);
          console.log("Loaded recording:", loadedRecording);
        } else {
          console.error("Invalid recording file format");
        }
      } catch (error) {
        console.error("Failed to import recording:", error);
      }
    };
    reader.readAsText(file);

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
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
    clearRecording: handleClearRecording,
  };
}
