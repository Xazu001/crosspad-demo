// ──────────────────────────────────────────────────────────────
// Metronome Hook
// ──────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";

/**
 * Hook for managing metronome functionality.
 * Uses a separate AudioContext to avoid interference with main audio.
 *
 * @param initialVolume - Initial volume level (0-100, default: 50)
 * @returns Metronome controls and state
 */
export function useMetronome(initialVolume: number = 50) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [volume, setVolume] = useState(initialVolume);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<any>(null);
  const audioLoadedRef = useRef(false);
  const beatCountRef = useRef(0); // Track which beat we're on

  // Initialize audio - completely independent
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Create completely separate AudioContext for metronome
        const metronomeContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Load metronome samples
        const loadSample = async (url: string): Promise<AudioBuffer> => {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to load ${url}`);
          const arrayBuffer = await response.arrayBuffer();
          return metronomeContext.decodeAudioData(arrayBuffer);
        };

        const [upBuffer, downBuffer] = await Promise.all([
          loadSample("/assets/samples/metronome-up.wav"),
          loadSample("/assets/samples/metronome-down.wav"),
        ]);

        // Create gain node for volume control
        const gainNode = metronomeContext.createGain();
        gainNode.connect(metronomeContext.destination);

        // Store the audio context and buffers for playback
        audioRef.current = {
          audioContext: metronomeContext,
          upBuffer,
          downBuffer,
          gainNode,
          play: async (isUp: boolean) => {
            try {
              const source = metronomeContext.createBufferSource();
              source.buffer = isUp ? upBuffer : downBuffer;
              source.connect(gainNode);
              source.start();
            } catch (error) {
              console.error("Error playing metronome sound:", error);
            }
          },
        };

        audioLoadedRef.current = true;
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        audioLoadedRef.current = false;
      }
    };

    initAudio();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Close the separate metronome context
      if (audioRef.current && "audioContext" in audioRef.current) {
        (audioRef.current as any).audioContext?.close();
      }
      audioRef.current = null;
    };
  }, []);

  // Update volume independently
  useEffect(() => {
    if (audioRef.current && "gainNode" in audioRef.current) {
      // Metronome uses full volume range (0-100%)
      const gain = volume === 0 ? 0 : Math.pow(volume / 100, 2);
      (audioRef.current as any).gainNode.gain.value = gain;
    }
  }, [volume]);

  // Handle BPM changes - restart metronome with new tempo
  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm]);

  /** Play a single metronome tick */
  const playTick = () => {
    if (audioRef.current && audioLoadedRef.current) {
      // Play up on beat 1, down on beats 2, 3, 4
      const isUp = beatCountRef.current % 4 === 0;
      audioRef.current.play(isUp).catch(console.error);
      beatCountRef.current++;
    }
  };

  /** Start the metronome */
  const startMetronome = () => {
    if (intervalRef.current) return;

    setIsPlaying(true);
    beatCountRef.current = 0; // Reset to start with up beat
    playTick(); // Play immediately

    const interval = 60000 / bpm; // Convert BPM to milliseconds
    intervalRef.current = setInterval(playTick, interval) as any;
  };

  /** Stop the metronome */
  const stopMetronome = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  };

  /** Toggle metronome on/off */
  const toggleMetronome = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  /** Increase BPM by 1, max 360 */
  const increaseBpm = () => {
    setBpm((prev) => Math.min(360, prev + 1));
  };

  /** Decrease BPM by 1, min 40 */
  const decreaseBpm = () => {
    setBpm((prev) => Math.max(40, prev - 1));
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isPlaying,
    bpm,
    volume,
    setVolume,
    toggleMetronome,
    increaseBpm,
    decreaseBpm,
    setBpm,
  };
}
