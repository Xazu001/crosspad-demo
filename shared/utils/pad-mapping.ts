/**
 * Pad mapping utilities for CrossPad launchpad
 *
 * IMPORTANT: The UI displays pads from 13 (top-left) to 4 (bottom-right)
 * But storage uses index 0-15. This mapping handles the conversion.
 *
 * UI Layout (what user sees):
 * 13 14 15 16  (top row - storage indices 0-3)
 *  9 10 11 12  (second row - storage indices 4-7)
 *  5  6  7  8  (third row - storage indices 8-11)
 *  1  2  3  4  (bottom row - storage indices 12-15)
 *
 * Storage Layout (array indices 0-15):
 *  0  1  2  3  (maps to UI 13-16)
 *  4  5  6  7  (maps to UI 9-12)
 *  8  9 10 11  (maps to UI 5-8)
 * 12 13 14 15  (maps to UI 1-4)
 */
import { PadPlayMode } from "@/enums";
import type { Pad } from "@/types/kit";

// Map from storage index to display number
export function getDisplayNumber(index: number): number {
  const displayMap = [
    13,
    14,
    15,
    16, // Row 1 (top)
    9,
    10,
    11,
    12, // Row 2
    5,
    6,
    7,
    8, // Row 3
    1,
    2,
    3,
    4, // Row 4 (bottom)
  ];
  return displayMap[index] || index + 1;
}

// Map from display number to storage index
export function getStorageIndex(displayNumber: number): number {
  const storageMap: { [key: number]: number } = {
    1: 12,
    2: 13,
    3: 14,
    4: 15, // Bottom row
    5: 8,
    6: 9,
    7: 10,
    8: 11, // Third row
    9: 4,
    10: 5,
    11: 6,
    12: 7, // Second row
    13: 0,
    14: 1,
    15: 2,
    16: 3, // Top row
  };
  return storageMap[displayNumber] ?? displayNumber - 1;
}

// Reverse mapping from display number to storage index (array version)
export const PAD_DISPLAY_TO_INDEX_MAP: number[] = [
  12, // Display 13 -> Index 0
  13, // Display 14 -> Index 1
  14, // Display 15 -> Index 2
  15, // Display 16 -> Index 3
  8, // Display 9  -> Index 4
  9, // Display 10 -> Index 5
  10, // Display 11 -> Index 6
  11, // Display 12 -> Index 7
  4, // Display 5  -> Index 8
  5, // Display 6  -> Index 9
  6, // Display 7  -> Index 10
  7, // Display 8  -> Index 11
  0, // Display 1  -> Index 12
  1, // Display 2  -> Index 13
  2, // Display 3  -> Index 14
  3, // Display 4  -> Index 15
];

/**
 * Get pad storage index from display number (1-16)
 * @param displayNumber - Display pad number (1-16)
 * @returns Storage index (0-15)
 */
export function getPadIndexFromDisplayNumber(displayNumber: number): number {
  if (displayNumber < 1 || displayNumber > 16) {
    throw new Error("Display pad number must be between 1 and 16");
  }
  return PAD_DISPLAY_TO_INDEX_MAP[displayNumber - 1];
}

/**
 * Get pad display number from storage index (0-15)
 * @param storageIndex - Storage index (0-15)
 * @returns Display pad number (1-16)
 */
export function getPadDisplayNumberFromIndex(storageIndex: number): number {
  return getDisplayNumber(storageIndex);
}

/**
 * Get pad position in grid (row and column) from storage index
 * @param storageIndex - Storage index (0-15)
 * @returns Object with row and column (1-based)
 */
export function getPadPosition(storageIndex: number): {
  row: number;
  column: number;
} {
  const displayNumber = getPadDisplayNumberFromIndex(storageIndex);

  // Determine row based on display number
  let row: number;
  if (displayNumber >= 13) {
    row = 1;
  } // Top row
  else if (displayNumber >= 9) {
    row = 2;
  } // Second row
  else if (displayNumber >= 5) {
    row = 3;
  } // Third row
  else row = 4; // Bottom row

  // Determine column based on display number
  const column = ((displayNumber - 1) % 4) + 1;

  return { row, column };
}

/**
 * Get pad name based on its position in the grid
 * @param storageIndex - Storage index (0-15)
 * @returns Pad name (e.g., "Top Left", "Bottom Right", etc.)
 */
export function getPadName(storageIndex: number): string {
  const position = getPadPosition(storageIndex);
  const { row, column } = position;

  // Special cases for corners
  if (row === 1 && column === 1) return "Top Left";
  if (row === 1 && column === 4) return "Top Right";
  if (row === 4 && column === 1) return "Bottom Left";
  if (row === 4 && column === 4) return "Bottom Right";

  // General case with row names
  const rowNames = ["", "Top", "Upper", "Lower", "Bottom"];
  const columnNames = ["", "Left", "Left Middle", "Right Middle", "Right"];

  return `${rowNames[row]} ${columnNames[column]}`;
}

/**
 * Get pad name in P1-P16 format based on UI position (not storage index)
 * This is used for database storage - pad_name reflects the UI position
 *
 * Examples:
 * - Storage index 0 (top-left in UI) → "P13"
 * - Storage index 12 (bottom-left in UI) → "P1"
 * - Storage index 15 (bottom-right in UI) → "P4"
 *
 * @param storageIndex - Storage index (0-15)
 * @returns Pad name in format "P1" to "P16" based on UI position
 */
export function getPadNameUI(storageIndex: number): string {
  const displayNumber = getDisplayNumber(storageIndex);
  return `P${displayNumber}`;
}

/**
 * Get pad description based on its display number and position
 * @param storageIndex - Storage index (0-15)
 * @returns Pad description
 */
export function getPadDescription(storageIndex: number): string {
  const displayNumber = getPadDisplayNumberFromIndex(storageIndex);
  const name = getPadName(storageIndex);
  const position = getPadPosition(storageIndex);

  return `Pad ${displayNumber} - ${name} (Row ${position.row}, Column ${position.column})`;
}

// Legacy exports for backward compatibility
export const REVERSE_PAD_INDEX_MAP = PAD_DISPLAY_TO_INDEX_MAP;
export const unmapPadIndex = getPadIndexFromDisplayNumber;
export const getPadDisplayNumber = getPadDisplayNumberFromIndex;

/**
 * Create initial pads array for kit creation
 * Uses simple sequential names (Pad 1, Pad 2, etc.) as placeholders
 * These will be replaced with proper P1-P16 names when kit is saved
 *
 * @returns Array of 16 pads with placeholder names
 */
export function createInitialPads(): Pad[] {
  return Array.from({ length: 16 }, (_, i) => ({
    name: `Pad ${i + 1}`,
    description: `Pad ${i + 1}`,
    samples: [],
    playMode: PadPlayMode.TAP,
  }));
}
