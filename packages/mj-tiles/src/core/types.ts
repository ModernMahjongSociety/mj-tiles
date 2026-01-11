export type Suit = "m" | "p" | "s" | "z";
export type TileCode = `${number}${Suit}`;

export interface TileAssets {
  getSvg: (code: TileCode) => string | null;
  getUrl?: (code: TileCode) => string; // CSR向けURL参照
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
}
