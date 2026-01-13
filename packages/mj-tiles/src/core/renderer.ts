import type { TileCode, RendererConfig, TileRenderer, TileState, MeldInfo, Hand } from "./types";
import { parseTile, parseHand, parseHandExtended, getTileLabel } from "./parser";

export function createRenderer(config: RendererConfig): TileRenderer {
  const mode = config.mode ?? "inline";
  const styling = config.styling ?? "class";
  const cls = {
    tile: config.class?.tile ?? "mj-tile",
    tiles: config.class?.tiles ?? "mj-tiles",
    error: config.class?.error ?? "mj-tile-error",
    // 拡張機能用のCSSクラス
    hand: "mj-hand",
    concealed: "mj-hand-concealed",
    melds: "mj-hand-melds",
    meld: "mj-meld",
    rotated: "mj-tile-rotated",
    faceDown: "mj-tile-facedown",
  };

  const inlineStyles = {
    tile: "display:inline-block;width:32px;height:44px;vertical-align:middle",
    tiles: "display:inline-flex;gap:2px;align-items:center",
    error:
      "display:inline-block;padding:2px 4px;color:#dc2626;font-size:12px;background:#fef2f2;border-radius:2px",
    // 拡張機能用のインラインスタイル
    hand: "display:flex;gap:8px;align-items:center",
    concealed: "display:inline-flex;gap:2px;align-items:center",
    melds: "display:inline-flex;gap:8px;align-items:center",
    meld: "display:inline-flex;gap:2px;align-items:center",
    rotated: "transform:rotate(90deg);transform-origin:center center",
    faceDown: "",
  };

  function renderTileCode(code: TileCode): string {
    const label = getTileLabel(code);

    if (mode === "url" && config.assets.getUrl) {
      const url = config.assets.getUrl(code);
      if (styling === "inline") {
        return `<img style="${inlineStyles.tile}" src="${url}" alt="${label}" width="32" height="44" loading="lazy" />`;
      }
      return `<img class="${cls.tile}" src="${url}" alt="${label}" width="32" height="44" loading="lazy" />`;
    }

    const svg = config.assets.getSvg(code);
    if (!svg) {
      // SVGがない場合、getUrlにフォールバック
      if (config.assets.getUrl) {
        const url = config.assets.getUrl(code);
        if (styling === "inline") {
          return `<img style="${inlineStyles.tile}" src="${url}" alt="${label}" width="32" height="44" loading="lazy" />`;
        }
        return `<img class="${cls.tile}" src="${url}" alt="${label}" width="32" height="44" loading="lazy" />`;
      }
      // SVGもURLもない場合、エラー表示
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

  // Phase 3: TileStateをレンダリングする関数
  function renderTileState(tile: TileState): string {
    const code = tile.isFaceDown ? 'back' : tile.code;
    const label = tile.isFaceDown ? '裏' : getTileLabel(tile.code);

    // CSSクラスを組み立て
    const classes: string[] = [cls.tile];
    if (tile.isRotated) classes.push(cls.rotated);
    if (tile.isFaceDown) classes.push(cls.faceDown);

    // インラインスタイルを組み立て
    let styleStr = inlineStyles.tile;
    if (tile.isRotated) {
      styleStr += `;${inlineStyles.rotated}`;
    }

    if (mode === "url" && config.assets.getUrl) {
      const url = config.assets.getUrl(code as TileCode | 'back', tile.isRotated);
      // 横向き画像を使用する場合、CSSのrotatedクラスは不要
      const finalClasses = tile.isRotated
        ? [cls.tile, tile.isFaceDown ? cls.faceDown : ''].filter(Boolean)
        : classes;

      if (styling === "inline") {
        // 横向き画像を使用する場合、CSS rotateは不要
        const finalStyle = tile.isRotated ? inlineStyles.tile : styleStr;
        return `<img style="${finalStyle}" src="${url}" alt="${label}" width="32" height="44" loading="lazy" />`;
      }
      return `<img class="${finalClasses.join(' ')}" src="${url}" alt="${label}" width="32" height="44" loading="lazy" />`;
    }

    const svg = config.assets.getSvg(code as TileCode | 'back');
    if (!svg) {
      // SVGがない場合、getUrlにフォールバック
      if (config.assets.getUrl) {
        const url = config.assets.getUrl(code as TileCode | 'back', tile.isRotated);
        // 横向き画像を使用する場合、CSSのrotatedクラスは不要
        const finalClasses = tile.isRotated
          ? [cls.tile, tile.isFaceDown ? cls.faceDown : ''].filter(Boolean)
          : classes;
        const finalStyle = tile.isRotated ? inlineStyles.tile : styleStr;

        if (styling === "inline") {
          return `<img style="${finalStyle}" src="${url}" alt="${label}" width="32" height="44" loading="lazy" />`;
        }
        return `<img class="${finalClasses.join(' ')}" src="${url}" alt="${label}" width="32" height="44" loading="lazy" />`;
      }
      // SVGもURLもない場合、エラー表示
      if (styling === "inline") {
        return `<span style="${inlineStyles.error}">[${label}]</span>`;
      }
      return `<span class="${cls.error}">[${label}]</span>`;
    }

    if (styling === "inline") {
      const svgWithAttrs = svg.replace(
        "<svg",
        `<svg aria-label="${label}" style="${styleStr}"`,
      );
      return svgWithAttrs;
    }

    const svgWithAttrs = svg.replace(
      "<svg",
      `<svg aria-label="${label}" class="${classes.join(' ')}"`,
    );
    return svgWithAttrs;
  }

  // Phase 3: MeldInfoをレンダリングする関数
  function renderMeld(meld: MeldInfo): string {
    const tilesHtml = meld.tiles.map(renderTileState).join("");

    if (styling === "inline") {
      return `<span style="${inlineStyles.meld}" data-meld-type="${meld.type}">${tilesHtml}</span>`;
    }

    return `<span class="${cls.meld} mj-meld-${meld.type}">${tilesHtml}</span>`;
  }

  // Phase 3: Hand全体をレンダリングする関数
  function renderHandExtended(hand: Hand): string {
    const concealedHtml = hand.concealed.length > 0
      ? (styling === "inline"
          ? `<span style="${inlineStyles.concealed}">${hand.concealed.map(renderTileState).join("")}</span>`
          : `<span class="${cls.concealed}">${hand.concealed.map(renderTileState).join("")}</span>`)
      : "";

    const meldsHtml = hand.melds.length > 0
      ? (styling === "inline"
          ? `<span style="${inlineStyles.melds}">${hand.melds.map(renderMeld).join("")}</span>`
          : `<span class="${cls.melds}">${hand.melds.map(renderMeld).join("")}</span>`)
      : "";

    const parts = [concealedHtml, meldsHtml].filter(p => p.length > 0);

    if (styling === "inline") {
      return `<span style="${inlineStyles.hand}">${parts.join("")}</span>`;
    }

    return `<span class="${cls.hand}">${parts.join("")}</span>`;
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

    // Phase 3: 拡張記法対応の手牌レンダリング
    handExtended(input: string): string {
      const hand = parseHandExtended(input);
      return renderHandExtended(hand);
    },
  };
}
