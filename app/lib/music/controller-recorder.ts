export interface RecordedEvent {
  type: "padDown" | "padUp";
  padIndex: number;
  timestamp: number; // Relative to recording start (in ms)
  duration?: number; // For padUp events - how long pad was held
}

export interface Recording {
  events: RecordedEvent[];
  duration: number; // Total recording duration in ms
  recordedAt: number; // Unix timestamp when recording was created
}

/** Records and plays back pad interactions */
export class ControllerRecorder {
  private isRecording = false;
  private isPlaying = false;
  private recordingStartTime = 0;
  private recording: Recording = {
    events: [],
    duration: 0,
    recordedAt: 0,
  };
  private playbackTimeouts: number[] = [];
  private padDownTimes = new Map<number, number>();

  /**
   * Start recording pad interactions
   */
  startRecording(): void {
    if (this.isRecording || this.isPlaying) return;

    this.isRecording = true;
    this.recordingStartTime = performance.now();
    this.recording = {
      events: [],
      duration: 0,
      recordedAt: Date.now(),
    };
    this.padDownTimes.clear();

    console.log("[Recorder] Recording started");
  }

  /**
   * Stop recording and save the recording
   */
  stopRecording(): Recording {
    if (!this.isRecording) return this.recording;

    this.isRecording = false;
    const endTime = performance.now();
    this.recording.duration = endTime - this.recordingStartTime;

    // Calculate durations for all padDown events that don't have corresponding padUp
    const eventsWithDuration = this.recording.events.map((event) => {
      if (event.type === "padUp" && event.duration === undefined) {
        const downTime = this.padDownTimes.get(event.padIndex);
        if (downTime !== undefined) {
          event.duration = event.timestamp - downTime;
        }
      }
      return event;
    });

    this.recording.events = eventsWithDuration;
    this.padDownTimes.clear();

    console.log("[Recorder] Recording stopped:", this.recording);
    return this.recording;
  }

  /**
   * Record a pad down event
   */
  recordPadDown(padIndex: number): void {
    if (!this.isRecording) return;

    const timestamp = performance.now() - this.recordingStartTime;
    this.padDownTimes.set(padIndex, timestamp);

    this.recording.events.push({
      type: "padDown",
      padIndex,
      timestamp,
    });

    // Log current recording state
    console.log(
      "[Recorder] Pad Down - Current recording:",
      JSON.stringify(this.recording, null, 2),
    );
  }

  /**
   * Record a pad up event
   */
  recordPadUp(padIndex: number): void {
    if (!this.isRecording) return;

    const timestamp = performance.now() - this.recordingStartTime;
    const downTime = this.padDownTimes.get(padIndex);

    this.recording.events.push({
      type: "padUp",
      padIndex,
      timestamp,
      duration: downTime !== undefined ? timestamp - downTime : undefined,
    });

    this.padDownTimes.delete(padIndex);

    // Log current recording state
    console.log("[Recorder] Pad Up - Current recording:", JSON.stringify(this.recording, null, 2));
  }

  /**
   * Get the current recording
   */
  getRecording(): Recording {
    return { ...this.recording };
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Play back a recording
   * @param recording The recording to play
   * @param onPadDown Callback when a pad should be pressed down
   * @param onPadUp Callback when a pad should be released
   * @param onPlaybackEnd Callback when playback finishes
   */
  async playRecording(
    recording: Recording,
    onPadDown: (padIndex: number) => void,
    onPadUp: (padIndex: number) => void,
    onPlaybackEnd?: () => void,
  ): Promise<void> {
    if (this.isPlaying || this.isRecording) return;

    this.isPlaying = true;
    console.log("[Recorder] Playing recording:", recording);

    // Sort events by timestamp
    const sortedEvents = [...recording.events].sort((a, b) => a.timestamp - b.timestamp);

    // Schedule each event
    for (const event of sortedEvents) {
      const timeout = setTimeout(() => {
        if (event.type === "padDown") {
          onPadDown(event.padIndex);
        } else if (event.type === "padUp") {
          onPadUp(event.padIndex);
        }
      }, event.timestamp);

      this.playbackTimeouts.push(timeout as any);
    }

    // Stop playing after the recording ends
    const endTimeout = setTimeout(() => {
      this.stopPlayback();
      if (onPlaybackEnd) {
        onPlaybackEnd();
      }
    }, recording.duration);

    this.playbackTimeouts.push(endTimeout as any);
  }

  /**
   * Stop current playback
   */
  stopPlayback(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    // Clear all scheduled timeouts
    this.playbackTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.playbackTimeouts = [];

    console.log("[Recorder] Playback stopped");
  }

  /**
   * Load a recording from JSON string
   */
  loadFromJSON(json: string): Recording {
    try {
      const recording = JSON.parse(json) as Recording;
      this.recording = recording;
      return recording;
    } catch (error) {
      console.error("[Recorder] Failed to load recording from JSON:", error);
      return this.recording;
    }
  }

  /**
   * Save current recording as JSON string
   */
  saveToJSON(): string {
    return JSON.stringify(this.recording, null, 2);
  }

  /**
   * Clear the current recording
   */
  clearRecording(): void {
    this.recording = {
      events: [],
      duration: 0,
      recordedAt: 0,
    };
  }
}
