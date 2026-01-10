import type { TileCode } from "./types";

const HONOR_MAP: Record<string, TileCode> = {
  東: "1z",
  南: "2z",
  西: "3z",
  北: "4z",
  白: "5z",
  發: "6z",
  中: "7z",
};

const CODE_TO_LABEL: Record<string, string> = {
  "1z": "東",
  "2z": "南",
  "3z": "西",
  "4z": "北",
  "5z": "白",
  "6z": "發",
  "7z": "中",
};

export function parseTile(input: string): TileCode | null {
  if (HONOR_MAP[input]) return HONOR_MAP[input];
  // r5m → 0m (赤牌)
  if (/^r5[mps]$/.test(input)) {
    return `0${input[2]}` as TileCode;
  }
  if (/^[0-9][mpsz]$/.test(input)) return input as TileCode;
  return null;
}

export function parseHand(input: string): TileCode[] {
  const tiles: TileCode[] = [];
  let nums: string[] = [];
  let isRed = false; // rフラグ（赤牌）

  for (const char of input) {
    if (char === 'r') {
      isRed = true;
      continue;
    }

    if (/[0-9]/.test(char)) {
      nums.push(char);
    } else if (/[mpsz]/.test(char)) {
      for (const n of nums) {
        // r5m → 0m (赤牌)
        if (isRed && n === '5' && char !== 'z') {
          tiles.push(`0${char}` as TileCode);
        } else {
          tiles.push(`${n}${char}` as TileCode);
        }
      }
      nums = [];
      isRed = false;
    } else if (HONOR_MAP[char]) {
      tiles.push(HONOR_MAP[char]);
      isRed = false;
    }
  }
  return tiles;
}

export function getTileLabel(code: TileCode): string {
  return CODE_TO_LABEL[code] ?? code;
}
