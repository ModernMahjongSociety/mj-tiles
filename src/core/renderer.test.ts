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
});
