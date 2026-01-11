import { createContext, useContext } from "hono/jsx";
import {
  createRenderer,
  type RendererConfig,
  type TileRenderer,
} from "../core";
import { defaultAssets } from "../assets";

const defaultRenderer = createRenderer({ assets: defaultAssets });
const TileContext = createContext<TileRenderer>(defaultRenderer);

export const TileProvider = TileContext.Provider;

export function useTileRenderer(): TileRenderer {
  return useContext(TileContext);
}

export function createTileConfig(
  config?: Partial<RendererConfig>,
): TileRenderer {
  return createRenderer({
    assets: config?.assets ?? defaultAssets,
    mode: config?.mode,
    styling: config?.styling,
    class: config?.class,
  });
}
