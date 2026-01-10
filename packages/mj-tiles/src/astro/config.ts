import {
  createRenderer,
  type RendererConfig,
  type TileRenderer,
} from "../core";
import { defaultAssets } from "../assets";

let globalRenderer: TileRenderer = createRenderer({ assets: defaultAssets });

export function configureTiles(config: Partial<RendererConfig>): void {
  globalRenderer = createRenderer({
    assets: config.assets ?? defaultAssets,
    mode: config.mode,
    class: config.class,
  });
}

export function getRenderer(): TileRenderer {
  return globalRenderer;
}
