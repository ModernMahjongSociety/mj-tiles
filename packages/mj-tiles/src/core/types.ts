export type Suit = "m" | "p" | "s" | "z";
export type TileCode = `${number}${Suit}`;

// Phase 0: 拡張機能の型定義

// 牌の状態（表示用の修飾子）
export interface TileState {
  code: TileCode;          // "1m" | "2m" | ... | "7z" | "0m" | "0p" | "0s"
  isRotated?: boolean;     // y: 横向き（副露牌・立直宣言牌）
  isFaceDown?: boolean;    // o: 伏せ牌（暗槓の両端）
  isTsumo?: boolean;       // m: ツモ牌
  isRon?: boolean;         // l: ロン牌
}

// 副露の種類
export type MeldType =
  | 'chii'        // チー（順子）
  | 'pon'         // ポン（刻子）
  | 'daiminkan'   // 大明槓
  | 'kakan'       // 加槓
  | 'ankan';      // 暗槓

// 鳴きの方向
export type MeldFrom =
  | 'kamicha'     // 上家（左）
  | 'toimen'      // 対面
  | 'shimocha';   // 下家（右）

// 副露情報（mspz拡張方式ベース）
export interface MeldInfo {
  type: MeldType;
  tiles: TileState[];
  from?: MeldFrom;          // 鳴きの方向（暗槓は undefined）
  calledTileIndex?: number; // 鳴いた牌の位置（0始まり）
}

// 手牌全体
export interface Hand {
  concealed: TileState[];   // 門前牌
  melds: MeldInfo[];        // 副露面子
}

export interface TileAssets {
  getSvg: (code: TileCode | 'back') => string | null;
  getUrl?: (code: TileCode | 'back', isRotated?: boolean) => string; // CSR向けURL参照（横向き対応）
}

export interface RendererConfig {
  assets: TileAssets;
  mode?: "inline" | "url"; // デフォルト: inline
  styling?: "class" | "inline"; // デフォルト: class
  class?: {
    tile?: string;
    tiles?: string;
    error?: string;
  };
}

export interface TileRenderer {
  tile: (input: string) => string;
  hand: (input: string) => string;
  handExtended?: (input: string) => string; // Phase 3: 拡張記法対応
}
