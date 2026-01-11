import type { TileCode, RendererConfig, TileRenderer } from "./types";
import { parseTile, parseHand, getTileLabel } from "./parser";

export function createRenderer(config: RendererConfig): TileRenderer {
  const mode = config.mode ?? "inline";
  const styling = config.styling ?? "class";
  const cls = {
    tile: config.class?.tile ?? "mj-tile",
    tiles: config.class?.tiles ?? "mj-tiles",
    error: config.class?.error ?? "mj-tile-error",
  };

  const inlineStyles = {
    tile: "display:inline-block;width:32px;height:44px;vertical-align:middle",
    tiles: "display:inline-flex;gap:2px;align-items:center",
    error:
      "display:inline-block;padding:2px 4px;color:#dc2626;font-size:12px;background:#fef2f2;border-radius:2px",
  };

  function renderTileCode(code: TileCode): string {
    const label = getTileLabel(code);

    if (mode === "url" && config.assets.getUrl) {
      const url = config.assets.getUrl(code);
      if (styling === "inline") {
        return `<img style="${inlineStyles.tile}" src="${url}" alt="${label}" width="32" height="44" />`;
      }
      return `<img class="${cls.tile}" src="${url}" alt="${label}" width="32" height="44" />`;
    }

    const svg = config.assets.getSvg(code);
    if (!svg) {
      if (styling === "inline") {
        return `<span style="${inlineStyles.error}">[${label}]</span>`;
      }
      return `<span class="${cls.error}">[${label}]</span>`;
    }

    if (styling === "inline") {
      const svgWithAttrs = svg.replace(
        "<svg",
        `<svg aria-label="${label}" style="${inlineStyles.tile}"`,
      );
      return svgWithAttrs;
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
      if (!code) {
        if (styling === "inline") {
          return `<span style="${inlineStyles.error}">[${input}]</span>`;
        }
        return `<span class="${cls.error}">[${input}]</span>`;
      }
      return renderTileCode(code);
    },

    hand(input: string): string {
      const codes = parseHand(input);
      const rendered = codes.map(renderTileCode).join("");
      if (styling === "inline") {
        return `<span style="${inlineStyles.tiles}">${rendered}</span>`;
      }
      return `<span class="${cls.tiles}">${rendered}</span>`;
    },
  };
}
