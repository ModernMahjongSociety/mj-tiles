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
    expect(html).toContain('<svg aria-label="1m" class="mj-tile">');
    expect(html).toContain("1m</svg>");
  });

  test("手牌をレンダリング", () => {
    const renderer = createRenderer({ assets: mockAssets });
    const html = renderer.hand("123m");
    expect(html).toContain('<span class="mj-tiles">');
    expect(html).toContain("1m</svg>");
    expect(html).toContain("2m</svg>");
    expect(html).toContain("3m</svg>");
  });

  test("字牌をレンダリング", () => {
    const renderer = createRenderer({ assets: mockAssets });
    const html = renderer.tile("東");
    expect(html).toContain('<svg aria-label="東" class="mj-tile">');
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
    expect(html).toContain('alt="1m"');
  });

  describe("styling: inline mode", () => {
    test("単一牌にインラインスタイルを適用", () => {
      const renderer = createRenderer({
        assets: mockAssets,
        styling: "inline",
      });
      const html = renderer.tile("1m");
      expect(html).toContain(
        '<svg aria-label="1m" style="display:inline-block;height:1.5em;width:auto;vertical-align:-0.3em">',
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
        '<span style="display:inline-flex;gap:2px;align-items:center;vertical-align:-0.3em">',
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
      expect(html).not.toContain('class="mj-tile"');
    });

    test("styling未指定時はデフォルトでclassを使用（後方互換性）", () => {
      const renderer = createRenderer({ assets: mockAssets });
      const html = renderer.tile("1m");
      expect(html).toContain('class="mj-tile"');
      expect(html).not.toContain('style="');
    });
  });
});
