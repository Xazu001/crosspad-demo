import { getPadDisplayNumberFromIndex, getPadIndexFromDisplayNumber } from "@/utils/pad-mapping";

import { useEffect, useState } from "react";

import { toast } from "react-toastify";

import { Button } from "#/components/ui/button";
import { FileAudio } from "#/components/ui/file-audio";
import { FileDrop } from "#/components/ui/file-drop";
import { Modal, ModalContent, ModalTrigger } from "#/components/ui/modal";
import { getGlobalMusicManager } from "#/lib/music/global-manager";
import { useEditKitStore } from "#/lib/stores/editKit";

// ──────────────────────────────────────────────────────────────

function EditSamplesContent() {
  const { data, addSamplesToPad, removeSampleFromPad } = useEditKitStore();
  const musicManager = getGlobalMusicManager();
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [modalPadIndex, setModalPadIndex] = useState<number | null>(null);

  const getSampleKey = (padIndex: number, sampleIndex: number) => {
    return `${padIndex}-${sampleIndex}`;
  };

  const getSampleName = (sample: string | File): string => {
    if (sample instanceof File) return sample.name;
    return decodeURIComponent(sample.split("/").pop() || sample);
  };

  useEffect(() => {
    const unsubscribe = musicManager.onStateChange(() => {
      setPlayingSampleId(musicManager.getPlayingSampleId());
    });

    const resumeAudioContext = async () => {
      const audioContext = musicManager.controller.getAudioContext();
      if (audioContext && audioContext.state === "suspended") {
        try {
          await audioContext.resume();
        } catch (error) {
          console.error("Failed to resume AudioContext on mount:", error);
        }
      }
    };

    resumeAudioContext();
    return unsubscribe;
  }, [musicManager]);

  const handleFileDrop = async (files: File[], displayIndex: number) => {
    musicManager.stopAll();
    const storageIndex = displayIndex;
    addSamplesToPad(storageIndex, files);

    const loadPromises = files.map(async (file) => {
      try {
        await musicManager.addSample(file);
      } catch (error) {
        console.error(`Error loading sample ${file.name}:`, error);
        toast.error(`Failed to load ${file.name}`);
      }
    });

    await Promise.all(loadPromises);

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
    const storageIndex = displayIndex;
    const pad = data.pads[storageIndex];
    if (pad.samples.length === 0) return;

    const sample = pad.samples[sampleIndex];
    const sampleKey = getSampleKey(displayIndex, sampleIndex);
    const sampleName = getSampleName(sample);

    try {
      // Ensure sample is loaded before playing
      if (!musicManager.getSampleBuffer(sampleName)) {
        if (sample instanceof File) {
          await musicManager.addSample(sample);
        } else {
          await musicManager.addSampleFromUrl(sample, sampleName);
        }
      }
      await musicManager.playSampleByName(sampleName, sampleKey, forcePlay);
    } catch (error) {
      toast.error("Failed to play sample.");
    }
  };

  const handleLoopToggle = (displayIndex: number, sampleIndex: number, loop: boolean) => {
    const storageIndex = displayIndex;
    const pad = data.pads[storageIndex];
    if (pad.samples.length === 0) return;

    const sampleKey = getSampleKey(displayIndex, sampleIndex);

    if (loop) {
      musicManager.toggleLoop(sampleKey, true);
      if (musicManager.getPlayingSampleId() !== sampleKey) {
        handlePlay(displayIndex, sampleIndex, true);
      }
    } else {
      musicManager.toggleLoop(sampleKey, false);
    }
  };

  const handleStop = () => {
    musicManager.stopAll();
  };

  const handleDeleteSample = async (displayIndex: number, sampleIndex: number) => {
    const storageIndex = displayIndex;
    const pad = data.pads[storageIndex];
    if (pad.samples.length > 0) {
      const sampleKey = getSampleKey(displayIndex, sampleIndex);
      musicManager.deleteSample(sampleKey);
      removeSampleFromPad(storageIndex, sampleIndex);
    }
  };

  const handleBulkImport = async (files: File[]) => {
    musicManager.stopAll();

    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    for (const file of files) {
      const newNamingMatch = file.name.match(/^(\d{1,2})_(\d{1,2})\./);

      if (newNamingMatch) {
        const padNumber = parseInt(newNamingMatch[1]);
        const sampleSlot = parseInt(newNamingMatch[2]);

        if (padNumber < 1 || padNumber > 16) continue;

        const storageIndex = getPadIndexFromDisplayNumber(padNumber);
        const pad = data.pads[storageIndex];
        const updatedSamples = [...pad.samples];

        if (sampleSlot > updatedSamples.length) {
          while (updatedSamples.length < sampleSlot - 1) {
            updatedSamples.push(`placeholder-${updatedSamples.length + 1}`);
          }
        }

        updatedSamples[sampleSlot - 1] = file;
        const realSamples = updatedSamples.filter((s) => s instanceof File);
        addSamplesToPad(storageIndex, realSamples);

        try {
          await musicManager.addSample(file);
        } catch (error) {
          toast.error(`Failed to load ${file.name}`);
        }
      } else {
        const simpleNamingMatch = file.name.match(/^(\d{1,2})\./);

        if (simpleNamingMatch) {
          const padNumber = parseInt(simpleNamingMatch[1]);
          if (padNumber < 1 || padNumber > 16) continue;

          const storageIndex = getPadIndexFromDisplayNumber(padNumber);
          addSamplesToPad(storageIndex, [file]);

          try {
            await musicManager.addSample(file);
          } catch (error) {
            toast.error(`Failed to load ${file.name}`);
          }
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
          const displayIndex = index;
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
                          const sampleKey = getSampleKey(displayIndex, sampleIndex);
                          const sampleDisplayName = isFile ? undefined : getSampleName(sample);

                          return (
                            <FileAudio
                              key={`${isFile ? sample.name : sample}-${sampleIndex}`}
                              file={isFile ? sample : undefined}
                              name={sampleDisplayName}
                              isPlaying={playingSampleId === sampleKey}
                              isLooping={musicManager.isLooping(sampleKey)}
                              onPlay={() => handlePlay(displayIndex, sampleIndex)}
                              onLoopToggle={(loop) =>
                                handleLoopToggle(displayIndex, sampleIndex, loop)
                              }
                              onStop={handleStop}
                              onDelete={() => handleDeleteSample(displayIndex, sampleIndex)}
                              className="kit-create-modal__file-audio"
                            />
                          );
                        })}
                        <div className="kit-create-modal__actions">
                          <FileDrop
                            accept="audio/mp3, audio/wav, audio/mpeg"
                            multiple
                            maxSize={50 * 1024 * 1024}
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
                          maxSize={50 * 1024 * 1024}
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
          maxSize={50 * 1024 * 1024}
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

export default function Samples() {
  return <EditSamplesContent />;
}
