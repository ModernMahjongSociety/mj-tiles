import { tiles, tilesRotated, tileSize, tileSizeRotated } from "./generated";
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
  // getUrl と同じ分岐にする。実際に返る画像と寸法がずれると場所取りが狂う。
  // tilesRotated は牌によっては欠けるので、URLの有無まで含めて揃える
  getSize: (code: TileCode | 'back', isRotated?: boolean) => {
    if (isRotated) {
      return code !== 'back' && tilesRotated[code] ? tileSizeRotated : undefined;
    }
    return tileSize;
  },
};

export { tiles, tilesRotated, tileSize, tileSizeRotated };
