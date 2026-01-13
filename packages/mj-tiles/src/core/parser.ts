import type { TileCode, TileState, MeldInfo, Hand, MeldType, MeldFrom } from "./types";

const HONOR_MAP: Record<string, TileCode> = {
  東: "1z",
  南: "2z",
  西: "3z",
  北: "4z",
  白: "5z",
  發: "6z",
  中: "7z",
};

// 牌画作成くん方式の字牌独自記号
const PAIGA_HONOR_MAP: Record<string, string> = {
  't': '1z', // 東
  'n': '2z', // 南
  's': '3z', // 西
  'p': '4z', // 北
  'h': '5z', // 白
  'r': '6z', // 發
  'c': '7z', // 中
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

// Phase 0: 正規化関数
// 牌画作成くん方式をmspz拡張方式に変換
export function normalizeNotation(input: string): string {
  let normalized = input.trim();

  // a5m → 0m（赤ドラ）
  normalized = normalized.replace(/a5([mps])/g, '0$1');

  // 字牌独自記号 → z形式
  // r5m 形式は保護（赤ドラ）
  normalized = normalized.replace(/r(\d)([mps])/g, 'RED$1$2'); // 一時マーク

  // 単独の字牌記号を変換
  // 文脈依存の衝突を避けるため、慎重に置換
  for (const [key, value] of Object.entries(PAIGA_HONOR_MAP)) {
    // 数字や記号の後ではない場合のみ変換
    // 例: "3p" は三筒、"p" は北、"yp" は横向きの北
    // "123-s" の "s" は索子（変換しない）
    normalized = normalized.replace(
      new RegExp(`(?<![0-9\\-=+yo])${key}(?![0-9mps])`, 'g'),
      value
    );
  }

  // 赤ドラマークを戻す
  normalized = normalized.replace(/RED(\d)([mps])/g, '0$2');

  return normalized;
}

// Phase 0: バリデーション関数
function parseTileNumber(code: TileCode): number {
  return parseInt(code[0], 10);
}

export function validateMeld(tiles: TileCode[], type: MeldType): boolean {
  if (type === 'chii') {
    // チーは連続した3枚の数牌
    if (tiles.length !== 3) return false;
    const suit = tiles[0][1];
    if (suit === 'z') return false; // 字牌はチー不可

    // 全て同じスートか確認
    if (!tiles.every(t => t[1] === suit)) return false;

    // 連続性チェック
    const nums = tiles.map(parseTileNumber).sort((a, b) => a - b);
    return nums[1] - nums[0] === 1 && nums[2] - nums[1] === 1;
  }

  if (type === 'pon' || type === 'daiminkan' || type === 'kakan') {
    // ポン・カンは同じ牌
    const expectedCount = type === 'pon' ? 3 : 4;
    if (tiles.length !== expectedCount) return false;

    // 赤ドラを正規化して比較
    const normalized = tiles.map(t => t.replace('0', '5') as TileCode);
    const uniqueCodes = new Set(normalized);
    return uniqueCodes.size === 1;
  }

  if (type === 'ankan') {
    // 暗槓は同じ牌4枚
    if (tiles.length !== 4) return false;
    const normalized = tiles.map(t => t.replace('0', '5') as TileCode);
    const uniqueCodes = new Set(normalized);
    return uniqueCodes.size === 1;
  }

  return true;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateHand(hand: Hand): ValidationResult {
  const errors: string[] = [];

  // 牌の総数チェック（門前 + 副露 = 13 or 14）
  const concealedCount = hand.concealed.length;
  const meldTileCount = hand.melds.reduce((sum, m) => sum + m.tiles.length, 0);
  const totalCount = concealedCount + meldTileCount;

  if (totalCount !== 13 && totalCount !== 14) {
    errors.push(`牌の総数が不正: ${totalCount}枚（13または14枚である必要があります）`);
  }

  // 各牌が4枚を超えていないかチェック
  const tileCounts = new Map<string, number>();
  const countTile = (code: TileCode) => {
    const normalized = code.replace('0', '5'); // 赤ドラを正規化
    tileCounts.set(normalized, (tileCounts.get(normalized) || 0) + 1);
  };

  hand.concealed.forEach(t => countTile(t.code));
  hand.melds.forEach(m => m.tiles.forEach(t => countTile(t.code)));

  for (const [tile, count] of tileCounts) {
    if (count > 4) {
      errors.push(`${tile}が${count}枚（4枚を超えています）`);
    }
  }

  // 各副露の妥当性チェック
  hand.melds.forEach((meld, index) => {
    const tilesCodes = meld.tiles.map(t => t.code);
    if (!validateMeld(tilesCodes, meld.type)) {
      errors.push(`副露${index + 1}が不正: type=${meld.type}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// Phase 1: parseHandExtended 関数
export function parseHandExtended(input: string): Hand {
  const normalized = normalizeNotation(input);
  const concealed: TileState[] = [];
  const melds: MeldInfo[] = [];

  // スペースで分割して処理（面子ごとに分ける）
  const parts = normalized.split(/\s+/).filter(s => s.length > 0);

  for (const part of parts) {
    // 副露記号の検出
    if (part.includes('-') || part.includes('=') || part.includes('+')) {
      // 新篠ゆう方式
      melds.push(parseArasinoMeld(part));
    } else if (part.includes('y') || part.includes('o')) {
      // 単純な修飾子付き牌（o1m, y2p など）は門前牌として扱う
      const simplePattern = /^[oy]\d[mpsz]$/;
      if (simplePattern.test(part)) {
        const modifier = part[0];
        const num = part[1];
        const suit = part[2];
        concealed.push({
          code: `${num}${suit}` as TileCode,
          isFaceDown: modifier === 'o',
          isRotated: modifier === 'y',
        });
      } else {
        // 牌画作成くん方式（副露）
        melds.push(parsePaigaMeld(part));
      }
    } else {
      // 通常の門前牌
      const tiles = parseSimpleTiles(part);
      concealed.push(...tiles);
    }
  }

  return { concealed, melds };
}

// 新篠ゆう方式の副露をパース
function parseArasinoMeld(input: string): MeldInfo {
  let nums: string[] = [];
  let tiles: TileState[] = [];
  let dashPos = -1;  // `-` 記号の位置
  let equalsPos = -1;  // `=` 記号の位置
  let plusPos = -1;  // `+` 記号の位置
  let suit: string = '';

  // 文字を走査
  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (/[0-9]/.test(char)) {
      nums.push(char);
    } else if (char === '-') {
      dashPos = nums.length;
    } else if (char === '=') {
      equalsPos = nums.length;
    } else if (char === '+') {
      plusPos = nums.length;
    } else if (/[mpsz]/.test(char)) {
      suit = char;
      break;
    }
  }

  // 牌を生成
  for (const n of nums) {
    tiles.push({
      code: `${n}${suit}` as TileCode,
      isRotated: false,
    });
  }

  // 副露タイプと方向を判定
  if (plusPos >= 0) {
    // 暗槓
    tiles[0].isFaceDown = true;
    tiles[tiles.length - 1].isFaceDown = true;
    return {
      type: 'ankan',
      tiles,
    };
  }

  if (equalsPos >= 0) {
    // 加槓（`-` と `=` の両方がある）
    // `-` の位置が鳴きの方向を示す
    const calledTileIndex = dashPos > 0 ? dashPos - 1 : 0;
    tiles[calledTileIndex].isRotated = true;

    const from: MeldFrom =
      calledTileIndex === 0 ? 'kamicha' :
      calledTileIndex === 1 ? 'toimen' :
      'shimocha';

    return {
      type: 'kakan',
      tiles,
      from,
      calledTileIndex,
    };
  }

  if (dashPos >= 0) {
    // チー・ポン・大明槓
    // 記号の位置から鳴いた牌を特定
    // 特殊ケース: 123-s のように記号が最後にある場合
    const calledTileIndex = dashPos === 0 ? 0 :
                            dashPos >= tiles.length ? tiles.length - 1 :
                            dashPos - 1;

    tiles[calledTileIndex].isRotated = true;

    const from: MeldFrom =
      calledTileIndex === 0 ? 'kamicha' :
      calledTileIndex === 1 ? 'toimen' :
      'shimocha';

    // タイプ判定
    const type: MeldType =
      tiles.length === 3 ? (isSequence(tiles.map(t => t.code)) ? 'chii' : 'pon') :
      'daiminkan';

    return {
      type,
      tiles,
      from,
      calledTileIndex,
    };
  }

  throw new Error(`Invalid meld notation: ${input}`);
}

// 牌画作成くん方式の副露をパース
function parsePaigaMeld(input: string): MeldInfo {
  const tiles: TileState[] = [];
  let rotatedIndex = -1;
  let i = 0;

  // 特殊パターン: o[数字]+[スート]o （暗槓）
  // o33so = 3索の暗槓（両端が伏せ牌、中の2枚が見える）
  const ankanPattern = /^o(\d+)([mpsz])o$/;
  const ankanMatch = input.match(ankanPattern);
  if (ankanMatch) {
    const nums = ankanMatch[1].split('');
    const suit = ankanMatch[2];

    // 暗槓は4枚なので、見える牌（nums）から4枚を生成
    // o33so の場合: [3s(伏), 3s, 3s, 3s(伏)]

    // 最初の牌を伏せ牌として追加
    tiles.push({
      code: `${nums[0]}${suit}` as TileCode,
      isFaceDown: true,
    });

    // 中間の牌を通常の牌として追加（見える牌）
    for (const num of nums) {
      tiles.push({
        code: `${num}${suit}` as TileCode,
      });
    }

    // 最後の牌を伏せ牌として追加
    tiles.push({
      code: `${nums[0]}${suit}` as TileCode,
      isFaceDown: true,
    });

    return {
      type: 'ankan',
      tiles,
    };
  }

  // まず、数字とスートを取得
  // o33so のような記法では、最後の o は伏せ牌の修飾子なので、その前の s がスート
  const suitMatch = input.match(/([mpsz])[^mpsz]*$/);
  if (!suitMatch) {
    throw new Error(`Invalid paiga meld notation: ${input} (no suit found)`);
  }
  const suit = suitMatch[1];

  // 数字と修飾子を処理
  let suitFound = false;
  while (i < input.length) {
    const char = input[i];

    // スートが見つかったらフラグを立てる
    if (char === suit) {
      suitFound = true;
      i++;
      continue;
    }

    if (char === 'o') {
      // 伏せ牌（次の1文字が数字）
      i++;
      if (i < input.length && /[0-9]/.test(input[i])) {
        tiles.push({
          code: `${input[i]}${suit}` as TileCode,
          isFaceDown: true,
        });
        i++;
      }
    } else if (char === 'y') {
      // 横向き（次の1文字が数字）
      rotatedIndex = tiles.length;
      i++;
      if (i < input.length && /[0-9]/.test(input[i])) {
        tiles.push({
          code: `${input[i]}${suit}` as TileCode,
          isRotated: true,
        });
        i++;
      }
    } else if (/[0-9]/.test(char)) {
      // 通常の牌
      tiles.push({
        code: `${char}${suit}` as TileCode,
      });
      i++;
    } else {
      i++;
    }
  }

  // 暗槓の検出（両端が伏せ牌）
  if (tiles.length === 4 && tiles[0].isFaceDown && tiles[3].isFaceDown) {
    return {
      type: 'ankan',
      tiles,
    };
  }

  // 横向き牌があれば副露
  if (rotatedIndex >= 0) {
    // 牌画作成くん方式では、記号の前にある牌の数で方向を判定
    // 5y55p: 記号の前に1枚 → kamicha
    // 55y5p: 記号の前に2枚 → toimen
    // 555yp: 記号の前に3枚 → shimocha
    const tilesBeforeY = rotatedIndex;
    const from: MeldFrom =
      tilesBeforeY === 1 ? 'kamicha' :
      tilesBeforeY === 2 ? 'toimen' :
      'shimocha';

    const type: MeldType =
      tiles.length === 3 ? (isSequence(tiles.map(t => t.code)) ? 'chii' : 'pon') :
      tiles.length === 4 ? 'daiminkan' :
      'pon';

    return {
      type,
      tiles,
      from,
      calledTileIndex: rotatedIndex,
    };
  }

  throw new Error(`Invalid paiga meld notation: ${input}`);
}

// 通常の門前牌をパース
function parseSimpleTiles(input: string): TileState[] {
  const tiles: TileState[] = [];
  let nums: string[] = [];

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (/[0-9]/.test(char)) {
      nums.push(char);
    } else if (/[mpsz]/.test(char)) {
      // スート確定
      for (const n of nums) {
        tiles.push({
          code: `${n}${char}` as TileCode,
        });
      }
      nums = [];
    } else if (HONOR_MAP[char]) {
      // 字牌
      tiles.push({
        code: HONOR_MAP[char],
      });
    }
  }

  return tiles;
}

// 順子判定
function isSequence(codes: TileCode[]): boolean {
  if (codes.length !== 3) return false;
  const suit = codes[0][1];
  if (suit === 'z') return false;
  if (!codes.every(c => c[1] === suit)) return false;

  const nums = codes.map(parseTileNumber).sort((a, b) => a - b);
  return nums[1] - nums[0] === 1 && nums[2] - nums[1] === 1;
}
