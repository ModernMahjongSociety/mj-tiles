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

  test("赤ドラを含むチーの検証", () => {
    expect(validateMeld(["3m", "4m", "0m"], "chii")).toBe(true); // 345、赤5
    expect(validateMeld(["0p", "4p", "6p"], "chii")).toBe(true); // 456、赤5
    expect(validateMeld(["4s", "0s", "6s"], "chii")).toBe(true); // 456、赤5
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

// エッジケーステスト

describe("赤ドラ混在のエッジケース", () => {
  test("0形式とr5形式の混在", () => {
    expect(parseHand("0mr5p5s")).toEqual(["0m", "0p", "5s"]);
  });

  test("r5と0を交互に使用", () => {
    expect(parseHand("r5m0p")).toEqual(["0m", "0p"]);
  });

  test("3種類の赤ドラ表記混在（parseHandExtended）", () => {
    const result = parseHandExtended("a5m r5p 0s");
    expect(result.concealed.map(t => t.code)).toEqual(["0m", "0p", "0s"]);
  });

  test("スペースなしで赤ドラ表記混在", () => {
    // a5はnormalizeNotationで0に変換される
    const result = parseHandExtended("0mr5p");
    expect(result.concealed.map(t => t.code)).toEqual(["0m", "0p"]);
  });

  test("r5の連続（赤2枚）", () => {
    expect(parseHand("r5r5m")).toEqual(["0m", "0m"]);
  });

  test("0と5の混在パターン", () => {
    expect(parseHand("505m")).toEqual(["5m", "0m", "5m"]);
    expect(parseHand("055m")).toEqual(["0m", "5m", "5m"]);
    expect(parseHand("550m")).toEqual(["5m", "5m", "0m"]);
  });

  test("r + 5以外の数字は通常牌（rは無視）", () => {
    // rフラグは立つが、5以外の数字には適用されない
    expect(parseHand("r4m")).toEqual(["4m"]);
    expect(parseHand("r1m")).toEqual(["1m"]);
    expect(parseHand("r9s")).toEqual(["9s"]);
  });

  test("r5z（字牌に赤はない）", () => {
    // r5zは通常の5z（白）として処理される
    expect(parseHand("r5z")).toEqual(["5z"]);
  });
});

describe("字牌記号の衝突エッジケース", () => {
  test("スート文字と字牌記号の区別（数牌+字牌）", () => {
    const result = parseHandExtended("123s p");
    expect(result.concealed.map(t => t.code)).toEqual(["1s", "2s", "3s", "4z"]);
  });

  test("字牌記号の後に数牌", () => {
    const result = parseHandExtended("p 123s");
    expect(result.concealed.map(t => t.code)).toEqual(["4z", "1s", "2s", "3s"]);
  });

  test("単独のr（發）とr5m（赤五萬）の区別", () => {
    const result = parseHandExtended("r 5m");
    expect(result.concealed.map(t => t.code)).toEqual(["6z", "5m"]);
  });

  test("複数の単独字牌記号", () => {
    const result = parseHandExtended("s s s");
    expect(result.concealed.map(t => t.code)).toEqual(["3z", "3z", "3z"]);
  });

  test("發3枚", () => {
    const result = parseHandExtended("r r r");
    expect(result.concealed.map(t => t.code)).toEqual(["6z", "6z", "6z"]);
  });

  test("混合パターン: 数牌+字牌記号", () => {
    const result = parseHandExtended("5p s r");
    expect(result.concealed.map(t => t.code)).toEqual(["5p", "3z", "6z"]);
  });

  test("全字牌記号と数牌の混在", () => {
    const result = parseHandExtended("123m t n s p h r c");
    expect(result.concealed.map(t => t.code)).toEqual([
      "1m", "2m", "3m", "1z", "2z", "3z", "4z", "5z", "6z", "7z"
    ]);
  });
});

describe("副露内の赤ドラ", () => {
  test("ポンで鳴いた牌が赤（0形式、上家）", () => {
    const result = parseHandExtended("0-55m");
    expect(result.melds[0].type).toBe("pon");
    expect(result.melds[0].tiles[0].code).toBe("0m");
    expect(result.melds[0].tiles[0].isRotated).toBe(true);
  });

  test("ポンで中間が赤（0形式、対面）", () => {
    const result = parseHandExtended("5-05m");
    expect(result.melds[0].type).toBe("pon");
    expect(result.melds[0].tiles[1].code).toBe("0m");
  });

  test("ポンで末尾が赤（0形式、下家）", () => {
    const result = parseHandExtended("55-0m");
    expect(result.melds[0].type).toBe("pon");
    expect(result.melds[0].tiles[2].code).toBe("0m");
    // 注意: 55-0m の記法では、記号位置の解釈で calledTileIndex=1（対面）になる
    // 下家からのポンを表現するには 550-m を使用する必要がある
    expect(result.melds[0].calledTileIndex).toBe(1);
  });

  test("ポンで末尾が赤（正しい下家記法）", () => {
    const result = parseHandExtended("550-m");
    expect(result.melds[0].type).toBe("pon");
    expect(result.melds[0].tiles[2].code).toBe("0m");
    expect(result.melds[0].tiles[2].isRotated).toBe(true);
    expect(result.melds[0].from).toBe("shimocha");
  });

  test("暗槓で赤入り（末尾）", () => {
    const result = parseHandExtended("5550+m");
    expect(result.melds[0].type).toBe("ankan");
    expect(result.melds[0].tiles.map(t => t.code)).toEqual(["5m", "5m", "5m", "0m"]);
  });

  test("暗槓で赤入り（先頭）", () => {
    const result = parseHandExtended("0555+m");
    expect(result.melds[0].type).toBe("ankan");
    expect(result.melds[0].tiles[0].code).toBe("0m");
  });

  test("大明槓で赤入り", () => {
    const result = parseHandExtended("5-550m");
    expect(result.melds[0].type).toBe("daiminkan");
    expect(result.melds[0].tiles.map(t => t.code)).toContain("0m");
  });

  test("加槓で鳴いた牌が赤", () => {
    const result = parseHandExtended("0-55=5m");
    expect(result.melds[0].type).toBe("kakan");
    expect(result.melds[0].tiles[0].code).toBe("0m");
  });

  test("チーで赤入り（456）", () => {
    // 赤ドラを含むチーが正しく判定される
    const result = parseHandExtended("0-46m");
    expect(result.melds[0].type).toBe("chii");
    expect(result.melds[0].tiles[0].code).toBe("0m");
    expect(result.melds[0].tiles[0].isRotated).toBe(true);
    expect(result.melds[0].from).toBe("kamicha");
  });

  test("チーで赤入り（345）", () => {
    // 赤ドラを含むチーが正しく判定される（3-40m = 三、四、赤五）
    const result = parseHandExtended("3-40m");
    expect(result.melds[0].type).toBe("chii");
    expect(result.melds[0].tiles.map(t => t.code)).toEqual(["3m", "4m", "0m"]);
  });

  test("チーで赤入り（通常の記法: 3-45m）", () => {
    // 赤ドラを使わない通常のチー
    const result = parseHandExtended("3-45m");
    expect(result.melds[0].type).toBe("chii");
    expect(result.melds[0].tiles.map(t => t.code)).toEqual(["3m", "4m", "5m"]);
  });
});

describe("牌画作成くん方式の赤ドラ", () => {
  test("横向き+赤ドラ（a5形式）", () => {
    // normalizeNotationでa5 → 0に変換、parsePaigaMeldで正しく処理
    const result = parseHandExtended("5ya55m");
    expect(result.melds[0].type).toBe("pon");
    // calledTileIndexは正しく1に設定される
    expect(result.melds[0].calledTileIndex).toBe(1);
    // tiles[1].isRotatedがtrueに正しく設定される
    expect(result.melds[0].tiles[1].isRotated).toBe(true);
    expect(result.melds[0].tiles[1].code).toBe("0m");
    expect(result.melds[0].from).toBe("kamicha");
  });

  test("横向き+赤ドラ（0形式）", () => {
    // 5y05m は 3枚のポンとして解釈される
    const result = parseHandExtended("5y05m");
    expect(result.melds[0].type).toBe("pon");
    expect(result.melds[0].tiles[1].isRotated).toBe(true);
  });

  test("横向きポンで赤入り（55y0m記法）", () => {
    // 牌画作成くん方式の赤入りポン
    const result = parseHandExtended("55y0m");
    expect(result.melds[0].type).toBe("pon");
    expect(result.melds[0].tiles[2].code).toBe("0m");
    expect(result.melds[0].tiles[2].isRotated).toBe(true);
  });

  test("横向きポンで赤入り（新篠ゆう方式）", () => {
    // 赤入りポンは新篠ゆう方式でも動作
    const result = parseHandExtended("55-0m");
    expect(result.melds[0].type).toBe("pon");
    expect(result.melds[0].tiles[2].code).toBe("0m");
  });

  test("暗槓で赤入り（新篠ゆう方式）", () => {
    const result = parseHandExtended("5550+m");
    expect(result.melds[0].type).toBe("ankan");
    expect(result.melds[0].tiles.map(t => t.code)).toContain("0m");
  });

  test("暗槓で赤入り（牌画作成くん方式 末尾スート形式）", () => {
    // o550om = 赤5入りの暗槓
    const result = parseHandExtended("o550om");
    expect(result.melds[0].type).toBe("ankan");
    expect(result.melds[0].tiles.map(t => t.code)).toContain("0m");
    expect(result.melds[0].tiles[0].isFaceDown).toBe(true);
    expect(result.melds[0].tiles[4].isFaceDown).toBe(true);
  });
});

describe("修飾子組み合わせのエッジケース", () => {
  test("単一の伏せ牌", () => {
    const result = parseHandExtended("o5m");
    expect(result.concealed[0].code).toBe("5m");
    expect(result.concealed[0].isFaceDown).toBe(true);
  });

  test("単一の横向き牌", () => {
    const result = parseHandExtended("y5m");
    expect(result.concealed[0].code).toBe("5m");
    expect(result.concealed[0].isRotated).toBe(true);
  });

  test("伏せ牌で赤ドラ（0形式）", () => {
    const result = parseHandExtended("o0m");
    expect(result.concealed[0].code).toBe("0m");
    expect(result.concealed[0].isFaceDown).toBe(true);
  });

  test("複数の伏せ牌", () => {
    const result = parseHandExtended("o1m o2m o3m");
    expect(result.concealed).toHaveLength(3);
    expect(result.concealed.every(t => t.isFaceDown)).toBe(true);
  });
});

describe("空白・区切りのエッジケース", () => {
  test("複数スペース", () => {
    const result = parseHandExtended("123m  456p");
    expect(result.concealed.map(t => t.code)).toEqual([
      "1m", "2m", "3m", "4p", "5p", "6p"
    ]);
  });

  test("先頭スペース", () => {
    const result = parseHandExtended(" 123m");
    expect(result.concealed.map(t => t.code)).toEqual(["1m", "2m", "3m"]);
  });

  test("末尾スペース", () => {
    const result = parseHandExtended("123m ");
    expect(result.concealed.map(t => t.code)).toEqual(["1m", "2m", "3m"]);
  });

  test("タブ区切り", () => {
    const result = parseHandExtended("123m\t456p");
    expect(result.concealed.map(t => t.code)).toEqual([
      "1m", "2m", "3m", "4p", "5p", "6p"
    ]);
  });
});

describe("parseHandとparseHandExtendedの整合性", () => {
  test("基本的な手牌は同じ結果", () => {
    const simple = parseHand("123m456p789s");
    const extended = parseHandExtended("123m456p789s");
    expect(extended.concealed.map(t => t.code)).toEqual(simple);
  });

  test("赤ドラは同じ結果", () => {
    const simple = parseHand("r5m");
    const extended = parseHandExtended("r5m");
    expect(extended.concealed.map(t => t.code)).toEqual(simple);
  });

  test("0形式赤ドラは同じ結果", () => {
    const simple = parseHand("0m");
    const extended = parseHandExtended("0m");
    expect(extended.concealed.map(t => t.code)).toEqual(simple);
  });

  test("字牌は同じ結果", () => {
    const simple = parseHand("東南西北");
    const extended = parseHandExtended("東南西北");
    expect(extended.concealed.map(t => t.code)).toEqual(simple);
  });
});
