import { DEFAULT_KIT_COLORS } from "@/constants";
import type { CreateKitData } from "@/types/kit";

import type { KitSample } from "#/lib/stores/playKit";

// ──────────────────────────────────────────────────────────────

function transformSamples(samples: (string | File)[]): KitSample[] {
  return samples
    .filter(
      (sample): sample is File | string =>
        sample instanceof File || (typeof sample === "string" && sample.length > 0),
    )
    .map(
      (sample, idx): KitSample => ({
        sample_id: idx,
        sample_name:
          sample instanceof File
            ? sample.name
            : decodeURIComponent(sample.split("/").pop() || sample),
        sample_source: sample instanceof File ? sample : sample,
        sample_created_on: Date.now(),
        sample_status: "active",
        playback_order: idx,
      }),
    );
}

function transformColors(colors: CreateKitData["colors"]) {
  const c = colors || {};
  return {
    main: c.main || DEFAULT_KIT_COLORS.main || "#96DE2C",
    mainHover: c.mainHover || DEFAULT_KIT_COLORS.mainHover || "#7AB324",
    mainForeground: c.mainForeground || DEFAULT_KIT_COLORS.mainForeground || "#000000",
    border: c.border || DEFAULT_KIT_COLORS.border || "#transparent",
    card: c.card || DEFAULT_KIT_COLORS.card || "#171A26",
    cardBorder: c.cardBorder || DEFAULT_KIT_COLORS.cardBorder || "#40434F",
    background: c.background || DEFAULT_KIT_COLORS.background || "#0F111B",
    foreground: c.foreground || DEFAULT_KIT_COLORS.foreground || "#efefef",
  };
}

/** Transform createKit data to server format for preview */
export function transformCreateKitToServerFormat(createKitData: CreateKitData) {
  // Transform pads - only File samples for create
  const pads = createKitData.pads.map((pad, index) => ({
    pad_id: index,
    pad_position: index,
    pad_name: pad.name,
    pad_choke_group: pad.chokeGroup || null,
    pad_play_mode: pad.playMode || "tap",
    samples: pad.samples
      .filter((sample): sample is File => sample instanceof File)
      .map(
        (file, fileIndex): KitSample => ({
          sample_id: fileIndex,
          sample_name: file.name,
          sample_source: file,
          sample_created_on: Date.now(),
          sample_status: "active",
          playback_order: fileIndex,
        }),
      ),
  }));

  // Use createKit colors or fall back to defaults
  const createKitColors = createKitData.colors || {};

  // Transform colors - map createKit colors to play kit colors
  const colors = {
    main: createKitColors.main || DEFAULT_KIT_COLORS.main || "#96DE2C",
    mainHover: createKitColors.mainHover || DEFAULT_KIT_COLORS.mainHover || "#7AB324",
    mainForeground:
      createKitColors.mainForeground || DEFAULT_KIT_COLORS.mainForeground || "#000000",
    border: createKitColors.border || DEFAULT_KIT_COLORS.border || "#transparent",
    card: createKitColors.card || DEFAULT_KIT_COLORS.card || "#171A26",
    cardBorder: createKitColors.cardBorder || DEFAULT_KIT_COLORS.cardBorder || "#40434F",
    background: createKitColors.background || DEFAULT_KIT_COLORS.background || "#0F111B",
    foreground: createKitColors.foreground || DEFAULT_KIT_COLORS.foreground || "#efefef",
  };

  // Create owner info
  const owner = {
    user_id: null,
    user_name: "Preview",
    user_namespace: null,
    user_avatar_source: null,
  };

  // Create group info
  const group = {
    group_id: null,
    group_name: null,
    group_description: null,
  };

  // Return transformed kit data matching server format
  return {
    kit_id: 0, // Preview ID
    kit_name: createKitData.about.name || "Preview Kit",
    kit_description: createKitData.about.description || "Preview your kit before creating",
    colors,
    kit_logo_source: createKitData.about.logo
      ? URL.createObjectURL(createKitData.about.logo)
      : null,
    kit_metronome: 120,
    kit_created_on: Date.now(),
    kit_published_on: null,
    kit_status: "draft",
    owner,
    group,
    pads,
  };
}

/** Transform editKit data to server format for preview - handles both File and URL string samples */
export function transformEditKitToServerFormat(
  editKitData: CreateKitData,
  kitId: number,
  existingLogoUrl?: string | null,
) {
  const pads = editKitData.pads.map((pad, index) => ({
    pad_id: index,
    pad_position: index,
    pad_name: pad.name,
    pad_choke_group: pad.chokeGroup || null,
    pad_play_mode: pad.playMode || "tap",
    samples: transformSamples(pad.samples),
  }));

  const colors = transformColors(editKitData.colors);

  const owner = {
    user_id: null,
    user_name: "Preview",
    user_namespace: null,
    user_avatar_source: null,
  };

  const group = {
    group_id: null,
    group_name: null,
    group_description: null,
  };

  let logoSource: string | null = existingLogoUrl || null;
  if (editKitData.about.logo) {
    logoSource = URL.createObjectURL(editKitData.about.logo);
  }

  return {
    kit_id: kitId,
    kit_name: editKitData.about.name || "Preview Kit",
    kit_description: editKitData.about.description || "Preview your kit",
    colors,
    kit_logo_source: logoSource,
    kit_metronome: 120,
    kit_created_on: Date.now(),
    kit_published_on: null,
    kit_status: "draft",
    owner,
    group,
    pads,
  };
}
