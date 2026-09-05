import { tiles, tilesRotated } from "./generated";
import type { TileAssets, TileCode } from "../core/types";

// WebP画像アセット（base64 data URL）
export const defaultAssets: TileAssets = {
  getSvg: () => null,  // SVGは廃止（後方互換性のため残す）
  getUrl: (code: TileCode | 'back', isRotated?: boolean) => {
    // 横向き専用の画像が無い牌（裏面など）は undefined を返し、
    // 呼び出し側にCSSでの回転を任せる。通常版を返すと回転済みと誤認される
    if (isRotated) {
      return code === 'back' ? undefined : tilesRotated[code];
    }
    return tiles[code];
  },
};

export { tiles, tilesRotated };
