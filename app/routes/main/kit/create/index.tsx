import { getPadDisplayNumberFromIndex, getPadIndexFromDisplayNumber } from "@/utils/pad-mapping";

import { useEffect, useState } from "react";

import { toast } from "react-toastify";

import { Button } from "#/components/ui/button";
import { FileAudio } from "#/components/ui/file-audio";
import { FileDrop } from "#/components/ui/file-drop";
import { Modal, ModalContent, ModalTrigger } from "#/components/ui/modal";
import { getGlobalMusicManager } from "#/lib/music/global-manager";
import { useCreateKitStore } from "#/lib/stores/createKit";

// ──────────────────────────────────────────────────────────────

/** Kit creation page content */
function KitCreateContent() {
  const { data, addSamplesToPad, removeSampleFromPad } = useCreateKitStore();
  const musicManager = getGlobalMusicManager();
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [modalPadIndex, setModalPadIndex] = useState<number | null>(null);

  // Map of sample names to their pad and sample index
  const getSampleKey = (padIndex: number, sampleIndex: number, file: File) => {
    return `${padIndex}-${sampleIndex}`;
  };

  // Listen for state changes from music manager
  useEffect(() => {
    const unsubscribe = musicManager.onStateChange(() => {
      setPlayingSampleId(musicManager.getPlayingSampleId());
    });

    // Ensure AudioContext is resumed when component mounts
    const resumeAudioContext = async () => {
      const audioContext = musicManager.controller.getAudioContext();
      if (audioContext && audioContext.state === "suspended") {
        try {
          await audioContext.resume();
          console.log("AudioContext resumed on component mount");
        } catch (error) {
          console.error("Failed to resume AudioContext on mount:", error);
        }
      }
    };

    resumeAudioContext();

    return unsubscribe;
  }, [musicManager]);

  // Don't use onPlaybackEnd callback - manage state locally
  useEffect(() => {
    // No cleanup needed for global manager
    return () => {
      // Component cleanup - but don't dispose the global manager
    };
  }, []);

  const handleFileDrop = async (files: File[], displayIndex: number) => {
    // Stop any playing sample and reset state
    musicManager.stopAll();

    // Direct mapping: display index is the same as storage index
    const storageIndex = displayIndex;

    // Add files to the store
    addSamplesToPad(storageIndex, files);

    // Load files into the music controller
    const loadPromises = files.map(async (file) => {
      try {
        await musicManager.addSample(file);
        console.log(`Successfully loaded sample: ${file.name}`);
      } catch (error) {
        console.error(`Error loading sample ${file.name}:`, error);
        toast.error(`Failed to load ${file.name}`);
      }
    });

    // Wait for all files to load
    await Promise.all(loadPromises);

    // Show success message if all files loaded
    const successCount =
      loadPromises.length -
      (await Promise.allSettled(loadPromises)).filter((p) => p.status === "rejected").length;
    if (successCount > 0) {
      toast.success(`Successfully loaded ${successCount} sample${successCount > 1 ? "s" : ""}`);
    }
  };

  const handlePlay = async (
    displayIndex: number,
    sampleIndex: number = 0,
    forcePlay: boolean = false,
  ) => {
    // Direct mapping: display index is the same as storage index
    const storageIndex = displayIndex;
    const pad = data.pads[storageIndex];
    if (pad.samples.length === 0) return;

    const sample = pad.samples[sampleIndex];
    if (!(sample instanceof File)) return;

    const sampleKey = getSampleKey(displayIndex, sampleIndex, sample);

    try {
      await musicManager.playSampleByName(sample.name, sampleKey, forcePlay);
    } catch (error) {
      console.error("Error playing sample:", error);
      // Try loading if not in memory
      try {
        await musicManager.addSample(sample);
        await musicManager.playSampleByName(sample.name, sampleKey, forcePlay);
      } catch (loadError) {
        console.error("Failed to load and play sample:", loadError);
        toast.error("Failed to play sample. Please try uploading it again.");
      }
    }
  };

  const handleLoopToggle = (displayIndex: number, sampleIndex: number, loop: boolean) => {
    // Direct mapping: display index is the same as storage index
    const storageIndex = displayIndex;
    const pad = data.pads[storageIndex];
    if (pad.samples.length === 0) return;

    const sample = pad.samples[sampleIndex];
    if (!(sample instanceof File)) return;

    const sampleKey = getSampleKey(displayIndex, sampleIndex, sample);

    if (loop) {
      // Enable loop
      musicManager.toggleLoop(sampleKey, true);
      // If sample is not playing, start it
      if (musicManager.getPlayingSampleId() !== sampleKey) {
        handlePlay(displayIndex, sampleIndex, true);
      }
    } else {
      // Disable loop
      musicManager.toggleLoop(sampleKey, false);
    }
  };

  const handleStop = () => {
    musicManager.stopAll();
  };

  const handleDeleteSample = async (displayIndex: number, sampleIndex: number) => {
    // Direct mapping: display index is the same as storage index
    const storageIndex = displayIndex;
    const pad = data.pads[storageIndex];
    if (pad.samples.length > 0 && pad.samples[sampleIndex] instanceof File) {
      const sampleKey = getSampleKey(displayIndex, sampleIndex, pad.samples[sampleIndex] as File);

      // Remove from music manager
      musicManager.deleteSample(sampleKey);

      // Remove from store
      removeSampleFromPad(storageIndex, sampleIndex);
    }
  };

  const handleBulkImport = async (files: File[]) => {
    // Stop any playing sample
    musicManager.stopAll();

    // Check if files were provided
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    console.log("Starting bulk import of", files.length, "files");

    // Process each file individually
    for (const file of files) {
      console.log("Processing file:", file.name);

      // Check if it's the new naming convention (e.g., "07_01.wav")
      const newNamingMatch = file.name.match(/^(\d{1,2})_(\d{1,2})\./);

      if (newNamingMatch) {
        // New naming: pad_sample (e.g., 07_01.wav = pad 7, sample 1)
        const padNumber = parseInt(newNamingMatch[1]);
        const sampleSlot = parseInt(newNamingMatch[2]);

        console.log(`New naming: Pad ${padNumber}, Slot ${sampleSlot}`);

        // Validate pad number
        if (padNumber < 1 || padNumber > 16) {
          console.warn(`Invalid pad number ${padNumber} in file ${file.name}`);
          continue;
        }

        // Use mapping: pad number 7 = index 10 (grid position)
        const storageIndex = getPadIndexFromDisplayNumber(padNumber);
        const row = Math.floor(storageIndex / 4) + 1;
        const col = (storageIndex % 4) + 1;
        console.log(
          `File: ${file.name} -> Pad ${padNumber} -> Index ${storageIndex} (Grid: Row ${row}, Column ${col})`,
        );

        // Get current samples for this pad
        const pad = data.pads[storageIndex];
        const updatedSamples = [...pad.samples];

        // Ensure the samples array is large enough for the sample slot
        if (sampleSlot > updatedSamples.length) {
          // Fill missing slots with placeholder strings
          while (updatedSamples.length < sampleSlot - 1) {
            updatedSamples.push(`placeholder-${updatedSamples.length + 1}`);
          }
        }

        // Place the file in the correct slot (replace placeholder if exists)
        updatedSamples[sampleSlot - 1] = file;

        // Remove any placeholders and add only real files
        const realSamples = updatedSamples.filter((s) => s instanceof File);

        // Update the pad with all samples
        addSamplesToPad(storageIndex, realSamples);

        // Load the file into music manager
        try {
          await musicManager.addSample(file);
          console.log(`Successfully loaded ${file.name} to pad ${padNumber}`);
        } catch (error) {
          console.error(`Failed to load ${file.name}:`, error);
          toast.error(`Failed to load ${file.name}`);
        }
      } else {
        // Simple naming: just the pad number (e.g., "07.wav" = pad 7)
        const simpleNamingMatch = file.name.match(/^(\d{1,2})\./);

        if (simpleNamingMatch) {
          const padNumber = parseInt(simpleNamingMatch[1]);

          console.log(`Simple naming: Pad ${padNumber}`);

          // Validate pad number
          if (padNumber < 1 || padNumber > 16) {
            console.warn(`Invalid pad number ${padNumber} in file ${file.name}`);
            continue;
          }

          // Use mapping: pad number 13 = index 0 (top-left)
          const storageIndex = getPadIndexFromDisplayNumber(padNumber);
          const row = Math.floor(storageIndex / 4) + 1;
          const col = (storageIndex % 4) + 1;
          console.log(
            `File: ${file.name} -> Pad ${padNumber} -> Index ${storageIndex} (Grid: Row ${row}, Column ${col})`,
          );

          // Add file to pad
          addSamplesToPad(storageIndex, [file]);

          // Load file into music manager
          try {
            await musicManager.addSample(file);
            console.log(`Successfully loaded ${file.name} to pad ${padNumber}`);
          } catch (error) {
            console.error(`Failed to load ${file.name}:`, error);
            toast.error(`Failed to load ${file.name}`);
          }
        } else {
          console.warn(`Skipping file with unrecognized format: ${file.name}`);
        }
      }
    }

    toast.success("Successfully imported all samples!");
  };

  return (
    <div
      className="pads"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4rem",
      }}
    >
      <div className="pads__container">
        {data.pads.map((pad, index) => {
          // Direct mapping: index is both display and storage
          const displayIndex = index;
          // Show correct display number in modal (13 for first pad, 1 for last)
          const displayNumber = getPadDisplayNumberFromIndex(index);

          return (
            <div key={`pad-${displayIndex}`} className="pads__pad">
              <Modal
                open={modalPadIndex === displayIndex}
                onOpenChange={(open) => {
                  if (!open) {
                    setModalPadIndex(null);
                    handleStop();
                  }
                }}
              >
                <ModalTrigger onClick={() => setModalPadIndex(displayIndex)}>
                  <Button variant="secondary" size="sm" type="button">
                    {pad.samples.length > 0
                      ? `${pad.samples.length} file${pad.samples.length > 1 ? "s" : ""}`
                      : "Add"}
                  </Button>
                </ModalTrigger>
                <ModalContent size="xl">
                  <h2>Pad {displayNumber} Samples</h2>
                  <div className="kit-create-modal__samples">
                    {pad.samples.length > 0 ? (
                      <div className="kit-create-modal__sample-list">
                        {pad.samples.map((sample, sampleIndex) => {
                          const isFile = sample instanceof File;
                          const sampleKey = isFile
                            ? getSampleKey(displayIndex, sampleIndex, sample)
                            : "";
                          return (
                            <FileAudio
                              key={`${isFile ? sample.name : sample}-${sampleIndex}`}
                              file={isFile ? sample : undefined}
                              isPlaying={isFile && playingSampleId === sampleKey}
                              isLooping={isFile && musicManager.isLooping(sampleKey)}
                              onPlay={
                                isFile ? () => handlePlay(displayIndex, sampleIndex) : undefined
                              }
                              onLoopToggle={
                                isFile
                                  ? (loop) => handleLoopToggle(displayIndex, sampleIndex, loop)
                                  : undefined
                              }
                              onStop={isFile ? handleStop : undefined}
                              onDelete={
                                isFile
                                  ? () => handleDeleteSample(displayIndex, sampleIndex)
                                  : undefined
                              }
                              disabled={!isFile}
                              className="kit-create-modal__file-audio"
                            />
                          );
                        })}
                        <div className="kit-create-modal__actions">
                          <FileDrop
                            accept="audio/mp3, audio/wav, audio/mpeg"
                            multiple
                            maxSize={50 * 1024 * 1024} // 50MB
                            onFilesDrop={(files) => handleFileDrop(files, displayIndex)}
                            className="kit-create-modal__file-drop"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="kit-create-modal__empty">
                        <p>No samples added yet. Drop your audio files below or click to browse.</p>
                        <FileDrop
                          accept="audio/mp3, audio/wav, audio/mpeg"
                          multiple
                          maxSize={50 * 1024 * 1024} // 50MB
                          onFilesDrop={(files) => handleFileDrop(files, displayIndex)}
                          className="kit-create-modal__file-drop"
                        />
                      </div>
                    )}
                  </div>
                </ModalContent>
              </Modal>
            </div>
          );
        })}
      </div>
      <div className="pads__header">
        <FileDrop
          accept="audio/mp3, audio/wav, audio/mpeg"
          multiple
          maxSize={50 * 1024 * 1024} // 50MB
          onFilesDrop={handleBulkImport}
          className="pads__bulk-import"
          style={{
            textAlign: "center",
          }}
        >
          Import All Samples
        </FileDrop>
      </div>
    </div>
  );
}

export default function Index() {
  return <KitCreateContent />;
}
