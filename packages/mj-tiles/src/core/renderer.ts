import type { TileCode, RendererConfig, TileRenderer } from "./types";
import { parseTile, parseHand, getTileLabel } from "./parser";

export function createRenderer(config: RendererConfig): TileRenderer {
  const mode = config.mode ?? "inline";
  const cls = {
    tile: config.class?.tile ?? "mj-tile",
    tiles: config.class?.tiles ?? "mj-tiles",
    error: config.class?.error ?? "mj-tile-error",
  };

  function renderTileCode(code: TileCode): string {
    const label = getTileLabel(code);

    if (mode === "url" && config.assets.getUrl) {
      const url = config.assets.getUrl(code);
      return `<img class="${cls.tile}" src="${url}" alt="${label}" width="32" height="44" />`;
    }

    const svg = config.assets.getSvg(code);
    if (!svg) {
      return `<span class="${cls.error}">[${label}]</span>`;
    }

    const svgWithAttrs = svg.replace(
      "<svg",
      `<svg aria-label="${label}" class="${cls.tile}"`,
    );
    return svgWithAttrs;
  }

  return {
    tile(input: string): string {
      const code = parseTile(input);
      if (!code) return `<span class="${cls.error}">[${input}]</span>`;
      return renderTileCode(code);
    },

    hand(input: string): string {
      const codes = parseHand(input);
      const rendered = codes.map(renderTileCode).join("");
      return `<span class="${cls.tiles}">${rendered}</span>`;
    },
  };
}
