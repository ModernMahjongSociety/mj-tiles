import { tiles } from "./generated";
import type { TileAssets, TileCode } from "../core/types";

export const defaultAssets: TileAssets = {
  getSvg: (code: TileCode) => tiles[code] ?? null,
};

export { tiles };
