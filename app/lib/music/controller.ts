import { createResourceUrl } from "@/constants";

import { toast } from "react-toastify";

import { ControllerRecorder, type Recording } from "./controller-recorder";
import {
  type ControllerConfig,
  DEFAULT_CONTROLLER_CONFIG,
  DEFAULT_VISUAL_SETTINGS,
  type PadSettings,
  type VisualSettings,
  getPadForKey,
  loadControllerConfig,
  loadVisualConfig,
  saveControllerConfig,
  saveVisualConfig,
} from "./controllerConfig";

export type { PadSettings, Sample, VisualSettings } from "./controllerConfig";
export type { Recording, RecordedEvent } from "./controller-recorder";

/** Main audio controller for managing pad playback and effects */
class AudioController {
  private ctx: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private rawBuffers: Map<string, ArrayBuffer> = new Map();
  private currentSources: Map<string, AudioBufferSourceNode> = new Map();
  private cycleIndex: Map<number, number> = new Map(); // Track current sample index for cycle mode
  private pads: PadSettings[] = [];
  private heldPads = new Set<number>();
  private config: ControllerConfig = DEFAULT_CONTROLLER_CONFIG;
  private keyboardEnabled = false;
  private onPadPlayCallbacks: ((padIndex: number, isKeyboard?: boolean) => void)[] = [];
  private onPadStopCallbacks: ((padIndex: number) => void)[] = [];
  private onPadDownCallbacks: ((padIndex: number) => void)[] = [];
  private onPadUpCallbacks: ((padIndex: number) => void)[] = [];
  private onPadProgressCallbacks: ((padIndex: number, progress: number) => void)[] = [];
  private visualSettings: VisualSettings = DEFAULT_VISUAL_SETTINGS;
  private analyserMap: Map<string, AnalyserNode> = new Map();
  private audioStartTime: Map<string, number> = new Map();
  private audioDuration: Map<string, number> = new Map();
  private onVisualUpdateCallbacks: ((padIndex: number, value: number) => void)[] = [];
  private configLoaded = false;
  private masterGainNode: GainNode | null = null;
  private recorder = new ControllerRecorder();
  private isMuted = false;
  private preMuteVolume = 0;
  private handleKeyDownBound: ((e: KeyboardEvent) => void) | null = null;
  private handleKeyUpBound: ((e: KeyboardEvent) => void) | null = null;

  /* CALLBACK REGISTRATION */
  onPadPlay(callback: (padIndex: number, isKeyboard?: boolean) => void): void {
    this.onPadPlayCallbacks.push(callback);
  }

  onPadStop(callback: (padIndex: number) => void): void {
    this.onPadStopCallbacks.push(callback);
  }

  onPadDown(callback: (padIndex: number) => void): void {
    this.onPadDownCallbacks.push(callback);
  }

  onPadUp(callback: (padIndex: number) => void): void {
    this.onPadUpCallbacks.push(callback);
  }

  onPadProgress(callback: (padIndex: number, progress: number) => void): void {
    this.onPadProgressCallbacks.push(callback);
  }

  onVisualUpdate(callback: (padIndex: number, value: number) => void): void {
    this.onVisualUpdateCallbacks.push(callback);
  }

  /* INIT */
  private async init(): Promise<AudioContext> {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
      // Create master gain node for volume control
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.connect(this.ctx.destination);
      // Set initial volume from config
      this.updateVolume();
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  /* CONFIG METHODS */
  loadConfig(): void {
    // Only load from localStorage if we're in a browser environment
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        this.config = loadControllerConfig();
        this.visualSettings = loadVisualConfig();
        this.configLoaded = true;
      } catch (error) {
        console.warn("[Config] Failed to load config from localStorage, using defaults:", error);
        this.config = DEFAULT_CONTROLLER_CONFIG;
        this.visualSettings = DEFAULT_VISUAL_SETTINGS;
        this.configLoaded = false;
      }
    } else {
      // Server-side or localStorage not available - use defaults
      this.config = DEFAULT_CONTROLLER_CONFIG;
      this.visualSettings = DEFAULT_VISUAL_SETTINGS;
      this.configLoaded = false;
    }
  }

  saveConfig(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      saveControllerConfig(this.config);
    }
  }

  updateKeyboardMapping(padIndex: number, key: string): void {
    // Remove key from any other pad first
    for (const [idx, padKey] of Object.entries(this.config.keyboard)) {
      if ((padKey as string).toLowerCase() === key.toLowerCase()) {
        delete this.config.keyboard[parseInt(idx, 10)];
      }
    }
    // Set new key
    this.config.keyboard[padIndex] = key;
    this.saveConfig();
  }

  updateMidiMapping(padIndex: number, note: number): void {
    // Remove note from any other pad first
    for (const [idx, padNote] of Object.entries(this.config.midi)) {
      if (padNote === note) {
        delete this.config.midi[parseInt(idx, 10)];
      }
    }
    // Set new note
    this.config.midi[padIndex] = note;
    this.saveConfig();
  }

  getKeyboardMapping(padIndex: number): string {
    return this.config.keyboard[padIndex] || "";
  }

  getMidiMapping(padIndex: number): number | null {
    return this.config.midi[padIndex] ?? null;
  }

  getControllerConfig(): ControllerConfig {
    return this.config;
  }

  /* VISUAL SETTINGS METHODS */
  getVisualSettings(): VisualSettings {
    return this.visualSettings;
  }

  updateVisualSettings(settings: Partial<VisualSettings>): void {
    this.visualSettings = { ...this.visualSettings, ...settings };
    if (typeof window !== "undefined" && window.localStorage) {
      saveVisualConfig(this.visualSettings);
    }
  }

  saveVisualSettings(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      saveVisualConfig(this.visualSettings);
    }
  }

  enableKeyboard(): void {
    if (this.keyboardEnabled) return;

    this.keyboardEnabled = true;

    this.handleKeyDownBound = (e: KeyboardEvent) => {
      // Ignore if in input field, EXCEPT for range inputs (sliders)
      if (e.target instanceof HTMLInputElement && e.target.type !== "range") {
        return;
      }

      // Also ignore if in textarea
      if (e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger pads if modifier keys are pressed (allows browser shortcuts)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const padIndex = getPadForKey(e.key, this.config);
      if (padIndex !== null) {
        e.preventDefault();

        // Dispatch keyboard down event for pressed state
        window.dispatchEvent(
          new CustomEvent("keyboardPadDown", {
            detail: { padIndex },
          }),
        );

        // Notify down callbacks
        this.onPadDownCallbacks.forEach((cb) => cb(padIndex));

        this.handleKeyDown(padIndex);
      }
    };

    this.handleKeyUpBound = (e: KeyboardEvent) => {
      // Ignore if in input field, EXCEPT for range inputs (sliders)
      if (e.target instanceof HTMLInputElement && e.target.type !== "range") {
        return;
      }

      // Also ignore if in textarea
      if (e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger pads if modifier keys are pressed (allows browser shortcuts)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const padIndex = getPadForKey(e.key, this.config);
      if (padIndex !== null) {
        e.preventDefault();

        // Dispatch keyboard up event for pressed state
        window.dispatchEvent(
          new CustomEvent("keyboardPadUp", {
            detail: { padIndex },
          }),
        );

        // Notify up callbacks
        this.onPadUpCallbacks.forEach((cb) => cb(padIndex));

        this.handleKeyUp(padIndex);
      }
    };

    document.addEventListener("keydown", this.handleKeyDownBound);
    document.addEventListener("keyup", this.handleKeyUpBound);
  }

  disableKeyboard(): void {
    this.keyboardEnabled = false;
    // Remove all keyboard listeners
    if (this.handleKeyDownBound) {
      document.removeEventListener("keydown", this.handleKeyDownBound);
      this.handleKeyDownBound = null;
    }
    if (this.handleKeyUpBound) {
      document.removeEventListener("keyup", this.handleKeyUpBound);
      this.handleKeyUpBound = null;
    }
  }

  private handleKeyDown(padIndex: number): void {
    const pad = this.pads[padIndex];
    if (!pad) return;

    // Check if AudioContext is suspended (not yet activated by user interaction)
    if (this.ctx && this.ctx.state === "suspended") {
      toast.error("You have to click on any pad first");
      return;
    }

    // Record the pad down event
    this.recorder.recordPadDown(padIndex);

    // Don't play if already held (for TOGGLE mode)
    if (this.heldPads.has(padIndex)) return;

    this.heldPads.add(padIndex);

    // Don't play TOGGLE on keyDown - only on keyUp (like click)
    if (
      pad.pad_play_mode === "tap" ||
      pad.pad_play_mode === "cycle" ||
      pad.pad_play_mode === "hold"
    ) {
      this.playPad(padIndex, 0, true); // Pass isKeyboard = true
    }
  }

  private handleKeyUp(padIndex: number): void {
    const pad = this.pads[padIndex];
    if (!pad) return;

    // Check if AudioContext is suspended (not yet activated by user interaction)
    if (this.ctx && this.ctx.state === "suspended") {
      return;
    }

    // Record the pad up event
    this.recorder.recordPadUp(padIndex);

    this.heldPads.delete(padIndex);

    // For HOLD mode, stop on release
    if (pad.pad_play_mode === "hold") {
      this.stopPad(padIndex);
    }
    // For TOGGLE mode, toggle on release
    else if (pad.pad_play_mode === "toggle") {
      this.playPad(padIndex, 0, true); // Pass isKeyboard = true
    }
  }

  /* SET PADS */
  setPads(pads: PadSettings[]): void {
    this.pads = pads;
    // Reset cycle index when pads are set
    this.cycleIndex.clear();
  }

  getPad(padIndex: number): PadSettings | null {
    return this.pads[padIndex] || null;
  }

  /* LOAD ALL SAMPLES */
  async loadAllSamples(pads: PadSettings[]): Promise<void> {
    const ctx = await this.init();

    for (const pad of pads) {
      for (const sample of pad.samples) {
        if (this.buffers.has(sample.name)) continue;

        try {
          let arrayBuffer: ArrayBuffer;

          if (sample.source instanceof File) {
            // For preview mode - load File directly
            arrayBuffer = await sample.source.arrayBuffer();
          } else {
            // For normal mode - load from URL
            const url = this.resolveSampleUrl(sample.source);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            arrayBuffer = await response.arrayBuffer();
          }

          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          this.buffers.set(sample.name, audioBuffer);
        } catch (error) {
          console.error(`[Audio] ✗ Failed to load ${sample.name}:`, error);
        }
      }
    }
  }

  /* PRELOAD SINGLE SAMPLE */
  async preloadSample(name: string, source: string | File): Promise<boolean> {
    if (this.buffers.has(name) || this.rawBuffers.has(name)) return true;

    try {
      let url: string;

      if (source instanceof File) {
        // For preview mode - load File directly
        const arrayBuffer = await source.arrayBuffer();
        this.rawBuffers.set(name, arrayBuffer);
        return true;
      } else {
        // For normal mode - load from URL
        url = this.resolveSampleUrl(source);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        this.rawBuffers.set(name, arrayBuffer);
        return true;
      }
    } catch (error) {
      console.error(`[Audio] ✗ Failed to preload ${name}:`, error);
      return false;
    }
  }

  /* LOAD SAMPLE ON DEMAND */
  private async loadSampleOnDemand(name: string, source: string | File): Promise<boolean> {
    if (this.buffers.has(name)) return true;

    try {
      const ctx = await this.init();
      const existingBuffer = this.rawBuffers.get(name);

      if (existingBuffer) {
        const audioBuffer = await ctx.decodeAudioData(existingBuffer);
        this.buffers.set(name, audioBuffer);
        return true;
      }

      if (source instanceof File) {
        // For preview mode - load File directly
        const arrayBuffer = await source.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.buffers.set(name, audioBuffer);
        return true;
      } else {
        // For normal mode - load from URL
        const url = this.resolveSampleUrl(source);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.buffers.set(name, audioBuffer);
        return true;
      }
    } catch (error) {
      console.error(`[Audio] ✗ Failed to load ${name}:`, error);
      return false;
    }
  }

  private resolveSampleUrl(source: string): string {
    return source.startsWith("http") ? source : createResourceUrl("sample", source);
  }

  private async fetchSampleBuffer(source: string): Promise<ArrayBuffer> {
    const url = this.resolveSampleUrl(source);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.arrayBuffer();
  }

  /* PLAY PAD */
  async playPad(
    padIndex: number,
    sampleIndex: number = 0,
    isKeyboard: boolean = false,
  ): Promise<void> {
    const pad = this.pads[padIndex];
    if (!pad) {
      return;
    }

    // Handle CYCLE mode - determine which sample to play
    let actualSampleIndex = sampleIndex;
    if (pad.pad_play_mode === "cycle") {
      // Get current cycle index for this pad, default to 0
      const currentIndex = this.cycleIndex.get(padIndex) || 0;

      // Only cycle if we have multiple samples
      if (pad.samples.length > 1) {
        actualSampleIndex = currentIndex;
        // Update to next index for future plays
        this.cycleIndex.set(padIndex, (currentIndex + 1) % pad.samples.length);
      }
    }

    // Get the sample
    const sample = pad.samples[actualSampleIndex];
    if (!sample || !sample.name) {
      return;
    }

    // Load sample on demand if not loaded
    if (!this.buffers.has(sample.name)) {
      const loaded = await this.loadSampleOnDemand(sample.name, sample.source);
      if (!loaded) {
        return;
      }
    }

    const buffer = this.buffers.get(sample.name);
    if (!buffer) {
      return;
    }

    // For TOGGLE mode, check if already playing
    // Toggle mode toggles playback on each click
    if (pad.pad_play_mode === "toggle") {
      const key = `pad-${padIndex}`;
      const currentSource = this.currentSources.get(key);
      if (currentSource) {
        this.stopPad(padIndex);
        return;
      }
    }

    // ALWAYS stop current sound for this pad FIRST (except TOGGLE which we handled above)
    if (pad.pad_play_mode !== "toggle") {
      this.stopPad(padIndex);
    }

    // Handle choke groups AFTER stopping the pad
    if (pad.pad_choke_group !== null) {
      this.stopChokeGroup(pad.pad_choke_group);
    }

    // Notify callbacks
    this.onPadPlayCallbacks.forEach((cb) => cb(padIndex, isKeyboard));

    const ctx = await this.init();

    // Create and play new source
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Apply pitch shift (semitones) and frequency (speed)
    const pitchMultiplier = Math.pow(2, this.config.pitchValue / 12);
    source.playbackRate.value = this.config.frequencyValue * pitchMultiplier;

    // Handle different modes
    if (pad.pad_play_mode === "hold") {
      // For HOLD mode, we'll handle stopping externally
      source.loop = true;
    } else if (pad.pad_play_mode === "toggle") {
      // For TOGGLE mode, loop until manually stopped
      source.loop = true;
    }

    source.connect(this.masterGainNode || ctx.destination);

    // Create analyser for visual effects if enabled
    let analyser: AnalyserNode | null = null;
    const key = `pad-${padIndex}`;

    if (this.visualSettings.boxShadow.enabled) {
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.9;

      // Connect source to analyser
      source.connect(analyser);
      analyser.connect(this.masterGainNode || ctx.destination);

      // Store analyser for this pad
      this.analyserMap.set(key, analyser);

      // Start visual monitoring
      this.startVisualMonitoring(padIndex, analyser);
    }

    source.start(0);
    this.currentSources.set(key, source);
    if (pad.pad_choke_group !== null) {
      this.currentSources.set(`choke-${pad.pad_choke_group}`, source);
    }

    // Store start time and duration for progress tracking
    const startTime = this.ctx!.currentTime;
    const duration = buffer.duration;
    this.audioStartTime.set(key, startTime);
    this.audioDuration.set(key, duration);

    // Start progress tracking for toggle mode
    if (pad.pad_play_mode === "toggle") {
      this.startProgressTracking(padIndex, key, startTime, duration);
    }

    // Only remove from map if this source is still the current one
    source.onended = () => {
      const currentSource = this.currentSources.get(key);
      if (currentSource === source) {
        this.currentSources.delete(key);
        // Clean up analyser
        if (this.analyserMap.has(key)) {
          this.analyserMap.delete(key);
        }
        if (pad.pad_choke_group !== null) {
          const currentChokeSource = this.currentSources.get(`choke-${pad.pad_choke_group}`);
          if (currentChokeSource === source) {
            this.currentSources.delete(`choke-${pad.pad_choke_group}`);
          }
        }
        // Notify callbacks when sound ends naturally
        this.onPadStopCallbacks.forEach((cb) => cb(padIndex));
      }
    };
  }

  /* STOP PAD */
  stopPad(padIndex: number): void {
    const key = `pad-${padIndex}`;
    const source = this.currentSources.get(key);

    if (source) {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
      this.currentSources.delete(key);
      // Clean up analyser
      if (this.analyserMap.has(key)) {
        this.analyserMap.delete(key);
      }
      // Clean up progress tracking data
      this.audioStartTime.delete(key);
      this.audioDuration.delete(key);

      // Notify callbacks
      this.onPadStopCallbacks.forEach((cb) => cb(padIndex));
    }
  }

  /* STOP CHOKE GROUP */
  stopChokeGroup(chokeGroup: number): void {
    const key = `choke-${chokeGroup}`;
    const source = this.currentSources.get(key);

    if (source) {
      try {
        source.stop();
        source.disconnect();
        // Find which pad this choke group belongs to and notify
        const padIndex = this.pads.findIndex((p) => p.pad_choke_group === chokeGroup);
        if (padIndex !== -1) {
          this.onPadStopCallbacks.forEach((cb) => cb(padIndex));
        }
      } catch {
        // Already stopped or disconnected
      }
      this.currentSources.delete(key);
    }
  }

  /* STOP ALL */
  stopAll(): void {
    // Clear all active pads
    for (let i = 0; i < this.pads.length; i++) {
      if (this.currentSources.has(`pad-${i}`)) {
        this.onPadStopCallbacks.forEach((cb) => cb(i));
      }
    }

    for (const [_key, source] of this.currentSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Already stopped or disconnected
      }
    }
    this.currentSources.clear();
  }

  /* GET PAD HANDLERS */
  getPadHandlers(padIndex: number) {
    const pad = this.pads[padIndex];
    const playMode = pad?.pad_play_mode || "tap";

    const startPlaying = () => {
      this.heldPads.add(padIndex);

      // Record the pad down event
      this.recorder.recordPadDown(padIndex);

      // Notify down callbacks
      this.onPadDownCallbacks.forEach((cb) => cb(padIndex));

      // Don't play TOGGLE on mouseDown - only on click
      if (playMode === "tap" || playMode === "cycle" || playMode === "hold") {
        this.playPad(padIndex);
      }
    };

    const stopPlaying = () => {
      this.heldPads.delete(padIndex);

      // Record the pad up event
      this.recorder.recordPadUp(padIndex);

      // Notify up callbacks
      this.onPadUpCallbacks.forEach((cb) => cb(padIndex));

      // For HOLD mode, stop when released
      if (playMode === "hold") {
        this.stopPad(padIndex);
      }
    };

    return {
      onMouseDown: () => {
        startPlaying();
      },
      onMouseUp: () => {
        stopPlaying();
      },
      onMouseLeave: () => {
        stopPlaying();
      },
      onTouchStart: (e: React.TouchEvent) => {
        // Don't prevent default for toggle mode to allow click event
        if (playMode !== "toggle") {
          e.preventDefault();
        }
        startPlaying();
      },
      onTouchEnd: (e: React.TouchEvent) => {
        // Don't prevent default for toggle mode to allow click event
        if (playMode !== "toggle") {
          e.preventDefault();
          stopPlaying();
        }
      },
      onClick: () => {
        // TOGGLE mode only responds to click
        if (playMode === "toggle") {
          this.playPad(padIndex);
        }
      },
    };
  }

  /* VISUAL MONITORING */
  private startProgressTracking(
    padIndex: number,
    key: string,
    startTime: number,
    duration: number,
  ): void {
    const checkProgress = () => {
      // Stop tracking if pad is no longer playing
      if (!this.currentSources.has(key)) {
        return;
      }

      const currentTime = this.ctx!.currentTime;
      const elapsed = currentTime - startTime;
      let progress = (elapsed / duration) * 100;

      // Handle looping
      if (progress >= 100) {
        progress = progress % 100;
        // Update start time for loop
        this.audioStartTime.set(key, currentTime - (progress * duration) / 100);
      }

      // Notify progress callbacks
      this.onPadProgressCallbacks.forEach((cb) => cb(padIndex, progress));

      // Continue tracking
      requestAnimationFrame(checkProgress);
    };

    // Start tracking
    requestAnimationFrame(checkProgress);
  }

  private startVisualMonitoring(padIndex: number, analyser: AnalyserNode): void {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudio = () => {
      const key = `pad-${padIndex}`;

      // Stop monitoring if pad is no longer playing
      if (!this.currentSources.has(key) || !this.analyserMap.has(key)) {
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      // Calculate peak frequency instead of average for faster response
      let peak = 0;
      for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > peak) peak = dataArray[i];
      }
      const normalized = peak / 255;

      // Apply sensitivity with more aggressive curve for faster response
      const adjustedValue = Math.pow(
        normalized,
        0.5, // Fixed lower exponent for faster response
      );

      // Calculate shadow size
      const minSize = this.visualSettings.boxShadow.minValue;
      const maxSize = this.visualSettings.boxShadow.maxValue;
      const shadowSize = minSize + (maxSize - minSize) * adjustedValue;

      // Notify callbacks
      this.onVisualUpdateCallbacks.forEach((cb) => cb(padIndex, shadowSize));

      // Continue monitoring
      requestAnimationFrame(checkAudio);
    };

    // Start monitoring
    requestAnimationFrame(checkAudio);
  }

  /* VOLUME METHODS */
  getVolume(): number {
    return this.config.volume;
  }

  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(100, volume));
    this.updateVolume();
    this.saveConfig();
  }

  private updateVolume(): void {
    if (this.masterGainNode && !this.isMuted) {
      // Convert 0-100 to 0-0.7 gain value with logarithmic scale (70% max for pads)
      const gain = this.config.volume === 0 ? 0 : Math.pow((this.config.volume / 100) * 0.7, 2);
      this.masterGainNode.gain.value = gain;
    }
  }

  /* MUTE METHODS */

  /** Mute audio (store current volume for restore) */
  mute(): void {
    if (this.masterGainNode && !this.isMuted) {
      this.preMuteVolume = this.masterGainNode.gain.value;
      this.masterGainNode.gain.value = 0;
      this.isMuted = true;
    }
  }

  /** Unmute audio (restore previous volume) */
  unmute(): void {
    if (this.masterGainNode && this.isMuted) {
      this.masterGainNode.gain.value = this.preMuteVolume;
      this.isMuted = false;
    }
  }

  /** Check if audio is muted */
  getIsMuted(): boolean {
    return this.isMuted;
  }

  /* PITCH METHODS */
  getPitchValue(): number {
    return this.config.pitchValue;
  }

  setPitchValue(pitch: number): void {
    this.config.pitchValue = Math.max(-12, Math.min(12, pitch));
    this.updateAllPlaybackRates();
    this.saveConfig();
  }

  /* FREQUENCY METHODS */
  getFrequencyValue(): number {
    return this.config.frequencyValue;
  }

  setFrequencyValue(frequency: number): void {
    this.config.frequencyValue = Math.max(0.5, Math.min(2, frequency));
    this.updateAllPlaybackRates();
    this.saveConfig();
  }

  private updateAllPlaybackRates(): void {
    // Calculate new playback rate
    const pitchMultiplier = Math.pow(2, this.config.pitchValue / 12);
    const newPlaybackRate = this.config.frequencyValue * pitchMultiplier;

    // Update all currently playing sources
    this.currentSources.forEach((source) => {
      // Sources in currentSources map are guaranteed to be playing
      source.playbackRate.value = newPlaybackRate;
    });
  }

  /* RECORDER METHODS */

  /** Start recording pad interactions */
  startRecording(): void {
    this.recorder.startRecording();
  }

  /** Stop recording and return the recording */
  stopRecording(): Recording {
    return this.recorder.stopRecording();
  }

  /** Get the current recording */
  getRecording(): Recording {
    return this.recorder.getRecording();
  }

  /** Check if currently recording */
  getIsRecording(): boolean {
    return this.recorder.getIsRecording();
  }

  /** Check if currently playing a recording */
  getIsPlayingRecording(): boolean {
    return this.recorder.getIsPlaying();
  }

  /** Play a recording */
  async playRecording(recording?: Recording, onPlaybackEnd?: () => void): Promise<void> {
    const recordingToPlay = recording || this.recorder.getRecording();

    await this.recorder.playRecording(
      recordingToPlay,
      (padIndex) => {
        // Trigger pad down
        this.handleKeyDown(padIndex);
        // Visual feedback
        this.onPadDownCallbacks.forEach((cb) => cb(padIndex));
      },
      (padIndex) => {
        // Trigger pad up
        this.handleKeyUp(padIndex);
        // Visual feedback
        this.onPadUpCallbacks.forEach((cb) => cb(padIndex));
      },
      onPlaybackEnd,
    );
  }

  /** Stop current playback */
  stopPlayback(): void {
    this.recorder.stopPlayback();
  }

  /** Load recording from JSON */
  loadRecordingFromJSON(json: string): Recording {
    return this.recorder.loadFromJSON(json);
  }

  /** Save recording as JSON */
  saveRecordingAsJSON(): string {
    return this.recorder.saveToJSON();
  }

  /** Clear current recording */
  clearRecording(): void {
    this.recorder.clearRecording();
  }

  /* DISPOSE */
  dispose(): void {
    this.disableKeyboard();
    this.heldPads.clear();
    this.stopAll();
    this.buffers.clear();
    this.rawBuffers.clear();
    this.pads = [];
    this.analyserMap.clear();
    this.audioStartTime.clear();
    this.audioDuration.clear();
    this.masterGainNode = null;
  }

  /* GET CONTEXT */
  getContext(): Promise<AudioContext> {
    return this.init();
  }

  /* CHECK IF CONTEXT IS SUSPENDED */
  isContextSuspended(): boolean {
    return this.ctx?.state === "suspended";
  }

  /* CLOSE AUDIO CONTEXT */
  closeAudioContext(): void {
    if (this.ctx && this.ctx.state !== "closed") {
      this.stopAll();
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// ================================================================
// --------------------- SINGLETON EXPORT -------------------------
// ================================================================

export const audioController = new AudioController();
