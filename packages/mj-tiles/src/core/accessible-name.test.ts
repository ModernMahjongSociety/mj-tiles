/**
 * 仕様準拠の回帰テスト
 *
 * renderer.test.ts / aria-label.test.ts が「属性が正しく書けているか」を
 * 文字列として検証するのに対し、このテストは実装が出力するHTMLを W3C の
 * Accessible Name and Description Computation (accname) アルゴリズムに
 * 実際にかけ、スクリーンリーダーが読み上げる文字列そのものを検証する。
 *
 * 読みの文言や属性の有無は上記2ファイルが押さえているので、
 * ここでは「出力構造 × accname」だけを対象にする。
 */
import { describe, test, expect } from "bun:test";
import { JSDOM } from "jsdom";
import { computeAccessibleName } from "dom-accessibility-api";
import { createRenderer } from "./renderer";
import type { TileAssets } from "./types";

const svgAssets: TileAssets = {
  getSvg: (code) => `<svg>${code}</svg>`,
};

const urlAssets: TileAssets = {
  getSvg: () => null,
  getUrl: (code) => `/tiles/${code}.svg`,
};

const dom = new JSDOM(`<!doctype html><body></body>`);
const container = dom.window.document.body;

// getComputedStyle を渡せばライブラリはグローバルを参照しない。
// window や Element をグローバルに生やすと、同一プロセスで走る他のテストへ漏れる
const accnameOptions = { getComputedStyle: dom.window.getComputedStyle };

function nameOf(element: Element | null): string {
  if (!element) throw new Error("要素が見つかりません");
  return computeAccessibleName(element as unknown as Element, accnameOptions);
}

/** HTML をパースして、ルート要素のアクセシブル名を計算する */
function accessibleNameOf(html: string): string {
  container.innerHTML = html;
  return nameOf(container.firstElementChild);
}

// 出力構造は styling（class / inline）と mode（SVG / URL）の組み合わせで変わる。
// どの構造でも accname が同じ結果になることが、この層の検証対象
const renderers = [
  ["class + SVG", createRenderer({ assets: svgAssets })],
  ["inline + SVG", createRenderer({ assets: svgAssets, styling: "inline" })],
  ["class + URL", createRenderer({ assets: urlAssets, mode: "url" })],
  [
    "inline + URL",
    createRenderer({ assets: urlAssets, mode: "url", styling: "inline" }),
  ],
] as const;

describe("出力構造ごとのアクセシブル名", () => {
  test.each(renderers)("%s: 単一牌は画像自体が名前を持つ", (_label, renderer) => {
    expect(accessibleNameOf(renderer.tile("1m"))).toBe("いー まん");
  });

  test.each(renderers)("%s: 手牌はまとまりが1つの名前になる", (_label, renderer) => {
    expect(accessibleNameOf(renderer.hand("123m"))).toBe(
      "いー まん りゃん まん さん まん",
    );
  });

  test.each(renderers)("%s: 副露は入れ子をまたいで1つの名前になる", (_label, renderer) => {
    expect(accessibleNameOf(renderer.handExtended("1-23m"))).toBe(
      "いー まんをチーして いち に さん まん",
    );
  });

  test.each(renderers)("%s: 門前牌と副露の組み合わせ", (_label, renderer) => {
    expect(accessibleNameOf(renderer.handExtended("123m 1-11p"))).toBe(
      "いー まん りゃん まん さん まん いー ぴんをポン",
    );
  });
});

describe("まとまりの中の個別の牌は名前を持たない", () => {
  // 子が名前を持つと、まとまりの読みに続けて牌が二重に読まれる
  test.each(renderers)("%s: 子要素のアクセシブル名は空", (_label, renderer) => {
    container.innerHTML = renderer.hand("123m");
    const tiles = [...container.querySelectorAll("svg, img")];

    expect(tiles).toHaveLength(3);
    for (const tile of tiles) {
      expect(nameOf(tile)).toBe("");
    }
  });
});

describe("描画できない牌", () => {
  // エラー表示は画面に文字が出るため aria-hidden にできない。
  // まとまりの aria-label が優先され二重に読まれないことを確かめる
  test("画面のエラー表示は読み上げに重複しない", () => {
    const renderer = createRenderer({
      assets: { getSvg: (code) => (code === "5m" ? null : `<svg>${code}</svg>`) },
    });
    const html = renderer.hand("456m");

    container.innerHTML = html;
    expect(container.textContent).toBe("4m[5m]6m");
    expect(nameOf(container.firstElementChild)).toBe("すー まん [5m] ろー まん");
  });

  test("アセットが1つも無い場合もエラー表示が読み上げられる", () => {
    const renderer = createRenderer({ assets: { getSvg: () => null } });
    expect(accessibleNameOf(renderer.hand("12m"))).toBe("[1m] [2m]");
  });
});
