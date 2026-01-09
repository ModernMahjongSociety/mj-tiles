import { describe, test, expect } from "bun:test";
import { parseTile, parseHand } from "./parser";

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
