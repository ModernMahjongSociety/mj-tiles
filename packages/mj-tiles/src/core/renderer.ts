import type { TileCode, RendererConfig, TileRenderer, TileState, MeldInfo, Hand } from "./types";
import { parseTile, parseHand, parseHandExtended, getTileLabel, getTileAriaLabel, getBackTileAriaLabel, getTileNumberAria, getTileSuitAria } from "./parser";

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
    tile: "display:inline-block;height:1.5em;width:auto;vertical-align:-0.3em",
    tiles: "display:inline-flex;gap:2px;align-items:center;vertical-align:-0.3em",
    error:
      "display:inline-block;padding:2px 4px;color:#dc2626;font-size:12px;background:#fef2f2;border-radius:2px",
    // 拡張機能用のインラインスタイル
    hand: "display:inline-flex;gap:8px;align-items:center;vertical-align:-0.3em",
    concealed: "display:inline-flex;gap:2px;align-items:center;vertical-align:-0.3em",
    melds: "display:inline-flex;gap:8px;align-items:center;vertical-align:-0.3em",
    meld: "display:inline-flex;gap:2px;align-items:center;vertical-align:-0.3em",
    rotated: "transform:rotate(90deg);transform-origin:center center",
    faceDown: "",
  };

  function renderTileCode(code: TileCode): string {
    const label = getTileLabel(code);

    if (mode === "url" && config.assets.getUrl) {
      const url = config.assets.getUrl(code);
      if (styling === "inline") {
        return `<img style="${inlineStyles.tile}" src="${url}" alt="" loading="lazy" />`;
      }
      return `<img class="${cls.tile}" src="${url}" alt="" loading="lazy" />`;
    }

    const svg = config.assets.getSvg(code);
    if (!svg) {
      // SVGがない場合、getUrlにフォールバック
      if (config.assets.getUrl) {
        const url = config.assets.getUrl(code);
        if (styling === "inline") {
          return `<img style="${inlineStyles.tile}" src="${url}" alt="" loading="lazy" />`;
        }
        return `<img class="${cls.tile}" src="${url}" alt="" loading="lazy" />`;
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
        `<svg aria-hidden="true" style="${inlineStyles.tile}"`,
      );
      return svgWithAttrs;
    }

    const svgWithAttrs = svg.replace(
      "<svg",
      `<svg aria-hidden="true" class="${cls.tile}"`,
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
        return `<img style="${finalStyle}" src="${url}" alt="" loading="lazy" />`;
      }
      return `<img class="${finalClasses.join(' ')}" src="${url}" alt="" loading="lazy" />`;
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
          return `<img style="${finalStyle}" src="${url}" alt="" loading="lazy" />`;
        }
        return `<img class="${finalClasses.join(' ')}" src="${url}" alt="" loading="lazy" />`;
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
        `<svg aria-hidden="true" style="${styleStr}"`,
      );
      return svgWithAttrs;
    }

    const svgWithAttrs = svg.replace(
      "<svg",
      `<svg aria-hidden="true" class="${classes.join(' ')}"`,
    );
    return svgWithAttrs;
  }

  // 副露のaria-labelを生成する関数
  function getMeldAriaLabel(meld: MeldInfo): string {
    const getTileLabel = (t: TileState) => t.isFaceDown ? getBackTileAriaLabel() : getTileAriaLabel(t.code);

    switch (meld.type) {
      case 'chii': {
        // チー: 「{鳴いた牌}をチー {数字1} {数字2} {数字3} {スート}」
        const calledTile = meld.tiles[meld.calledTileIndex ?? 0];
        const calledLabel = getTileLabel(calledTile);
        const numbers = meld.tiles.map(t => getTileNumberAria(t.code)).join(" ");
        const suit = getTileSuitAria(meld.tiles[0].code);
        return `${calledLabel}をチー ${numbers} ${suit}`;
      }
      case 'pon': {
        // ポン: 「{鳴いた牌}をポン」
        const calledTile = meld.tiles[meld.calledTileIndex ?? 0];
        const calledLabel = getTileLabel(calledTile);
        return `${calledLabel}をポン`;
      }
      case 'daiminkan': {
        // 大明槓: 「みんかん {牌}」
        const tileLabel = getTileLabel(meld.tiles[0]);
        return `みんかん ${tileLabel}`;
      }
      case 'ankan': {
        // 暗槓: 「あんかん {牌}」
        // 伏せ牌でない中央の牌からラベルを取得
        const visibleTile = meld.tiles.find(t => !t.isFaceDown) ?? meld.tiles[0];
        const tileLabel = getTileLabel(visibleTile);
        return `あんかん ${tileLabel}`;
      }
      case 'kakan': {
        // 加槓: 「かかん {牌}」
        const tileLabel = getTileLabel(meld.tiles[0]);
        return `かかん ${tileLabel}`;
      }
      default:
        return meld.tiles.map(getTileLabel).join(" ");
    }
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
  function renderHandExtended(hand: Hand, input: string): string {
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

    // ひらがな読み上げラベルを生成（門前牌 + 副露）
    const concealedLabels = hand.concealed.map(t => t.isFaceDown ? getBackTileAriaLabel() : getTileAriaLabel(t.code));
    const meldLabels = hand.melds.map(getMeldAriaLabel);
    const ariaLabel = [...concealedLabels, ...meldLabels].join(" ");

    const fallbackHtml = `<span class="mj-hand-fallback" aria-hidden="true">${input}</span>`;

    if (styling === "inline") {
      return `<span style="${inlineStyles.hand}" role="img" aria-label="${ariaLabel}">${parts.join("")}${fallbackHtml}</span>`;
    }

    return `<span class="${cls.hand}" role="img" aria-label="${ariaLabel}">${parts.join("")}${fallbackHtml}</span>`;
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
      const ariaLabel = getTileAriaLabel(code);
      const tileHtml = renderTileCode(code);
      const fallbackHtml = `<span class="mj-tile-fallback" aria-hidden="true">${input}</span>`;
      if (styling === "inline") {
        return `<span style="${inlineStyles.tile}" role="img" aria-label="${ariaLabel}">${tileHtml}${fallbackHtml}</span>`;
      }
      return `<span class="${cls.tile}-wrapper" role="img" aria-label="${ariaLabel}">${tileHtml}${fallbackHtml}</span>`;
    },

    hand(input: string): string {
      const codes = parseHand(input);
      const rendered = codes.map(renderTileCode).join("");
      const ariaLabel = codes.map(getTileAriaLabel).join(" ");
      const fallbackHtml = `<span class="mj-tiles-fallback" aria-hidden="true">${input}</span>`;
      if (styling === "inline") {
        return `<span style="${inlineStyles.tiles}" role="img" aria-label="${ariaLabel}">${rendered}${fallbackHtml}</span>`;
      }
      return `<span class="${cls.tiles}" role="img" aria-label="${ariaLabel}">${rendered}${fallbackHtml}</span>`;
    },

    // Phase 3: 拡張記法対応の手牌レンダリング
    handExtended(input: string): string {
      const hand = parseHandExtended(input);
      return renderHandExtended(hand, input);
    },
  };
}
