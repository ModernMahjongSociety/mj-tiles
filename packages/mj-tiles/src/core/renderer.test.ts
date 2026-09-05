import { describe, test, expect } from "bun:test";
import { createRenderer } from "./renderer";
import type { TileAssets } from "./types";

const mockAssets: TileAssets = {
  getSvg: (code) => `<svg>${code}</svg>`,
};

describe("createRenderer", () => {
  test("単一牌をレンダリング (inline mode)", () => {
    const renderer = createRenderer({ assets: mockAssets });
    const html = renderer.tile("1m");
    expect(html).toContain('<svg role="img" aria-label="いー まん" class="mj-tile">');
    expect(html).toContain("1m</svg>");
  });

  test("手牌をレンダリング", () => {
    const renderer = createRenderer({ assets: mockAssets });
    const html = renderer.hand("123m");
    expect(html).toContain('<span class="mj-tiles" role="img" aria-label="いー まん りゃん まん さん まん">');
    expect(html).toContain("1m</svg>");
    expect(html).toContain("2m</svg>");
    expect(html).toContain("3m</svg>");
  });

  test("字牌をレンダリング", () => {
    const renderer = createRenderer({ assets: mockAssets });
    const html = renderer.tile("東");
    expect(html).toContain('<svg role="img" aria-label="とん" class="mj-tile">');
  });

  test("不正な入力でエラー表示", () => {
    const renderer = createRenderer({ assets: mockAssets });
    const html = renderer.tile("invalid");
    expect(html).toContain('<span class="mj-tile-error">[invalid]</span>');
  });

  test("存在しない牌でエラー表示", () => {
    const limitedAssets: TileAssets = {
      getSvg: () => null,
    };
    const renderer = createRenderer({ assets: limitedAssets });
    const html = renderer.tile("1m");
    expect(html).toContain('<span class="mj-tile-error">[1m]</span>');
  });

  test("カスタムクラス名", () => {
    const renderer = createRenderer({
      assets: mockAssets,
      class: {
        tile: "custom-tile",
        tiles: "custom-tiles",
        error: "custom-error",
      },
    });
    const html = renderer.tile("1m");
    expect(html).toContain('class="custom-tile"');
  });

  test("URL mode", () => {
    const urlAssets: TileAssets = {
      getSvg: () => null,
      getUrl: (code) => `/tiles/${code}.svg`,
    };
    const renderer = createRenderer({ assets: urlAssets, mode: "url" });
    const html = renderer.tile("1m");
    expect(html).toContain('<img class="mj-tile" src="/tiles/1m.svg"');
    expect(html).toContain('alt="いー まん"');
  });

  describe("styling: inline mode", () => {
    test("単一牌にインラインスタイルを適用", () => {
      const renderer = createRenderer({
        assets: mockAssets,
        styling: "inline",
      });
      const html = renderer.tile("1m");
      expect(html).toContain(
        '<svg role="img" aria-label="いー まん" style="display:inline-block;height:1.5em;width:auto;vertical-align:-0.3em">',
      );
      expect(html).not.toContain('class="mj-tile"');
    });

    test("手牌にインラインスタイルを適用", () => {
      const renderer = createRenderer({
        assets: mockAssets,
        styling: "inline",
      });
      const html = renderer.hand("123m");
      expect(html).toContain(
        '<span style="display:inline-flex;gap:2px;align-items:center;vertical-align:-0.3em" role="img" aria-label="いー まん りゃん まん さん まん">',
      );
      expect(html).not.toContain('class="mj-tiles"');
    });

    test("不正な入力でインラインスタイルのエラー表示", () => {
      const renderer = createRenderer({
        assets: mockAssets,
        styling: "inline",
      });
      const html = renderer.tile("invalid");
      expect(html).toContain(
        '<span style="display:inline-block;padding:2px 4px;color:#dc2626;font-size:12px;background:#fef2f2;border-radius:2px">[invalid]</span>',
      );
      expect(html).not.toContain('class="mj-tile-error"');
    });

    test("存在しない牌でインラインスタイルのエラー表示", () => {
      const limitedAssets: TileAssets = {
        getSvg: () => null,
      };
      const renderer = createRenderer({
        assets: limitedAssets,
        styling: "inline",
      });
      const html = renderer.tile("1m");
      expect(html).toContain(
        '<span style="display:inline-block;padding:2px 4px;color:#dc2626;font-size:12px;background:#fef2f2;border-radius:2px">[1m]</span>',
      );
    });

    test("URL mode + inline styling", () => {
      const urlAssets: TileAssets = {
        getSvg: () => null,
        getUrl: (code) => `/tiles/${code}.svg`,
      };
      const renderer = createRenderer({
        assets: urlAssets,
        mode: "url",
        styling: "inline",
      });
      const html = renderer.tile("1m");
      expect(html).toContain(
        '<img style="display:inline-block;height:1.5em;width:auto;vertical-align:-0.3em"',
      );
      expect(html).toContain('src="/tiles/1m.svg"');
      expect(html).toContain('alt="いー まん"');
      expect(html).not.toContain('class="mj-tile"');
    });

    test("styling未指定時はデフォルトでclassを使用（後方互換性）", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.tile("1m");
      expect(html).toContain('class="mj-tile"');
      expect(html).not.toContain('style="');
    });
  });

  describe("アクセシビリティ", () => {
    test("手牌グループにひらがなラベルが設定される", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.hand("123m東");
      expect(html).toContain('role="img"');
      expect(html).toContain('aria-label="いー まん りゃん まん さん まん とん"');
    });

    test("記法文字列はHTMLに出力されない", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.hand('1m<img src=x onerror="alert(1)">');
      expect(html).not.toContain("<img");
      expect(html).not.toContain("onerror");
    });

    test("不正な入力のエラー表示はエスケープされる", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.tile('<img src=x onerror="alert(1)">');
      expect(html).toBe(
        '<span class="mj-tile-error">[&lt;img src=x onerror=&quot;alert(1)&quot;&gt;]</span>',
      );
    });

    test("牌が1枚もない場合はrole=\"img\"を付けない", () => {
      const renderer = createRenderer({ assets: mockAssets });
      expect(renderer.hand("")).toBe('<span class="mj-tiles"></span>');
      expect(renderer.hand("xyz")).toBe('<span class="mj-tiles"></span>');
      expect(renderer.handExtended("")).toBe('<span class="mj-hand"></span>');
    });

    test("実在しない牌は画像が無いためエラー表示になる", () => {
      // 既定のアセットと同じく、存在しない牌にはURLを返さない
      const renderer = createRenderer({
        assets: {
          getSvg: () => null,
          getUrl: (code) => (code === "1z" ? "/tiles/1z.webp" : undefined),
        },
        mode: "url",
      });
      const html = renderer.hand("18z");
      expect(html).toContain('<img class="mj-tile" src="/tiles/1z.webp"');
      expect(html).toContain('<span class="mj-tile-error">[8z]</span>');
      expect(html).toContain('aria-label="とん [8z]"');
      expect(renderer.tile("8z")).toBe('<span class="mj-tile-error">[8z]</span>');
    });

    test("描画できない牌はエラー表示と同じ文字列を読み上げに含める", () => {
      const renderer = createRenderer({
        assets: { getSvg: (code) => (code === "5m" ? null : `<svg>${code}</svg>`) },
      });
      const html = renderer.hand("456m");
      expect(html).toContain('aria-label="すー まん [5m] ろー まん"');
      expect(html).toContain('<span class="mj-tile-error">[5m]</span>');
      // 描画できた牌はまとまりのラベルで読まれるため、個別には読み上げない
      expect(html.match(/<svg aria-hidden="true"/g)).toHaveLength(2);
    });

    test("横向き専用の画像が無いアセットではCSSで回転させる", () => {
      const renderer = createRenderer({
        assets: {
          getSvg: () => null,
          getUrl: (code, isRotated) => (isRotated ? undefined : `/tiles/${code}.webp`),
        },
        mode: "url",
      });
      const html = renderer.handExtended("5y55p");
      expect(html).toContain('<img class="mj-tile mj-tile-rotated" src="/tiles/5p.webp"');
      expect(html).not.toContain("mj-tile-error");
      expect(html).toContain('aria-label="うー ぴんをポン"');
    });

    test("アセットが1つも無い場合もエラー表示を読み上げる", () => {
      const renderer = createRenderer({ assets: { getSvg: () => null } });
      expect(renderer.tile("1m")).toBe('<span class="mj-tile-error">[1m]</span>');
      expect(renderer.hand("12m")).toContain('aria-label="[1m] [2m]"');
      expect(renderer.handExtended("1-11m")).toContain('aria-label="[1m] [1m] [1m]"');
    });

    test("赤ドラのひらがなラベル", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.hand("0m");
      expect(html).toContain('aria-label="あか うー まん"');
    });

    test("筒子のひらがなラベル", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.hand("19p");
      expect(html).toContain('aria-label="いー ぴん きゅー ぴん"');
    });

    test("索子のひらがなラベル", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.hand("19s");
      expect(html).toContain('aria-label="いー そー きゅー そー"');
    });

    test("字牌のひらがなラベル", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.hand("1234567z");
      expect(html).toContain('aria-label="とん なん しゃー ぺー はく はつ ちゅん"');
    });

    test("個別の牌画像にはalt=\"\"が設定される（URL mode）", () => {
      const urlAssets: TileAssets = {
        getSvg: () => null,
        getUrl: (code) => `/tiles/${code}.svg`,
      };
      const renderer = createRenderer({ assets: urlAssets, mode: "url" });
      const html = renderer.hand("1m");
      expect(html).toContain('<img class="mj-tile" src="/tiles/1m.svg" alt=""');
    });

    test("個別の牌画像にはaria-hidden=\"true\"が設定される（SVG mode）", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.hand("1m");
      expect(html).toContain('<svg aria-hidden="true" class="mj-tile">');
    });

    test("単一牌はSVG自体にrole=\"img\"とaria-labelが設定される", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.tile("1m");
      expect(html).toBe('<svg role="img" aria-label="いー まん" class="mj-tile">1m</svg>');
    });

    test("伏せ牌は「えっくす」と読み上げられる", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.handExtended("o1m");
      expect(html).toContain("えっくす");
    });
  });

  describe("副露の読み上げ", () => {
    test("チーの読み上げ", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.handExtended("1-23m");
      expect(html).toContain("いー まんをチーして いち に さん まん");
    });

    test("ポンの読み上げ", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.handExtended("1-11m");
      expect(html).toContain("いー まんをポン");
    });

    test("暗槓の読み上げ", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.handExtended("1+111m");
      expect(html).toContain("あんかん いー まん");
    });

    test("大明槓の読み上げ", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.handExtended("1-111m");
      expect(html).toContain("みんかん いー まん");
    });

    test("加槓の読み上げ", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.handExtended("1-1=11m");
      expect(html).toContain("かかん いー まん");
    });

    test("赤五を含むチーは数字も読む", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.handExtended("4-06s");
      expect(html).toContain('aria-label="すー そーをチーして よん あか ご ろく そー"');
    });

    test("ポン・大明槓・加槓は鳴いた牌を読む", () => {
      const renderer = createRenderer({ assets: mockAssets });
      expect(renderer.handExtended("0-55m")).toContain('aria-label="あか うー まんをポン"');
      expect(renderer.handExtended("550-5m")).toContain('aria-label="みんかん あか うー まん"');
      expect(renderer.handExtended("0-555m")).toContain('aria-label="みんかん あか うー まん"');
      expect(renderer.handExtended("0-5=55m")).toContain('aria-label="かかん あか うー まん"');
    });

    test("全ての牌が伏せの暗槓は牌の正体を読み上げない", () => {
      const renderer = createRenderer({ assets: mockAssets });
      expect(renderer.handExtended("o5o5o5o5m")).toContain('aria-label="あんかん えっくす"');
    });

    test("暗槓の中で表向きの赤五は赤として読まれる", () => {
      const renderer = createRenderer({ assets: mockAssets });
      expect(renderer.handExtended("5+505m")).toContain('aria-label="あんかん あか うー まん"');
    });

    test("牌画作成くん方式の下家ポン（555yp）でも読み上げできる", () => {
      const renderer = createRenderer({ assets: mockAssets });
      expect(renderer.handExtended("555yp")).toContain('aria-label="うー ぴんをポン"');
      // 55py は牌が2枚しかない壊れた記法。読み上げ内容は保証しないが、落ちないことは保証する
      expect(renderer.handExtended("55py")).not.toContain("mj-tile-error");
    });
  });
});
