import { describe, test, expect } from "bun:test";
import { createRenderer } from "./renderer";
import { getTileAriaLabel, getTileNumberAria, getTileSuitAria } from "./parser";
import type { TileAssets, TileCode } from "./types";

const mockAssets: TileAssets = {
  getSvg: (code) => `<svg>${code}</svg>`,
};

const renderer = createRenderer({ assets: mockAssets });

/** role="img" が付いた要素の aria-label を取り出す */
function ariaLabelOf(html: string): string {
  const match = html.match(/role="img" aria-label="([^"]*)"/);
  if (!match) throw new Error(`aria-label が見つかりません: ${html}`);
  return match[1];
}

describe("getTileAriaLabel（牌単体の読み）", () => {
  describe("萬子", () => {
    test.each([
      ["1m", "いー まん"],
      ["2m", "りゃん まん"],
      ["3m", "さん まん"],
      ["4m", "すー まん"],
      ["5m", "うー まん"],
      ["6m", "ろー まん"],
      ["7m", "ちー まん"],
      ["8m", "ぱー まん"],
      ["9m", "きゅー まん"],
      ["0m", "あか うー まん"],
    ])("%s → %s", (code, expected) => {
      expect(getTileAriaLabel(code as TileCode)).toBe(expected);
    });
  });

  describe("筒子", () => {
    test.each([
      ["1p", "いー ぴん"],
      ["2p", "りゃん ぴん"],
      ["3p", "さん ぴん"],
      ["4p", "すー ぴん"],
      ["5p", "うー ぴん"],
      ["6p", "ろー ぴん"],
      ["7p", "ちー ぴん"],
      ["8p", "ぱー ぴん"],
      ["9p", "きゅー ぴん"],
      ["0p", "あか うー ぴん"],
    ])("%s → %s", (code, expected) => {
      expect(getTileAriaLabel(code as TileCode)).toBe(expected);
    });
  });

  describe("索子", () => {
    test.each([
      ["1s", "いー そー"],
      ["2s", "りゃん そー"],
      ["3s", "さん そー"],
      ["4s", "すー そー"],
      ["5s", "うー そー"],
      ["6s", "ろー そー"],
      ["7s", "ちー そー"],
      ["8s", "ぱー そー"],
      ["9s", "きゅー そー"],
      ["0s", "あか うー そー"],
    ])("%s → %s", (code, expected) => {
      expect(getTileAriaLabel(code as TileCode)).toBe(expected);
    });
  });

  describe("字牌", () => {
    test.each([
      ["1z", "とん"],
      ["2z", "なん"],
      ["3z", "しゃー"],
      ["4z", "ぺー"],
      ["5z", "はく"],
      ["6z", "はつ"],
      ["7z", "ちゅん"],
    ])("%s → %s", (code, expected) => {
      expect(getTileAriaLabel(code as TileCode)).toBe(expected);
    });
  });

  test("全34種＋赤ドラ3種にラベルが定義されている", () => {
    const suits = ["m", "p", "s"];
    const codes: string[] = [];
    for (const suit of suits) {
      for (let n = 0; n <= 9; n++) codes.push(`${n}${suit}`);
    }
    for (let n = 1; n <= 7; n++) codes.push(`${n}z`);

    for (const code of codes) {
      const label = getTileAriaLabel(code as TileCode);
      // 牌コードがそのまま返ってきていない = ラベルが定義されている
      expect(label).not.toBe(code);
      // ひらがな・カタカナ長音のみで構成されている
      expect(label).toMatch(/^[ぁ-んー ]+$/);
    }
  });

  test("未定義の牌コードは入力をそのまま返す", () => {
    expect(getTileAriaLabel("8z" as TileCode)).toBe("8z");
  });
});

describe("getTileAriaLabel（伏せ牌）", () => {
  test("「えっくす」と読む", () => {
    expect(getTileAriaLabel("back")).toBe("えっくす");
  });
});

describe("getTileNumberAria / getTileSuitAria（チー読み上げ用）", () => {
  test.each([
    ["1m", "いち"],
    ["2m", "に"],
    ["3m", "さん"],
    ["4m", "よん"],
    ["5m", "ご"],
    ["6m", "ろく"],
    ["7m", "なな"],
    ["8m", "はち"],
    ["9m", "きゅう"],
    ["0m", "あか ご"],
  ])("数字 %s → %s", (code, expected) => {
    expect(getTileNumberAria(code as TileCode)).toBe(expected);
  });

  test.each([
    ["1m", "まん"],
    ["1p", "ぴん"],
    ["1s", "そー"],
  ])("スート %s → %s", (code, expected) => {
    expect(getTileSuitAria(code as TileCode)).toBe(expected);
  });

  test("字牌にはスートの読みがない", () => {
    expect(getTileSuitAria("1z" as TileCode)).toBe("");
  });
});

describe("Tile の読み上げ", () => {
  test.each([
    ["1m", "いー まん"],
    ["9s", "きゅー そー"],
    ["0p", "あか うー ぴん"],
    ["1z", "とん"],
  ])("tile(%s) → %s", (input, expected) => {
    expect(ariaLabelOf(renderer.tile(input))).toBe(expected);
  });

  test("漢字入力の字牌も読み上げられる", () => {
    expect(ariaLabelOf(renderer.tile("東"))).toBe("とん");
    expect(ariaLabelOf(renderer.tile("中"))).toBe("ちゅん");
  });

  test("赤ドラ記法 r5m も読み上げられる", () => {
    expect(ariaLabelOf(renderer.tile("r5m"))).toBe("あか うー まん");
  });
});

describe("Tiles の読み上げ", () => {
  test("数牌の連続", () => {
    expect(ariaLabelOf(renderer.hand("123m"))).toBe("いー まん りゃん まん さん まん");
  });

  test("複数スートの混在", () => {
    expect(ariaLabelOf(renderer.hand("1m1p1s"))).toBe("いー まん いー ぴん いー そー");
  });

  test("字牌7種", () => {
    expect(ariaLabelOf(renderer.hand("1234567z"))).toBe(
      "とん なん しゃー ぺー はく はつ ちゅん",
    );
  });

  test("漢字の字牌混在", () => {
    expect(ariaLabelOf(renderer.hand("123m東"))).toBe(
      "いー まん りゃん まん さん まん とん",
    );
  });

  test("赤ドラ入り", () => {
    expect(ariaLabelOf(renderer.hand("r5m"))).toBe("あか うー まん");
  });

  test("14枚の手牌", () => {
    expect(ariaLabelOf(renderer.hand("123456789m1234p"))).toBe(
      [
        "いー まん",
        "りゃん まん",
        "さん まん",
        "すー まん",
        "うー まん",
        "ろー まん",
        "ちー まん",
        "ぱー まん",
        "きゅー まん",
        "いー ぴん",
        "りゃん ぴん",
        "さん ぴん",
        "すー ぴん",
      ].join(" "),
    );
  });
});

describe("副露の読み上げ", () => {
  test("チー: 「{鳴いた牌}をチーして {数字} {数字} {数字} {スート}」", () => {
    expect(ariaLabelOf(renderer.handExtended("1-23m"))).toBe(
      "いー まんをチーして いち に さん まん",
    );
  });

  test("チー: 筒子", () => {
    expect(ariaLabelOf(renderer.handExtended("4-56p"))).toBe(
      "すー ぴんをチーして よん ご ろく ぴん",
    );
  });

  test("チー: 索子", () => {
    expect(ariaLabelOf(renderer.handExtended("7-89s"))).toBe(
      "ちー そーをチーして なな はち きゅう そー",
    );
  });

  test("ポン: 「{鳴いた牌}をポン」", () => {
    expect(ariaLabelOf(renderer.handExtended("1-11m"))).toBe("いー まんをポン");
  });

  test("ポン: 字牌", () => {
    expect(ariaLabelOf(renderer.handExtended("1-11z"))).toBe("とんをポン");
  });

  test("大明槓: 「みんかん {牌}」", () => {
    expect(ariaLabelOf(renderer.handExtended("1-111m"))).toBe("みんかん いー まん");
  });

  test("暗槓: 「あんかん {牌}」", () => {
    expect(ariaLabelOf(renderer.handExtended("1+111m"))).toBe("あんかん いー まん");
  });

  test("加槓: 「かかん {牌}」", () => {
    expect(ariaLabelOf(renderer.handExtended("1-1=11m"))).toBe("かかん いー まん");
  });

  test("門前牌と副露の組み合わせ", () => {
    expect(ariaLabelOf(renderer.handExtended("123m 1-11p"))).toBe(
      "いー まん りゃん まん さん まん いー ぴんをポン",
    );
  });

  test("複数の副露", () => {
    expect(ariaLabelOf(renderer.handExtended("1-11m 2-22p"))).toBe(
      "いー まんをポン りゃん ぴんをポン",
    );
  });
});

describe("伏せ牌の読み上げ", () => {
  test("単独の伏せ牌は「えっくす」", () => {
    expect(ariaLabelOf(renderer.handExtended("o1m"))).toBe("えっくす");
  });

  test("門前牌に混ざった伏せ牌", () => {
    expect(ariaLabelOf(renderer.handExtended("12m o3m"))).toBe(
      "いー まん りゃん まん えっくす",
    );
  });

  test("チーに混ざった伏せ牌は数字を明かさない", () => {
    const label = ariaLabelOf(renderer.handExtended("o1y23m"));
    expect(label).toContain("えっくす");
    expect(label).not.toContain("いち");
  });

  test("暗槓は伏せ牌ではなく見えている牌を読む", () => {
    const label = ariaLabelOf(renderer.handExtended("o33so"));
    expect(label).toBe("あんかん さん そー");
    expect(label).not.toContain("えっくす");
  });
});

describe("記法エラーは例外にせずエラー表示にする", () => {
  test("鳴き牌の無い記法でも例外を投げない", () => {
    for (const input of ["yp", "-m", "xyz"]) {
      const html = renderer.handExtended(input);
      expect(html).toContain("mj-tile-error");
    }
  });
});

describe("記法文字列は HTML に出力しない", () => {
  test("Tiles はユーザー入力をそのまま埋め込まない", () => {
    const html = renderer.hand('123m<b>x</b>');
    expect(html).not.toContain("<b>");
    expect(html).not.toContain("123m");
  });

  test("handExtended はユーザー入力をそのまま埋め込まない", () => {
    const html = renderer.handExtended("123m 1-11p");
    expect(html).not.toContain("123m 1-11p");
  });

  test("個別の牌画像は読み上げから除外される", () => {
    const html = renderer.hand("123m");
    // SVG は aria-hidden
    expect(html.match(/<svg aria-hidden="true"/g)).toHaveLength(3);
    // 読み上げ対象は外側の1つだけ
    expect(html.match(/role="img"/g)).toHaveLength(1);
  });

  test("Tile は SVG 自体が読み上げ対象になる", () => {
    const html = renderer.tile("1m");
    expect(html).toBe('<svg role="img" aria-label="いー まん" class="mj-tile">1m</svg>');
  });

  test("URL mode の個別画像は alt=\"\"", () => {
    const urlRenderer = createRenderer({
      assets: { getSvg: () => null, getUrl: (code) => `/tiles/${code}.svg` },
      mode: "url",
    });
    const html = urlRenderer.hand("123m");
    expect(html.match(/alt=""/g)).toHaveLength(3);
  });
});

describe("inline styling でも読み上げは同じ", () => {
  const inlineRenderer = createRenderer({ assets: mockAssets, styling: "inline" });

  test("Tile", () => {
    expect(ariaLabelOf(inlineRenderer.tile("1m"))).toBe("いー まん");
  });

  test("Tiles", () => {
    expect(ariaLabelOf(inlineRenderer.hand("123m"))).toBe(
      "いー まん りゃん まん さん まん",
    );
  });

  test("副露", () => {
    expect(ariaLabelOf(inlineRenderer.handExtended("1-23m"))).toBe(
      "いー まんをチーして いち に さん まん",
    );
  });
});
