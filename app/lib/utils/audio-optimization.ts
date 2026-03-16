// Target 75% of original sample rate for optimization
const TARGET_SAMPLE_RATE_MULTIPLIER = 0.75;
// Minimum sample rate to maintain audio quality
const MIN_SAMPLE_RATE = 8000;
const WAV_MIME_TYPES = new Set(["audio/wav", "audio/x-wav"]);
const MP3_MIME_TYPES = new Set(["audio/mpeg", "audio/mp3"]);

/**
 * Check if a file is a WAV audio file.
 * Checks both MIME type and file extension.
 */
const isWavFile = (file: File) => {
  const fileType = file.type.toLowerCase();
  return WAV_MIME_TYPES.has(fileType) || file.name.toLowerCase().endsWith(".wav");
};

/**
 * Check if a file is an MP3 audio file.
 * Checks both MIME type and file extension.
 */
const isMp3File = (file: File) => {
  const fileType = file.type.toLowerCase();
  return MP3_MIME_TYPES.has(fileType) || file.name.toLowerCase().endsWith(".mp3");
};

/**
 * Convert file name to WAV extension if needed.
 * WAV files keep their original name, MP3 files get .wav extension.
 */
const getOptimizedFileName = (fileName: string) => {
  if (fileName.toLowerCase().endsWith(".wav")) {
    return fileName;
  }

  return fileName.replace(/\.mp3$/i, ".wav");
};

/**
 * Calculate target sample rate for optimization.
 * Reduces sample rate to 75% of original, but never below 8kHz.
 */
const getTargetSampleRate = (sourceSampleRate: number) => {
  const normalizedMultiplier = Math.min(1, Math.max(0, TARGET_SAMPLE_RATE_MULTIPLIER));
  const scaledRate = Math.round(sourceSampleRate * normalizedMultiplier);

  return Math.max(MIN_SAMPLE_RATE, scaledRate);
};

/**
 * Encode PCM audio data to WAV format.
 * Creates a proper WAV header with 16-bit PCM samples.
 */
const encodeWav = (samples: Float32Array, sampleRate: number) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // Helper to write strings to the buffer
  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  // Write WAV header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return buffer;
};

/**
 * Optimize a single audio file for web playback.
 * Converts to mono, reduces sample rate, and ensures WAV format.
 * Returns original file if optimization would increase size.
 */
const optimizeAudioFile = async (file: File) => {
  if (!isWavFile(file) && !isMp3File(file)) {
    return file;
  }

  const audioContext = new AudioContext();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

    // Convert to mono by averaging all channels
    const monoData = new Float32Array(decodedBuffer.length);
    for (let channel = 0; channel < decodedBuffer.numberOfChannels; channel += 1) {
      const channelData = decodedBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i += 1) {
        monoData[i] += channelData[i] / decodedBuffer.numberOfChannels;
      }
    }

    // Create mono buffer
    const monoBuffer = new AudioBuffer({
      length: decodedBuffer.length,
      numberOfChannels: 1,
      sampleRate: decodedBuffer.sampleRate,
    });
    monoBuffer.copyToChannel(monoData, 0);

    // Resample to lower rate for optimization
    const targetSampleRate = getTargetSampleRate(decodedBuffer.sampleRate);
    const offlineContext = new OfflineAudioContext(
      1,
      Math.ceil(decodedBuffer.duration * targetSampleRate),
      targetSampleRate,
    );
    const source = offlineContext.createBufferSource();
    source.buffer = monoBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    const renderedBuffer = await offlineContext.startRendering();
    const wavBuffer = encodeWav(renderedBuffer.getChannelData(0), targetSampleRate);

    // Keep original if optimization didn't reduce size
    if (wavBuffer.byteLength >= file.size) {
      return file;
    }

    return new File([wavBuffer], getOptimizedFileName(file.name), {
      type: "audio/wav",
    });
  } catch (error) {
    console.warn("Failed to optimize audio file", error);
    return file;
  } finally {
    await audioContext.close();
  }
};

/**
 * Optimize all audio files in a kit.
 * Processes each sample in every pad, preserving non-file samples.
 *
 * @template TKit - Kit type with pads containing samples
 * @param kitData - The kit data to optimize
 * @returns Promise resolving to optimized kit data
 */
const optimizeKitFiles = async <
  TKit extends {
    pads: { samples: (string | File)[] }[];
  },
>(
  kitData: TKit,
): Promise<TKit> => {
  // Optimize all audio files in pads
  const pads = await Promise.all(
    kitData.pads.map(async (pad) => {
      const samples = await Promise.all(
        pad.samples.map(async (sample) => {
          if (sample instanceof File) {
            return optimizeAudioFile(sample);
          }
          return sample;
        }),
      );

      return {
        ...pad,
        samples,
      };
    }),
  );

  return {
    ...kitData,
    pads,
  };
};

export { optimizeAudioFile, optimizeKitFiles };
