import "./dot-letters.style.scss";

import * as React from "react";

// ──────────────────────────────────────────────────────────────

type DotLettersChar =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z"
  | "-"
  | " "
  | "?";

export interface DotLettersProps {
  letters: string;
  /**
   * Multiplier for each dot cell. 1 = base 5x7 grid, 2 doubles density, etc.
   */
  dotScale?: number;
  /**
   * How many off-dots to place between letters (in dot columns, after scaling).
   */
  letterGapColumns?: number;
  /**
   * Off-dot padding around the whole word (applied to all sides, in dot units, after scaling).
   */
  outerPadding?: number;
}

const DOT_WIDTH = 5;
const DOT_HEIGHT = 7;

const charMaps: Record<DotLettersChar, string[]> = {
  "0": ["11111", "10001", "10001", "10001", "10001", "10001", "11111"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["11111", "00001", "00001", "11111", "10000", "10000", "11111"],
  "3": ["11111", "00001", "00001", "01111", "00001", "00001", "11111"],
  "4": ["10001", "10001", "10001", "11111", "00001", "00001", "00001"],
  "5": ["11111", "10000", "10000", "11111", "00001", "00001", "11111"],
  "6": ["11111", "10000", "10000", "11111", "10001", "10001", "11111"],
  "7": ["11111", "00001", "00001", "00010", "00010", "00010", "00010"],
  "8": ["11111", "10001", "10001", "11111", "10001", "10001", "11111"],
  "9": ["11111", "10001", "10001", "11111", "00001", "00001", "11111"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11111", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11111", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "10001", "11001", "10101", "10011", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
  Y: ["10001", "01010", "00100", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "?": ["11110", "00001", "00001", "00110", "00100", "00000", "00100"],
};

const DotLetters = ({
  letters,
  dotScale = 1,
  letterGapColumns = 1,
  outerPadding = 0,
}: DotLettersProps) => {
  const scale = Math.max(1, Math.floor(dotScale));
  const gapCols = Math.max(0, Math.floor(letterGapColumns));
  const pad = Math.max(0, Math.floor(outerPadding));
  const normalized = letters.toUpperCase().slice(0, 3);
  const chars = normalized.split("").map((char) => {
    if (charMaps[char as DotLettersChar]) {
      return char as DotLettersChar;
    }
    return "?";
  });

  const contentWidth = chars.length * DOT_WIDTH * scale + Math.max(0, chars.length - 1) * gapCols;
  const totalColumns = contentWidth + pad * 2;

  const cells: boolean[] = [];

  const pushOffRow = () => {
    for (let c = 0; c < totalColumns; c += 1) {
      cells.push(false);
    }
  };

  // top padding
  for (let r = 0; r < pad; r += 1) {
    pushOffRow();
  }

  for (let row = 0; row < DOT_HEIGHT; row += 1) {
    // vertical scaling
    for (let v = 0; v < scale; v += 1) {
      // left padding
      for (let l = 0; l < pad; l += 1) {
        cells.push(false);
      }

      chars.forEach((char, charIndex) => {
        const patternRow = charMaps[char][row];

        // horizontal scaling
        for (let col = 0; col < DOT_WIDTH; col += 1) {
          const isOn = patternRow[col] === "1";
          for (let h = 0; h < scale; h += 1) {
            cells.push(isOn);
          }
        }

        // gap between letters
        if (charIndex < chars.length - 1) {
          for (let spacer = 0; spacer < gapCols; spacer += 1) {
            cells.push(false);
          }
        }
      });

      // right padding
      for (let l = 0; l < pad; l += 1) {
        cells.push(false);
      }
    }
  }

  // bottom padding
  for (let r = 0; r < pad; r += 1) {
    pushOffRow();
  }

  return (
    <div
      className="dot-letters"
      style={
        {
          "--dot-columns": totalColumns,
        } as React.CSSProperties
      }
      aria-label={`Dot display: ${normalized}`}
    >
      <div className="dot-letters__grid" role="presentation">
        {cells.map((isOn, index) => (
          <span
            key={index}
            className={`dot-letters__dot${isOn ? " dot-letters__dot--on" : ""}`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
};

export { DotLetters };
