type TestSample = { file: File };

type PlayingSample = {
  source: AudioBufferSourceNode;
  fileName: string;
};

/** Test music controller for audio playback testing */
export class TestMusicController {
  private audioContext: AudioContext | null = null;
  private samples: Map<string, AudioBuffer> = new Map();
  private playingSamples: Map<string, PlayingSample> = new Map();
  private nextId: number = 0;
  private onPlaybackEndCallbacks: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.audioContext = new AudioContext();
    }
  }

  public get audioContextState(): string {
    return this.audioContext?.state || "unavailable";
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  public onPlaybackEnd(callback: () => void): () => void {
    this.onPlaybackEndCallbacks.add(callback);
    return () => this.onPlaybackEndCallbacks.delete(callback);
  }

  public clearSamples() {
    this.samples.clear();
    console.log("All samples cleared.");
  }

  public async addSample(sample: TestSample) {
    if (!this.audioContext) {
      console.warn("AudioContext not available");
      return null;
    }

    if (this.audioContext.state === "closed") {
      console.warn("AudioContext is closed, creating new one");
      this.audioContext = new AudioContext();
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    try {
      const arrayBuffer = await sample.file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.samples.set(sample.file.name, audioBuffer);

      console.log(
        `Sample "${sample.file.name}" added. Duration: ${audioBuffer.duration.toFixed(2)}s`,
      );

      return audioBuffer;
    } catch (error) {
      console.error("Error during sample addition:", error);
      throw error;
    }
  }

  public async addSampleFromUrl(url: string, name: string) {
    if (!this.audioContext) {
      console.warn("AudioContext not available");
      return null;
    }

    if (this.audioContext.state === "closed") {
      this.audioContext = new AudioContext();
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.samples.set(name, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Error loading sample from URL "${url}":`, error);
      throw error;
    }
  }

  public playSample(fileName: string): string | null {
    if (!this.audioContext) {
      console.warn("AudioContext not available");
      return null;
    }

    if (this.audioContext.state === "closed") {
      console.warn("AudioContext is closed, cannot play sample");
      return null;
    }

    // Resume AudioContext if suspended (synchronous call, but we need to handle it properly)
    const playInternal = () => {
      this.stopAll();
      const buffer = this.samples.get(fileName);

      if (!buffer) {
        console.warn(`Sample "${fileName}" not found`);
        return null;
      }

      const id = `sample-${this.nextId++}`;

      const source = this.audioContext!.createBufferSource();
      source.buffer = buffer;

      source.connect(this.audioContext!.destination);

      this.playingSamples.set(id, { source, fileName });

      source.onended = () => {
        this.playingSamples.delete(id);
        this.onPlaybackEndCallbacks.forEach((callback) => callback());
      };

      source.start();
      console.log(`Playing sample: ${fileName}`);
      return id;
    };

    if (this.audioContext.state === "suspended") {
      // Resume and then play
      this.audioContext
        .resume()
        .then(() => {
          console.log("AudioContext resumed");
          playInternal();
        })
        .catch((err) => {
          console.error("Failed to resume AudioContext:", err);
        });
      return null;
    }

    return playInternal();
  }

  public stopSample(id: string): boolean {
    const playingSample = this.playingSamples.get(id);

    if (!playingSample) {
      return false;
    }

    try {
      playingSample.source.stop();
      playingSample.source.disconnect();
    } catch (error) {}

    this.playingSamples.delete(id);
    console.log(`Stopped sample (ID: ${id})`);

    this.onPlaybackEndCallbacks.forEach((callback) => callback());

    return true;
  }

  public isSamplePlaying(id: string): boolean {
    return this.playingSamples.has(id);
  }

  public isFileNamePlaying(fileName: string): boolean {
    for (const playingSample of this.playingSamples.values()) {
      if (playingSample.fileName === fileName) {
        return true;
      }
    }
    return false;
  }

  public stopByFileName(fileName: string): number {
    let stoppedCount = 0;
    const idsToStop: string[] = [];

    for (const [id, playingSample] of this.playingSamples.entries()) {
      if (playingSample.fileName === fileName) {
        idsToStop.push(id);
      }
    }

    idsToStop.forEach((id) => {
      if (this.stopSample(id)) {
        stoppedCount++;
      }
    });

    return stoppedCount;
  }

  public stopAll() {
    const ids = Array.from(this.playingSamples.keys());

    ids.forEach((id) => {
      const playingSample = this.playingSamples.get(id);
      if (playingSample) {
        try {
          playingSample.source.stop();
          playingSample.source.disconnect();
        } catch (error) {}
      }
    });

    this.playingSamples.clear();
    console.log(`Stopped all samples (${ids.length})`);
  }

  public getSampleBuffer(fileName: string): AudioBuffer | null {
    return this.samples.get(fileName) || null;
  }

  public getSampleNames(): string[] {
    return Array.from(this.samples.keys());
  }

  public isPlaying(): boolean {
    return this.playingSamples.size > 0;
  }

  public getPlayingSampleIds(): string[] {
    return Array.from(this.playingSamples.keys());
  }

  public getPlayingSampleCount(): number {
    return this.playingSamples.size;
  }

  public dispose() {
    this.stopAll();
    this.samples.clear();
    this.onPlaybackEndCallbacks.clear();
    console.log("Music controller disposed (samples cleared)");
  }
}

export class KitMusicManager {
  public controller: TestMusicController;
  private playingSampleId: string | null = null;
  private loopingSamples: Set<string> = new Set();
  private onStateChangeCallbacks: Set<() => void> = new Set();
  private sampleKeyToFileName: Map<string, string> = new Map();

  constructor() {
    this.controller = new TestMusicController();

    // Listen for playback end to handle looping
    this.controller.onPlaybackEnd(() => {
      this.handlePlaybackEnd();
    });
  }

  public onStateChange(callback: () => void): () => void {
    this.onStateChangeCallbacks.add(callback);
    return () => this.onStateChangeCallbacks.delete(callback);
  }

  private notifyStateChange() {
    this.onStateChangeCallbacks.forEach((callback) => callback());
  }

  private handlePlaybackEnd() {
    const currentKey = this.playingSampleId;
    if (!currentKey) return;

    // If loop is enabled, play again
    if (this.loopingSamples.has(currentKey)) {
      const fileName = this.sampleKeyToFileName.get(currentKey);
      if (fileName) {
        setTimeout(() => {
          if (this.loopingSamples.has(currentKey)) {
            this.playSampleByName(fileName, currentKey, true);
          }
        }, 50); // Small delay to prevent audio glitches
      }
    } else {
      // Only clear playing state if not looping
      this.playingSampleId = null;
      this.notifyStateChange();
    }
  }

  public async addSample(file: File) {
    try {
      await this.controller.addSample({ file });
    } catch (error) {
      console.error("Error loading sample:", error);
      throw error;
    }
  }

  public async addSampleFromUrl(url: string, name: string) {
    try {
      await this.controller.addSampleFromUrl(url, name);
    } catch (error) {
      console.error("Error loading sample from URL:", error);
      throw error;
    }
  }

  public async playSample(padIndex: number, sampleIndex: number, forcePlay: boolean = false) {
    const sampleKey = `${padIndex}-${sampleIndex}`;

    // If clicking the currently playing sample, stop it (unless forcePlay)
    if (!forcePlay && this.playingSampleId === sampleKey) {
      this.stopAll();
      return;
    }

    // Stop any other playing sample
    this.controller.stopAll();
    this.playingSampleId = null;

    // We need the file name to play, but we don't have access to the store here
    // This is a limitation - we'll need to pass the file name from outside
    return null;
  }

  public async playSampleByName(fileName: string, sampleKey: string, forcePlay: boolean = false) {
    // If clicking the currently playing sample, stop it (unless forcePlay)
    if (!forcePlay && this.playingSampleId === sampleKey) {
      this.stopAll();
      return;
    }

    // Stop any other playing sample
    this.controller.stopAll();
    this.playingSampleId = null;

    // Store the mapping for looping
    this.sampleKeyToFileName.set(sampleKey, fileName);

    // Ensure AudioContext is running before playing
    const audioContext = this.controller.getAudioContext();
    if (audioContext && audioContext.state === "suspended") {
      try {
        await audioContext.resume();
        console.log("AudioContext resumed in playSampleByName");
      } catch (error) {
        console.error("Failed to resume AudioContext:", error);
        throw error;
      }
    }

    try {
      const id = this.controller.playSample(fileName);
      if (id) {
        this.playingSampleId = sampleKey;
        this.notifyStateChange();
        return id;
      }
    } catch (error) {
      console.error("Error playing sample:", error);
      // Try loading if not in memory
      throw error;
    }
    return null;
  }

  public toggleLoop(sampleKey: string, enabled: boolean) {
    if (enabled) {
      this.loopingSamples.add(sampleKey);
    } else {
      this.loopingSamples.delete(sampleKey);
      // If currently playing and loop disabled, stop it
      if (this.playingSampleId === sampleKey) {
        this.controller.stopAll();
        this.playingSampleId = null;
        this.notifyStateChange();
      }
    }
    this.notifyStateChange();
  }

  public stopAll() {
    this.controller.stopAll();
    this.playingSampleId = null;
    this.notifyStateChange();
  }

  public deleteSample(sampleKey: string) {
    // Stop if playing
    if (this.playingSampleId === sampleKey) {
      this.stopAll();
    }
    // Remove from looping
    this.loopingSamples.delete(sampleKey);
    // Remove from file name mapping
    this.sampleKeyToFileName.delete(sampleKey);
    this.notifyStateChange();
  }

  public getPlayingSampleId(): string | null {
    return this.playingSampleId;
  }

  public isLooping(sampleKey: string): boolean {
    return this.loopingSamples.has(sampleKey);
  }

  public getSampleBuffer(fileName: string): AudioBuffer | null {
    return this.controller.getSampleBuffer(fileName);
  }

  public dispose() {
    this.controller.dispose();
    this.sampleKeyToFileName.clear();
  }
}
