import { describe, test, expect } from "bun:test";
import {
  parseTile,
  parseHand,
  normalizeNotation,
  parseHandExtended,
  validateMeld,
  validateHand
} from "./parser";

describe("parseTile", () => {
  test("数牌をパース", () => {
    expect(parseTile("1m")).toBe("1m");
    expect(parseTile("5p")).toBe("5p");
    expect(parseTile("9s")).toBe("9s");
  });

  test("字牌をパース", () => {
    expect(parseTile("東")).toBe("1z");
    expect(parseTile("中")).toBe("7z");
  });

  test("不正な入力", () => {
    expect(parseTile("10m")).toBeNull();
    expect(parseTile("abc")).toBeNull();
  });

  test("赤ドラをパース", () => {
    expect(parseTile("0m")).toBe("0m");
    expect(parseTile("0p")).toBe("0p");
    expect(parseTile("0s")).toBe("0s");
  });

  test("r5形式で赤ドラをパース", () => {
    expect(parseTile("r5m")).toBe("0m");
    expect(parseTile("r5p")).toBe("0p");
    expect(parseTile("r5s")).toBe("0s");
  });

  test("z形式で字牌をパース", () => {
    expect(parseTile("1z")).toBe("1z");
    expect(parseTile("7z")).toBe("7z");
  });
});

describe("parseHand", () => {
  test("手牌文字列をパース", () => {
    expect(parseHand("123m")).toEqual(["1m", "2m", "3m"]);
    expect(parseHand("123m456p789s")).toEqual([
      "1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "9s"
    ]);
    expect(parseHand("東南西北白發中")).toEqual([
      "1z", "2z", "3z", "4z", "5z", "6z", "7z"
    ]);
    expect(parseHand("19m19p19s東南西北")).toEqual([
      "1m", "9m", "1p", "9p", "1s", "9s", "1z", "2z", "3z", "4z"
    ]);
  });

  test("赤ドラを含む手牌", () => {
    expect(parseHand("1230m456p")).toEqual([
      "1m", "2m", "3m", "0m", "4p", "5p", "6p"
    ]);
  });

  test("z形式で字牌をパース", () => {
    expect(parseHand("1234z")).toEqual(["1z", "2z", "3z", "4z"]);
    expect(parseHand("567z")).toEqual(["5z", "6z", "7z"]);
    expect(parseHand("1234567z")).toEqual([
      "1z", "2z", "3z", "4z", "5z", "6z", "7z"
    ]);
  });

  test("r5形式で赤ドラをパース", () => {
    expect(parseHand("r5m456p")).toEqual(["0m", "4p", "5p", "6p"]);
    expect(parseHand("123mr5p789s")).toEqual([
      "1m", "2m", "3m", "0p", "7s", "8s", "9s"
    ]);
    expect(parseHand("r5mr5pr5s")).toEqual(["0m", "0p", "0s"]);
    expect(parseHand("1234r5m")).toEqual(["1m", "2m", "3m", "4m", "0m"]);
  });

  test("z形式と漢字を混在", () => {
    expect(parseHand("123m1234z東南")).toEqual([
      "1m", "2m", "3m", "1z", "2z", "3z", "4z", "1z", "2z"
    ]);
  });

  test("国士無双をz形式で", () => {
    expect(parseHand("19m19p19s1234567z")).toEqual([
      "1m", "9m", "1p", "9p", "1s", "9s", "1z", "2z", "3z", "4z", "5z", "6z", "7z"
    ]);
  });
});

// Phase 1: 拡張機能のテスト

describe("normalizeNotation", () => {
  test("赤ドラ修飾子を変換", () => {
    expect(normalizeNotation("a5m")).toBe("0m");
    expect(normalizeNotation("a5p")).toBe("0p");
    expect(normalizeNotation("a5s")).toBe("0s");
  });

  test("字牌独自記号を変換", () => {
    expect(normalizeNotation("t")).toBe("1z"); // 東
    expect(normalizeNotation("n")).toBe("2z"); // 南
    expect(normalizeNotation("s")).toBe("3z"); // 西
    expect(normalizeNotation("p")).toBe("4z"); // 北
    expect(normalizeNotation("h")).toBe("5z"); // 白
    expect(normalizeNotation("r")).toBe("6z"); // 發
    expect(normalizeNotation("c")).toBe("7z"); // 中
  });

  test("数牌との衝突を回避", () => {
    expect(normalizeNotation("3p")).toBe("3p"); // 三筒
    expect(normalizeNotation("3s")).toBe("3s"); // 三索
    expect(normalizeNotation("r5m")).toBe("0m"); // 赤五萬
  });

  test("複合的な変換", () => {
    expect(normalizeNotation("a5m 3p p")).toBe("0m 3p 4z");
    expect(normalizeNotation("t n s p")).toBe("1z 2z 3z 4z");
  });
});

describe("parseHandExtended - 新篠ゆう方式", () => {
  test("チー（上家から）", () => {
    const result = parseHandExtended("2-13m");
    expect(result.concealed).toEqual([]);
    expect(result.melds).toHaveLength(1);
    expect(result.melds[0].type).toBe("chii");
    expect(result.melds[0].from).toBe("kamicha");
    expect(result.melds[0].tiles[0].code).toBe("2m");
    expect(result.melds[0].tiles[0].isRotated).toBe(true);
  });

  test("チー（対面から）", () => {
    const result = parseHandExtended("12-3p");
    expect(result.melds[0].type).toBe("chii");
    expect(result.melds[0].from).toBe("toimen");
    expect(result.melds[0].calledTileIndex).toBe(1);
  });

  test("チー（下家から）", () => {
    const result = parseHandExtended("123-s");
    expect(result.melds[0].type).toBe("chii");
    expect(result.melds[0].from).toBe("shimocha");
    expect(result.melds[0].calledTileIndex).toBe(2);
  });

  test("ポン（上家から）", () => {
    const result = parseHandExtended("5-55p");
    expect(result.melds[0].type).toBe("pon");
    expect(result.melds[0].from).toBe("kamicha");
    expect(result.melds[0].tiles[0].isRotated).toBe(true);
  });

  test("ポン（対面から）", () => {
    const result = parseHandExtended("55-5s");
    expect(result.melds[0].type).toBe("pon");
    expect(result.melds[0].from).toBe("toimen");
    expect(result.melds[0].calledTileIndex).toBe(1);
  });

  test("大明槓（上家から）", () => {
    const result = parseHandExtended("4-444s");
    expect(result.melds[0].type).toBe("daiminkan");
    expect(result.melds[0].from).toBe("kamicha");
    expect(result.melds[0].tiles).toHaveLength(4);
  });

  test("加槓", () => {
    const result = parseHandExtended("5-55=0p");
    expect(result.melds[0].type).toBe("kakan");
    expect(result.melds[0].from).toBe("kamicha");
    expect(result.melds[0].tiles).toHaveLength(4);
    expect(result.melds[0].tiles[3].code).toBe("0p");
  });

  test("暗槓", () => {
    const result = parseHandExtended("1111+z");
    expect(result.melds[0].type).toBe("ankan");
    expect(result.melds[0].from).toBeUndefined();
    expect(result.melds[0].tiles[0].isFaceDown).toBe(true);
    expect(result.melds[0].tiles[3].isFaceDown).toBe(true);
  });

  test("門前牌と副露の混在", () => {
    const result = parseHandExtended("123m 2-13p 55-5s");
    expect(result.concealed).toHaveLength(3);
    expect(result.melds).toHaveLength(2);
    expect(result.melds[0].type).toBe("chii");
    expect(result.melds[1].type).toBe("pon");
  });
});

describe("parseHandExtended - 牌画作成くん方式", () => {
  test("横向き修飾子でチー", () => {
    const result = parseHandExtended("2y13m");
    expect(result.melds[0].type).toBe("chii");
    expect(result.melds[0].tiles[1].isRotated).toBe(true);  // 2枚目が横向き
    expect(result.melds[0].from).toBe("kamicha");  // 記号が1枚目の後 → 上家
  });

  test("横向き修飾子でポン", () => {
    const result = parseHandExtended("55y5p");
    expect(result.melds[0].type).toBe("pon");
    expect(result.melds[0].from).toBe("toimen");  // 記号が2枚目の後 → 対面
    expect(result.melds[0].tiles[2].isRotated).toBe(true);  // 3枚目が横向き
  });

  test("赤ドラ修飾子", () => {
    const result = parseHandExtended("a5m 23m");
    expect(result.concealed[0].code).toBe("0m");
    expect(result.concealed[1].code).toBe("2m");
    expect(result.concealed[2].code).toBe("3m");
  });

  test("暗槓（伏せ牌）", () => {
    const result = parseHandExtended("o33so");
    expect(result.melds[0].type).toBe("ankan");
    expect(result.melds[0].tiles[0].isFaceDown).toBe(true);
    expect(result.melds[0].tiles[3].isFaceDown).toBe(true);
  });

  test("字牌独自記号", () => {
    const result = parseHandExtended("t n s p h r c");
    expect(result.concealed.map(t => t.code)).toEqual([
      "1z", "2z", "3z", "4z", "5z", "6z", "7z"
    ]);
  });
});

describe("parseHandExtended - 混在記法", () => {
  test("両方式を同時に使用", () => {
    const result = parseHandExtended("123m 2-13p a5s");
    expect(result.concealed).toHaveLength(4);
    expect(result.concealed[3].code).toBe("0s");
    expect(result.melds[0].type).toBe("chii");
  });

  test("新篠ゆう方式 + 牌画作成くん方式", () => {
    const result = parseHandExtended("2y13p 55-5s");
    expect(result.melds).toHaveLength(2);
    expect(result.melds[0].type).toBe("chii");
    expect(result.melds[1].type).toBe("pon");
  });
});

describe("validateMeld", () => {
  test("チーの検証", () => {
    expect(validateMeld(["1m", "2m", "3m"], "chii")).toBe(true);
    expect(validateMeld(["7p", "8p", "9p"], "chii")).toBe(true);
    expect(validateMeld(["1m", "3m", "5m"], "chii")).toBe(false); // 連続していない
    expect(validateMeld(["1z", "2z", "3z"], "chii")).toBe(false); // 字牌はチー不可
  });

  test("ポンの検証", () => {
    expect(validateMeld(["5m", "5m", "5m"], "pon")).toBe(true);
    expect(validateMeld(["5m", "0m", "5m"], "pon")).toBe(true); // 赤ドラ混在OK
    expect(validateMeld(["1m", "2m", "3m"], "pon")).toBe(false);
  });

  test("大明槓の検証", () => {
    expect(validateMeld(["3s", "3s", "3s", "3s"], "daiminkan")).toBe(true);
    expect(validateMeld(["5p", "5p", "5p", "0p"], "daiminkan")).toBe(true);
  });

  test("暗槓の検証", () => {
    expect(validateMeld(["1z", "1z", "1z", "1z"], "ankan")).toBe(true);
    expect(validateMeld(["5s", "5s", "5s"], "ankan")).toBe(false);
  });
});

describe("validateHand", () => {
  test("正常な手牌（13枚）", () => {
    const hand = parseHandExtended("123m456p789s1122z");
    const result = validateHand(hand);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("正常な手牌（14枚、ツモ）", () => {
    const hand = parseHandExtended("123m456p789s11223z");
    const result = validateHand(hand);
    expect(result.valid).toBe(true);
  });

  test("副露を含む手牌", () => {
    const hand = parseHandExtended("1234567m 2-13s 55-5z");
    const result = validateHand(hand);
    expect(result.valid).toBe(true);
  });

  test("牌数が不正（12枚）", () => {
    const hand = parseHandExtended("123m456p789s11z");
    const result = validateHand(hand);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("牌の総数が不正");
  });

  test("同じ牌が5枚（エラー）", () => {
    const hand = parseHandExtended("11111m456p789s11z");
    const result = validateHand(hand);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("4枚を超えています");
  });
});
