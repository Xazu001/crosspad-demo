import { DEFAULT_KIT_COLORS } from "@/constants";
import { PadPlayMode } from "@/enums";
import type { CreateKitData } from "@/types/kit";

// Helper function to load WAV files as File objects or string paths from public/assets/samples
const loadWavFile = async (
  filename: string,
  baseUrl?: string,
  asFile: boolean = true,
): Promise<File | string> => {
  // If we don't need File objects, just return the path
  if (!asFile) {
    return baseUrl ? `${baseUrl}/assets/samples/${filename}` : `/assets/samples/${filename}`;
  }

  // In Cloudflare Workers/Pages environment, we can't fetch local files
  // Return a placeholder File object instead
  if (typeof globalThis !== "undefined" && "process" in globalThis && !baseUrl) {
    // Server-side environment (Node.js) without baseUrl - return empty file
    return new File([], filename, { type: "audio/wav" });
  }

  const url = baseUrl ? `${baseUrl}/assets/samples/${filename}` : `/assets/samples/${filename}`;

  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return new File([arrayBuffer], filename, { type: "audio/wav" });
  } catch (error) {
    // If fetch fails (e.g., in server environment), return empty file
    console.warn(`Failed to load ${filename}:`, error);
    return new File([], filename, { type: "audio/wav" });
  }
};

// Load all sample files
const loadSamples = async (baseUrl?: string, asFile: boolean = true) => {
  const samples = await Promise.all([
    loadWavFile("1.wav", baseUrl, asFile),
    loadWavFile("2.wav", baseUrl, asFile),
    loadWavFile("3.wav", baseUrl, asFile),
    loadWavFile("4.wav", baseUrl, asFile),
    loadWavFile("5.wav", baseUrl, asFile),
    loadWavFile("6.wav", baseUrl, asFile),
    loadWavFile("7.wav", baseUrl, asFile),
    loadWavFile("8.wav", baseUrl, asFile),
    loadWavFile("9.wav", baseUrl, asFile),
    loadWavFile("10.wav", baseUrl, asFile),
    loadWavFile("11.wav", baseUrl, asFile),
    loadWavFile("12.wav", baseUrl, asFile),
    loadWavFile("13.wav", baseUrl, asFile),
    loadWavFile("14.wav", baseUrl, asFile),
    loadWavFile("15.wav", baseUrl, asFile),
    loadWavFile("16.wav", baseUrl, asFile),
  ]);
  return samples;
};

// Export the test data as a function that returns a promise
export const getTestData = async (
  baseUrl?: string,
  samplesAsFiles: boolean = false,
): Promise<CreateKitData> => {
  const samples = await loadSamples(baseUrl, samplesAsFiles);

  return {
    pads: [
      // Row 1 - Using file paths
      {
        name: "Kick 1",
        samples: ["/assets/samples/13.wav"],
        chokeGroup: 0,
        playMode: PadPlayMode.TAP,
      },
      {
        name: "Kick 2",
        samples: ["/assets/samples/14.wav"],
        chokeGroup: 0,
        playMode: PadPlayMode.TAP,
      },
      {
        name: "Snare 1",
        samples: ["/assets/samples/15.wav"],
        chokeGroup: 1,
        playMode: PadPlayMode.TAP,
      },
      {
        name: "Snare 2",
        samples: ["/assets/samples/16.wav"],
        chokeGroup: 1,
        playMode: PadPlayMode.TAP,
      },

      // Row 2 - Using file paths
      {
        name: "Hi-Hat Closed",
        samples: ["/assets/samples/9.wav"],
        chokeGroup: 2,
        playMode: PadPlayMode.TAP,
      },
      {
        name: "Hi-Hat Open",
        samples: ["/assets/samples/10.wav"],
        chokeGroup: 2,
        playMode: PadPlayMode.TAP,
      },
      {
        name: "Hi-Hat Pedal",
        samples: ["/assets/samples/11.wav"],
        chokeGroup: 2,
        playMode: PadPlayMode.TAP,
      },
      {
        name: "Clap",
        samples: ["/assets/samples/12.wav"],
        playMode: PadPlayMode.TAP,
      },

      // Row 3 - Using file paths
      {
        name: "Tom High",
        samples: ["/assets/samples/5.wav"],
        chokeGroup: 3,
        playMode: PadPlayMode.TAP,
      },
      {
        name: "Tom Mid",
        samples: ["/assets/samples/6.wav"],
        chokeGroup: 3,
        playMode: PadPlayMode.TAP,
      },
      {
        name: "Tom Low",
        samples: ["/assets/samples/7.wav"],
        chokeGroup: 3,
        playMode: PadPlayMode.TAP,
      },
      {
        name: "Rim",
        samples: ["/assets/samples/8.wav"],
        playMode: PadPlayMode.TAP,
      },

      // Row 4 - Using file paths
      {
        name: "Crash 1",
        samples: ["/assets/samples/1.wav"],
        chokeGroup: 4,
        playMode: PadPlayMode.TAP,
      },
      {
        name: "Crash 2",
        samples: ["/assets/samples/2.wav"],
        chokeGroup: 4,
        playMode: PadPlayMode.TAP,
      },
      {
        name: "Cowbell",
        samples: ["/assets/samples/3.wav"],
        playMode: PadPlayMode.TAP,
      },
      {
        name: "Empty",
        samples: ["/assets/samples/4.wav"],
        playMode: PadPlayMode.TAP,
      },
    ],
    colors: {
      ...DEFAULT_KIT_COLORS,
      background: "#0a0a0a",
    },
    about: {
      name: "Test Drum Kit",
      description:
        "A comprehensive test drum kit with 16 actual WAV samples including kicks, snares, hi-hats, toms, crashes, and percussion.",
    },
    categories: [1, 2], // Japanese, Chill
  };
};

// Helper function to get test data with File objects (for client-side)
export const getTestDataWithFiles = async (baseUrl?: string): Promise<CreateKitData> => {
  return getTestData(baseUrl, true);
};

// Helper function to get test data with string paths (for server-side)
export const getTestDataWithPaths = async (baseUrl?: string): Promise<CreateKitData> => {
  return getTestData(baseUrl, false);
};

// Also export a static version with file paths (for server-side usage)
const data: CreateKitData = {
  pads: [
    // Row 1 - Using file paths
    {
      name: "Kick 1",
      samples: ["/assets/samples/13.wav"],
      chokeGroup: 0,
      playMode: PadPlayMode.TAP,
    },
    {
      name: "Kick 2",
      samples: ["/assets/samples/14.wav"],
      chokeGroup: 0,
      playMode: PadPlayMode.TAP,
    },
    {
      name: "Snare 1",
      samples: ["/assets/samples/15.wav"],
      chokeGroup: 1,
      playMode: PadPlayMode.TAP,
    },
    {
      name: "Snare 2",
      samples: ["/assets/samples/16.wav"],
      chokeGroup: 1,
      playMode: PadPlayMode.TAP,
    },

    // Row 2 - Using file paths
    {
      name: "Hi-Hat Closed",
      samples: ["/assets/samples/9.wav"],
      chokeGroup: 2,
      playMode: PadPlayMode.TAP,
    },
    {
      name: "Hi-Hat Open",
      samples: ["/assets/samples/10.wav"],
      chokeGroup: 2,
      playMode: PadPlayMode.TAP,
    },
    {
      name: "Hi-Hat Pedal",
      samples: ["/assets/samples/11.wav"],
      chokeGroup: 2,
      playMode: PadPlayMode.TAP,
    },
    {
      name: "Clap",
      samples: ["/assets/samples/12.wav"],
      playMode: PadPlayMode.TAP,
    },

    // Row 3 - Using file paths
    {
      name: "Tom High",
      samples: ["/assets/samples/5.wav"],
      chokeGroup: 3,
      playMode: PadPlayMode.TAP,
    },
    {
      name: "Tom Mid",
      samples: ["/assets/samples/6.wav"],
      chokeGroup: 3,
      playMode: PadPlayMode.TAP,
    },
    {
      name: "Tom Low",
      samples: ["/assets/samples/7.wav"],
      chokeGroup: 3,
      playMode: PadPlayMode.TAP,
    },
    {
      name: "Rim",
      samples: ["/assets/samples/8.wav"],
      playMode: PadPlayMode.TAP,
    },

    // Row 4 - Using file paths
    {
      name: "Crash 1",
      samples: ["/assets/samples/1.wav"],
      chokeGroup: 4,
      playMode: PadPlayMode.TAP,
    },
    {
      name: "Crash 2",
      samples: ["/assets/samples/2.wav"],
      chokeGroup: 4,
      playMode: PadPlayMode.TAP,
    },
    {
      name: "Cowbell",
      samples: ["/assets/samples/3.wav"],
      playMode: PadPlayMode.TAP,
    },
    {
      name: "Empty",
      samples: ["/assets/samples/4.wav"],
      playMode: PadPlayMode.TAP,
    },
  ],
  colors: {
    ...DEFAULT_KIT_COLORS,
    background: "#0a0a0a",
  },
  about: {
    name: "Test Drum Kit",
    description:
      "A comprehensive test drum kit with 16 actual WAV samples including kicks, snares, hi-hats, toms, crashes, and percussion.",
  },
  categories: [1, 2], // Japanese, Chill
};

export default data;
