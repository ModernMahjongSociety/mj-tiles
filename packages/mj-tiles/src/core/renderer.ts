import type { TileCode, RendererConfig, TileRenderer, TileState, TileSize, MeldInfo, Hand } from "./types";
import { parseTile, parseHand, parseHandExtended, getTileLabel, getTileAriaLabel, getTileNumberAria, getTileSuitAria } from "./parser";

// 記法文字列は利用者入力がそのままHTMLに出るため、埋め込む前にエスケープする
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 1枚の牌をどう見せるか。アセットの解決結果を保持して、描画と読み上げラベルで使い回す
type TileVisual =
  | { kind: "image"; url: string; isPreRotated: boolean; size?: TileSize }
  | { kind: "svg"; markup: string }
  | { kind: "error"; label: string };

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
    rotatedImage: "mj-tile-rotated-image",
    faceDown: "mj-tile-facedown",
  };

  const inlineStyles = {
    tile: "display:inline-block;height:1.5em;width:auto;aspect-ratio:var(--mj-tile-aspect, 66 / 90);object-fit:contain;vertical-align:-0.3em",
    // 回転済み画像は縦横が逆なので、高さではなく幅を立て牌の高さに合わせる。
    // 差分ではなく tile の代わりに使う（キー名は cls と揃える必要がある）
    rotatedImage: "display:inline-block;width:1.5em;height:auto;aspect-ratio:calc(1 / (var(--mj-tile-aspect, 66 / 90)));object-fit:contain;vertical-align:-0.3em",
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

  type WrapperKey = keyof typeof cls;

  // styling によってラッパーの見た目指定が class と style に分かれる分岐をここに閉じ込める
  function wrapSpan(
    key: WrapperKey,
    content: string,
    options: { extraClass?: string; attributes?: string } = {},
  ): string {
    const presentation = styling === "inline"
      ? `style="${inlineStyles[key]}"`
      : `class="${[cls[key], options.extraClass].filter(Boolean).join(" ")}"`;
    return `<span ${presentation}${options.attributes ?? ""}>${content}</span>`;
  }

  // 画面のエラー表示と読み上げで同じ文字列を使うため、書式はここだけで決める
  function errorLabel(text: string): string {
    return `[${text}]`;
  }

  // 描画できない牌をHTMLに出す唯一の場所。エスケープはHTMLに出す時点で行う
  function renderError(label: string): string {
    return wrapSpan("error", escapeHtml(label));
  }

  function tileStateCode(tile: TileState): TileCode | 'back' {
    return tile.isFaceDown ? 'back' : tile.code;
  }

  // アセットの解決は getSvg / getUrl の呼び出しを伴うため、1枚につき1回ずつに抑える。
  // mode で優先順位が変わるだけで、試す手段と打ち切り方は同じ。
  // 8z のように実在しない牌はどちらも返らないので、ここでエラー表示に落ちる
  function resolveTileVisual(tile: TileState): TileVisual {
    const code = tileStateCode(tile);

    const resolveSvg = (): TileVisual | null => {
      const svg = config.assets.getSvg(code);
      return svg ? { kind: "svg", markup: svg } : null;
    };
    const resolveUrl = (): TileVisual | null => {
      // 横向き専用の画像が無いアセットもあるため、無ければ通常の画像をCSSで回して使う。
      // 寸法は実際に選んだ画像に合わせて引く。要求した向きで引くと縦横が入れ替わる
      if (tile.isRotated) {
        const rotatedUrl = config.assets.getUrl?.(code, true);
        if (rotatedUrl) {
          return {
            kind: "image",
            url: rotatedUrl,
            isPreRotated: true,
            size: config.assets.getSize?.(code, true),
          };
        }
      }
      const url = config.assets.getUrl?.(code);
      return url
        ? { kind: "image", url, isPreRotated: false, size: config.assets.getSize?.(code) }
        : null;
    };

    const visual = mode === "url" ? resolveUrl() ?? resolveSvg() : resolveSvg() ?? resolveUrl();
    if (visual) return visual;

    return { kind: "error", label: errorLabel(getTileLabel(code)) };
  }

  // ariaLabel を渡さない牌は、まとまりの aria-label で読まれるため読み上げから隠す
  function renderTileVisual(visual: TileVisual, tile: TileState, ariaLabel?: string): string {
    if (visual.kind === "error") return renderError(visual.label);

    // 回転済みの画像が使えたときだけCSSでの回転が不要になる
    const rotateWithCss = tile.isRotated === true && (visual.kind === "svg" || !visual.isPreRotated);
    // 回転済み画像は 90x66 のように縦横が入れ替わっているので、
    // 立て牌と同じ高さで描くと 1 枚だけ巨大になる。寸法の指定し直しが要る
    const isPreRotatedImage = tile.isRotated === true && visual.kind === "image" && visual.isPreRotated;
    const classes = [cls.tile];
    if (rotateWithCss) classes.push(cls.rotated);
    if (isPreRotatedImage) classes.push(cls.rotatedImage);
    if (tile.isFaceDown) classes.push(cls.faceDown);
    const baseInlineStyle = isPreRotatedImage ? inlineStyles.rotatedImage : inlineStyles.tile;
    const presentation = styling === "inline"
      ? `style="${baseInlineStyle}${rotateWithCss ? `;${inlineStyles.rotated}` : ""}"`
      : `class="${classes.join(' ')}"`;

    if (visual.kind === "image") {
      // 遅延読み込みの画像は実寸が無いとレイアウトがずれるため、分かる場合は必ず出す
      const dimensions = visual.size
        ? ` width="${visual.size.width}" height="${visual.size.height}"`
        : "";
      return `<img ${presentation} src="${visual.url}"${dimensions} alt="${ariaLabel ?? ""}" loading="lazy" />`;
    }

    const accessibility = ariaLabel === undefined
      ? 'aria-hidden="true"'
      : `role="img" aria-label="${ariaLabel}"`;
    return visual.markup.replace("<svg", `<svg ${accessibility} ${presentation}`);
  }

  // 牌の並びをHTMLと読み上げラベルに変換する。
  // まとまりに aria-label を付けると子要素は読み上げから外れるため、
  // 描画できなかった牌は画面に出るエラー表示と同じ文字列をラベルに含める
  function renderTileSequence(tiles: TileState[]): {
    html: string;
    labels: string[];
    allRendered: boolean;
  } {
    const visuals = tiles.map(resolveTileVisual);
    return {
      html: visuals.map((visual, index) => renderTileVisual(visual, tiles[index])).join(""),
      labels: visuals.map((visual, index) =>
        visual.kind === "error" ? visual.label : getTileAriaLabel(tileStateCode(tiles[index])),
      ),
      allRendered: visuals.every(visual => visual.kind !== "error"),
    };
  }

  // 名前のない role="img" は accname 違反になるため、ラベルが空なら属性ごと省く
  function groupAccessibility(ariaLabel: string): string {
    return ariaLabel === "" ? "" : ` role="img" aria-label="${ariaLabel}"`;
  }

  // 副露のaria-labelを生成する関数
  function getMeldAriaLabel(meld: MeldInfo): string {
    // MeldInfo は公開型なので、パーサ以外が組み立てた欠けた面子も受け取りうる
    const calledTile = meld.tiles[meld.calledTileIndex ?? 0];
    if (!calledTile) return "";
    const calledLabel = getTileAriaLabel(tileStateCode(calledTile));

    switch (meld.type) {
      case 'chii': {
        // 伏せ牌は数字を読まない。スートも表向きの牌から取る
        const numbers = meld.tiles
          .map(t => (t.isFaceDown ? getTileAriaLabel('back') : getTileNumberAria(t.code)))
          .join(" ");
        // 表向きの牌が1枚も無ければスートも伏せられている扱いにする
        const suitSource = meld.tiles.find(t => !t.isFaceDown);
        const suit = suitSource ? ` ${getTileSuitAria(suitSource.code)}` : "";
        return `${calledLabel}をチーして ${numbers}${suit}`;
      }
      case 'pon':
        return `${calledLabel}をポン`;
      case 'daiminkan':
        return `みんかん ${calledLabel}`;
      case 'kakan':
        return `かかん ${calledLabel}`;
      case 'ankan': {
        // 暗槓には鳴いた牌が無いので、見えている牌から代表を選ぶ。
        // 赤五が見えていれば得点に関わるため、それを優先して読む
        const faceUpTiles = meld.tiles.filter(t => !t.isFaceDown);
        const visibleTile =
          faceUpTiles.find(t => t.code.startsWith('0')) ?? faceUpTiles[0] ?? calledTile;
        return `あんかん ${getTileAriaLabel(tileStateCode(visibleTile))}`;
      }
      default: {
        // MeldTypeを増やしたときに読み上げの追従漏れをコンパイルエラーにする
        const unhandled: never = meld.type;
        return unhandled;
      }
    }
  }

  // Phase 3: MeldInfoをレンダリングする関数
  function renderMeld(meld: MeldInfo): { html: string; label: string } {
    const { html, labels, allRendered } = renderTileSequence(meld.tiles);
    return {
      html: wrapSpan("meld", html, {
        extraClass: `mj-meld-${meld.type}`,
        attributes: styling === "inline" ? ` data-meld-type="${meld.type}"` : "",
      }),
      // 描画できない牌があると鳴きの形が伝わらないため、牌ごとの読みに切り替える
      label: allRendered ? getMeldAriaLabel(meld) : labels.join(" "),
    };
  }

  // Phase 3: Hand全体をレンダリングする関数
  function renderHandExtended(hand: Hand): string {
    const concealed = renderTileSequence(hand.concealed);
    const melds = hand.melds.map(renderMeld);

    const parts = [
      hand.concealed.length > 0 ? wrapSpan("concealed", concealed.html) : "",
      melds.length > 0 ? wrapSpan("melds", melds.map(meld => meld.html).join("")) : "",
    ].filter(part => part.length > 0);

    const ariaLabel = [...concealed.labels, ...melds.map(meld => meld.label)]
      .filter(label => label !== "")
      .join(" ");

    return wrapSpan("hand", parts.join(""), { attributes: groupAccessibility(ariaLabel) });
  }

  return {
    tile(input: string): string {
      const code = parseTile(input);
      if (!code) return renderError(errorLabel(input));

      const tile: TileState = { code };
      return renderTileVisual(resolveTileVisual(tile), tile, getTileAriaLabel(code));
    },

    hand(input: string): string {
      const { html, labels } = renderTileSequence(parseHand(input).map(code => ({ code })));
      return wrapSpan("tiles", html, { attributes: groupAccessibility(labels.join(" ")) });
    },

    // Phase 3: 拡張記法対応の手牌レンダリング
    handExtended(input: string): string {
      try {
        return renderHandExtended(parseHandExtended(input));
      } catch {
        // 各フレームワークのラッパーは例外を捕まえないので、記法エラーで
        // ページ全体を落とさず tile() と同じエラー表示に落とす
        return renderError(errorLabel(input));
      }
    },
  };
}
