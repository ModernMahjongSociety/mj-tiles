import { tiles, tilesRotated } from "./generated";
import type { TileAssets, TileCode } from "../core/types";

// WebP画像アセット（base64 data URL）
export const defaultAssets: TileAssets = {
  getSvg: () => null,  // SVGは廃止（後方互換性のため残す）
  getUrl: (code: TileCode | 'back', isRotated?: boolean) => {
    // 裏面は常に通常版を使用
    if (code === 'back') {
      return tiles[code];
    }
    // 横向き画像がある場合はそれを使用、なければ通常版
    if (isRotated && tilesRotated[code]) {
      return tilesRotated[code];
    }
    return tiles[code];
  },
};

export { tiles, tilesRotated };
