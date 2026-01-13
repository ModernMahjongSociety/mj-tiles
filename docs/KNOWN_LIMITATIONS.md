# 既知の制限事項

このドキュメントは、パーサーのテスト中に発見された制限事項をまとめたものです。

---

## 1. 赤ドラを含むチー（順子）が正しく判定されない

### 概要

`isSequence`関数が赤ドラ（`0m`, `0p`, `0s`）を`5`として認識しないため、赤ドラを含むチー（順子）がポンと誤判定される。

### 再現例

```typescript
const result = parseHandExtended("0-46m");
// 期待: type === "chii" (赤五萬、四萬、六萬の順子)
// 実際: type === "pon" (0, 4, 6 は連続しないと判定)

const result2 = parseHandExtended("3-05m");
// 期待: type === "chii" (三萬、赤五萬、五萬の順子)
// 実際: type === "pon"
```

### 原因

`parser.ts`の`isSequence`関数（495-503行目）で、赤ドラ（`0`）を`5`に正規化せずに連続性をチェックしている。

```typescript
function isSequence(codes: TileCode[]): boolean {
  // ...
  const nums = codes.map(parseTileNumber).sort((a, b) => a - b);
  // 0, 4, 6 → [0, 4, 6] と解釈され、連続していないと判定
  return nums[1] - nums[0] === 1 && nums[2] - nums[1] === 1;
}
```

### 提案する修正

```typescript
function isSequence(codes: TileCode[]): boolean {
  if (codes.length !== 3) return false;
  const suit = codes[0][1];
  if (suit === 'z') return false;
  if (!codes.every(c => c[1] === suit)) return false;

  // 赤ドラ（0）を5として正規化
  const nums = codes.map(c => {
    const n = parseTileNumber(c);
    return n === 0 ? 5 : n;
  }).sort((a, b) => a - b);

  return nums[1] - nums[0] === 1 && nums[2] - nums[1] === 1;
}
```

### 現在の回避策

赤ドラを含む順子は`5`で記述する：
- `3-45m` ✅ (動作する)
- `3-05m` ❌ (ponと判定される)

---

## 2. 牌画作成くん方式で`isRotated`フラグが正しく設定されない

### 概要

牌画作成くん方式（`y`修飾子）で副露をパースした際、`calledTileIndex`は正しく設定されるが、対応する牌の`isRotated`フラグが`true`にならない場合がある。

### 再現例

```typescript
const result = parseHandExtended("5ya55m");
// 期待: tiles[1].isRotated === true
// 実際: tiles[1].isRotated === undefined

// ただし以下は正しく設定される
console.log(result.melds[0].calledTileIndex); // 1
console.log(result.melds[0].from); // "kamicha"
```

### 原因

`parsePaigaMeld`関数内で、`y`修飾子の直後の牌には`isRotated: true`が設定されるが、`a5`のような複合記法と組み合わせた場合、牌の解釈順序がずれる。

### 現在の回避策

副露の表現には新篠ゆう方式（`-`記号）を推奨：
- `55-0m` ✅ (新篠ゆう方式、確実に動作)
- `5ya55m` ⚠️ (牌画作成くん方式、一部制限あり)

---

## 3. 牌画作成くん方式の暗槓（`o...o`記法）の制限

### 概要

牌画作成くん方式の暗槓記法（`o33so`など）は、スート文字の位置によってパースが失敗する場合がある。

### 再現例

```typescript
// エラーになる
parseHandExtended("o550o");
// Error: Invalid paiga meld notation: o550o (no suit found)

// 動作するがスート文字の位置が特殊
parseHandExtended("o33so"); // OK
```

### 原因

`parsePaigaMeld`関数が末尾からスート文字を探すため、`o550o`のようにスート文字がない記法ではエラーになる。

### 現在の回避策

暗槓は新篠ゆう方式（`+`記号）を推奨：
- `5550+m` ✅ (新篠ゆう方式、確実に動作)
- `1111+z` ✅ (新篠ゆう方式)
- `o33so` ⚠️ (牌画作成くん方式、制限あり)

---

## 関連テストケース

これらの制限事項は `packages/mj-tiles/src/core/parser.test.ts` の以下のセクションでテスト・文書化されています：

- 「副露内の赤ドラ」
- 「牌画作成くん方式の赤ドラ」
- 「修飾子組み合わせのエッジケース」
