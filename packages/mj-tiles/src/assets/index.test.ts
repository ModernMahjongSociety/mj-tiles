import { describe, test, expect } from "bun:test";
import { defaultAssets, tiles } from "./index";
import type { TileCode } from "../core/types";

describe("defaultAssets", () => {
  // 寸法だけ返って画像が無いと、実際に描かれる向きと場所取りがずれる
  test("getSize は getUrl と同じ牌で undefined になる", () => {
    const codes = Object.keys(tiles) as (TileCode | 'back')[];
    for (const code of codes) {
      for (const isRotated of [false, true]) {
        expect([code, isRotated, defaultAssets.getSize?.(code, isRotated) === undefined]).toEqual(
          [code, isRotated, defaultAssets.getUrl?.(code, isRotated) === undefined],
        );
      }
    }
  });

  test("横向き画像がある牌は縦横が入れ替わった寸法を返す", () => {
    expect(defaultAssets.getSize?.("1m")).toEqual({ width: 66, height: 90 });
    expect(defaultAssets.getSize?.("1m", true)).toEqual({ width: 90, height: 66 });
    expect(defaultAssets.getSize?.("back", true)).toBeUndefined();
  });
});
