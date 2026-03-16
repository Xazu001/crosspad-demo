import type { KitColors } from "$/database/schema";
import { type PadPlayMode } from "@/enums";

export type Category = {
  id: number;
  name: string;
  description?: string;
};

export type Pad = {
  name: string;
  samples: (string | File)[];
  chokeGroup?: number;
  playMode?: (typeof PadPlayMode)[keyof typeof PadPlayMode];
};

export type About = {
  name: string;
  description: string;
  logo?: File;
};

export type CreateKitData = {
  pads: Pad[];
  colors: KitColors;
  about: About;
  categories: number[];
};
