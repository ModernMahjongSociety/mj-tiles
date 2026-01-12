# 拡張記法の実装計画

## 実装スコープ

**対象**: 手牌の牌姿のみ

**対象外**（将来実装）:
- 捨て牌列（河）
- ツモ切り表示
- 立直宣言牌（捨て牌での横向き）
- ドラ表示
- 伏せ牌（他家の手牌）

## 対応する記法

両方の記法システムをサポートします：

1. **新篠ゆう方式** - 副露の方向性と種類を記号で表現
2. **牌画作成くん方式** - 修飾子による状態表現

## 手牌で必要な機能

| 機能 | 新篠ゆう方式 | 牌画作成くん方式 | 優先度 |
|------|-------------|----------------|--------|
| 基本牌 | `123m456p789s` | `123m456p789s` | ✅ 済 |
| 字牌（漢字） | `東南西北` | - | ✅ 済 |
| 字牌（z形式） | `1234567z` | - | ✅ 済 |
| 字牌（独自） | - | `tnsprhc` | 🔴 必須 |
| 赤ドラ（0/r5） | `0m`, `r5m` | - | ✅ 済 |
| 赤ドラ（a修飾子） | - | `a5m` | 🔴 必須 |
| チー | `2-13m` | `2y13m` | 🔴 必須 |
| ポン | `55-5p` | `55y5p` | 🔴 必須 |
| 大明槓 | `444-4s` | `444y4s` | 🔴 必須 |
| 加槓 | `55=50p` | `55y55p` | 🟡 中 |
| 暗槓 | `1111+z` | `o33so` | 🟡 中 |
| ツモ牌 | 最後に記号 | `5pm` | 🟢 低 |
| ロン牌 | 最後に記号 | `5pl` | 🟢 低 |
| 横向き（汎用） | - | `y` | 🔴 必須 |

## 実装フェーズ

### Phase 0: 基盤整備

**目標**: パーサーの前処理と後処理の仕組みを構築

#### 0.1 正規化関数

**2段階処理アプローチ**:

```typescript
// Stage 1: 正規化（両方式を統一記法に変換）
function normalizeNotation(input: string): string {
  let normalized = input.trim();

  // 牌画作成くん方式 → mspz拡張方式
  // a5m → 0m（赤ドラ）
  normalized = normalized.replace(/a5([mps])/g, '0$1');

  // 字牌独自記号 → z形式
  // 注: 文脈依存の衝突を避けるため、慎重に置換
  const honorMap: Record<string, string> = {
    't': '1z', 'n': '2z', 's': '3z', 'p': '4z',
    'h': '5z', 'r': '6z', 'c': '7z'
  };

  // r5m 形式は保護（赤ドラ）
  normalized = normalized.replace(/r(\d)([mps])/g, 'RED$1$2'); // 一時マーク

  // 単独の字牌記号を変換
  for (const [key, value] of Object.entries(honorMap)) {
    // 数字が前後にない場合のみ変換
    normalized = normalized.replace(
      new RegExp(`(?<![0-9])${key}(?![0-9mps])`, 'g'),
      value
    );
  }

  // 赤ドラマークを戻す
  normalized = normalized.replace(/RED(\d)([mps])/g, '0$2');

  return normalized;
}

// Stage 2: パース（統一記法を解釈）
function parseHandExtended(input: string): Hand {
  const normalized = normalizeNotation(input);
  // パース処理...
}
```

#### 0.2 バリデーション関数

```typescript
// 副露の妥当性チェック
function validateMeld(tiles: TileCode[], type: MeldType): boolean {
  if (type === 'chii') {
    // チーは連続した3枚の数牌
    if (tiles.length !== 3) return false;
    // 連続性チェック（ソート後に差が1ずつ）
    const sorted = tiles.map(parseTileNumber).sort((a, b) => a - b);
    return sorted[1] - sorted[0] === 1 && sorted[2] - sorted[1] === 1;
  }

  if (type === 'pon' || type === 'daiminkan' || type === 'kakan') {
    // ポン・カンは同じ牌
    const uniqueCodes = new Set(tiles.map(t => t.replace('0', '5'))); // 赤ドラを正規化
    return uniqueCodes.size === 1;
  }

  if (type === 'ankan') {
    // 暗槓は同じ牌4枚
    if (tiles.length !== 4) return false;
    const uniqueCodes = new Set(tiles.map(t => t.replace('0', '5')));
    return uniqueCodes.size === 1;
  }

  return true;
}

// 手牌全体の妥当性チェック
type ValidationResult = {
  valid: boolean;
  errors: string[];
};

function validateHand(hand: Hand): ValidationResult {
  const errors: string[] = [];

  // 牌の総数チェック（門前 + 副露 = 13 or 14）
  const concealedCount = hand.concealed.length;
  const meldTileCount = hand.melds.reduce((sum, m) => sum + m.tiles.length, 0);
  const totalCount = concealedCount + meldTileCount;

  if (totalCount !== 13 && totalCount !== 14) {
    errors.push(`牌の総数が不正: ${totalCount}枚（13または14枚である必要があります）`);
  }

  // 各牌が4枚を超えていないかチェック
  const tileCounts = new Map<string, number>();
  const countTile = (code: TileCode) => {
    const normalized = code.replace('0', '5'); // 赤ドラを正規化
    tileCounts.set(normalized, (tileCounts.get(normalized) || 0) + 1);
  };

  hand.concealed.forEach(t => countTile(t.code));
  hand.melds.forEach(m => m.tiles.forEach(t => countTile(t.code)));

  for (const [tile, count] of tileCounts) {
    if (count > 4) {
      errors.push(`${tile}が${count}枚（4枚を超えています）`);
    }
  }

  // 各副露の妥当性チェック
  hand.melds.forEach((meld, index) => {
    const tilesCodes = meld.tiles.map(t => t.code);
    if (!validateMeld(tilesCodes, meld.type)) {
      errors.push(`副露${index + 1}が不正: type=${meld.type}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Phase 1: パーサー拡張の基礎

**目標**: 両方式の基本構文を解釈できるパーサー

#### 1.1 新篠ゆう方式の記号検出

```typescript
// 検出する記号
'-'  // チー・ポン・大明槓
'='  // 加槓
'+'  // 暗槓
```

**パース例**:
```typescript
parseHand("123m 2-13p")
// → 門前: [1m, 2m, 3m]
// → 副露: [チー: 2p, 1p, 3p (2p目が横向き、上家から)]
```

#### 1.2 牌画作成くん方式の修飾子検出

```typescript
// 前置修飾子
'y'  // 横向き
'a'  // 赤ドラ
'o'  // 伏せ牌 → 'back' に変換

// 後置修飾子
'm'  // ツモ牌
'l'  // ロン牌

// 字牌の独自記号
't' → '1z'  // 東
'n' → '2z'  // 南
's' → '3z'  // 西
'p' → '4z'  // 北
'h' → '5z'  // 白
'r' → '6z'  // 發
'c' → '7z'  // 中
```

**パース例**:
```typescript
parseHand("123m 2y13p")
// → 門前: [1m, 2m, 3m]
// → 副露: [チー: 2p(横), 1p, 3p]

parseHand("a5m 23m")
// → 門前: [0m, 2m, 3m]  // a5m → 0m に変換

parseHand("o33so")
// → 暗槓: [
//   { code: '3s', isFaceDown: true },
//   { code: '3s' },
//   { code: '3s' },
//   { code: '3s', isFaceDown: true }
// ]

parseHand("3333+s")
// → 暗槓: [
//   { code: '3s', isFaceDown: true },
//   { code: '3s' },
//   { code: '3s' },
//   { code: '3s', isFaceDown: true }
// ]
```

### Phase 2: データ構造の拡張

#### 2.1 型定義

**設計方針**: 内部表現はmspz拡張方式に統一。伏せ牌は `isFaceDown` フラグで表現。

```typescript
// TileCode（変更なし、既存の定義を維持）
type TileCode = "1m" | "2m" | ... | "7z" | "0m" | "0p" | "0s";

// 牌の状態
type TileState = {
  code: TileCode;           // "1m" | "2m" | ... | "7z" | "0m" | "0p" | "0s"
  isRotated?: boolean;      // y: 横向き（副露牌）
  isFaceDown?: boolean;     // o: 伏せ牌（暗槓の両端）
  isTsumo?: boolean;        // m: ツモ牌
  isRon?: boolean;          // l: ロン牌
};

// 副露の種類
type MeldType =
  | 'chii'        // チー（順子）
  | 'pon'         // ポン（刻子）
  | 'daiminkan'   // 大明槓
  | 'kakan'       // 加槓
  | 'ankan';      // 暗槓

// 鳴きの方向
type MeldFrom =
  | 'kamicha'     // 上家（左）
  | 'toimen'      // 対面
  | 'shimocha';   // 下家（右）

// 副露情報（mspz拡張方式ベース）
type MeldInfo = {
  type: MeldType;
  tiles: TileState[];
  from?: MeldFrom;          // 鳴きの方向（暗槓は undefined）
  calledTileIndex?: number; // 鳴いた牌の位置（0始まり）
};

// 手牌全体
type Hand = {
  concealed: TileState[];   // 門前牌
  melds: MeldInfo[];        // 副露面子
};
```

**設計の特徴**:
- `TileCode` は変更なし（既存の型を維持）
- 伏せ牌は `isFaceDown` フラグで表現（データとして意味的に正確）
- 赤ドラは `code: "0m"` で表現（`a5m` は正規化時に変換）
- 内部表現は mspz 拡張方式に統一（方向情報を明示的に保持）

#### 2.2 パーサー関数の拡張

```typescript
// 現行（単純な配列）
parseHand(input: string): TileCode[]

// 拡張後（構造化データ）
parseHandExtended(input: string): Hand
```

**後方互換性の維持**:
```typescript
// 既存の parseHand は維持
parseHand(input: string): TileCode[]  // 変更なし

// 新しい拡張版を追加
parseHandExtended(input: string): Hand
```

### Phase 3: レンダリング対応

#### 3.1 副露面子のグループ化

```html
<!-- 門前牌 -->
<div class="mj-hand-concealed">
  <span class="mj-tile">...</span>
  <span class="mj-tile">...</span>
</div>

<!-- 副露面子 -->
<div class="mj-hand-melds">
  <div class="mj-meld mj-meld-chii">
    <span class="mj-tile">...</span>
    <span class="mj-tile mj-tile-rotated">...</span>
    <span class="mj-tile">...</span>
  </div>
  <div class="mj-meld mj-meld-pon">
    <span class="mj-tile">...</span>
    <span class="mj-tile mj-tile-rotated">...</span>
    <span class="mj-tile">...</span>
  </div>
</div>
```

#### 3.2 CSS対応

```css
/* 横向き牌 */
.mj-tile-rotated {
  transform: rotate(90deg);
  transform-origin: center center;
}

/* 面子グループ */
.mj-meld {
  display: inline-flex;
  gap: 2px;
  margin-right: 8px;
}
```

#### 3.3 伏せ牌のSVGアセットとレンダリング

伏せ牌は専用のSVGアセットと `isFaceDown` フラグで表現します：

```
src/assets/tiles/back.svg  // 裏面デザイン
```

**実装方針**:
- `TileCode` は変更なし（既存の型を維持）
- `isFaceDown` フラグで伏せ牌を判定
- レンダリング時に裏面SVGを使用
- `assets.getSvg('back')` で裏面SVGを取得

**使用例**:
```typescript
// パース結果
parseHand("o33so")
// → tiles: [
//   { code: '3s', isFaceDown: true },
//   { code: '3s' },
//   { code: '3s' },
//   { code: '3s', isFaceDown: true }
// ]

// レンダリング
function renderTile(tile: TileState): string {
  if (tile.isFaceDown) {
    return assets.getSvg('back');  // 裏面
  }
  return assets.getSvg(tile.code);  // 表面
}

// → back.svg, 3s.svg, 3s.svg, back.svg
```

**メリット**:
- データとして意味的に正確（「裏面の牌」ではなく「三索が伏せられている」）
- 牌の種類情報を保持（バリデーションや点数計算に有用）
- 表示の柔軟性（伏せ牌のデザインを変更しやすい）

### Phase 4: コンポーネント拡張

#### 4.1 React コンポーネント

```tsx
// 既存（シンプル版）
<Tiles hand="123m456p789s" />

// 拡張後
<Tiles hand="123m 2-13p 55-5s" />
<Tiles hand="123m 2y13p 55y5s" />

// または明示的に
<Hand>
  <Concealed tiles="123m" />
  <Meld type="chii" tiles="2-13p" />
  <Meld type="pon" tiles="55-5s" />
</Hand>
```

#### 4.2 内部実装

```tsx
function Tiles({ hand }: { hand: string }) {
  const parsed = parseHandExtended(hand);

  return (
    <div className="mj-hand">
      {/* 門前牌 */}
      <div className="mj-hand-concealed">
        {parsed.concealed.map((tile, i) => (
          <Tile key={i} tile={tile} />
        ))}
      </div>

      {/* 副露面子 */}
      <div className="mj-hand-melds">
        {parsed.melds.map((meld, i) => (
          <Meld key={i} meld={meld} />
        ))}
      </div>
    </div>
  );
}
```

## 両方式の統一方針

### 記号のマッピング

**設計方針**: 両方式をmspz拡張方式ベースの内部表現に統一

| 表現 | 新篠ゆう | 牌画作成くん | 内部表現（mspz拡張方式） |
|------|---------|------------|---------|
| チー（上家） | `2-13m` | `2y13m` | `{ type: 'chii', from: 'kamicha', calledTileIndex: 0 }` |
| ポン（対面） | `55-5p` | `55y5p` | `{ type: 'pon', from: 'toimen', calledTileIndex: 1 }` |
| 大明槓（下家） | `444-4s` | `444y4s` | `{ type: 'daiminkan', from: 'shimocha', calledTileIndex: 2 }` |
| 加槓 | `55-5=0p` | `55y5a5p` | `{ type: 'kakan', from: 'toimen', calledTileIndex: 1 }` |
| 暗槓 | `3333+s` | `o33so` | `{ type: 'ankan', tiles: [3s(伏), 3s, 3s, 3s(伏)] }` |
| 赤ドラ | `0m` / `r5m` | `a5m` | `code: '0m'` |
| 伏せ牌 | - | `o` | `isFaceDown: true` |

**注記**:
- `calledTileIndex`: 鳴いた牌の位置（0始まり）
- `(伏)`: `{ code: '3s', isFaceDown: true }` の略記
- 赤ドラは全て `code: '0m'` に統一
- 方向情報は明示的に保持（推測不要）

### パーサーの自動判定

入力文字列を解析して、どちらの方式かを自動判定：

```typescript
function detectNotationStyle(input: string): 'arasino' | 'paiga' | 'mixed' {
  const hasArasinoSymbols = /-|=|\+/.test(input);

  // より厳密な牌画作成くん方式の検出
  // - y, o: 前置修飾子（数字の前、または単独）
  // - m, l: 後置修飾子（数字の後）
  // - a: 赤ドラ修飾子（数字の前で、r5m形式ではない）
  // - t, n, h, c: 字牌独自記号（m/p/sが続かない）
  // - s, p, r: 文脈依存（単独または前置修飾子の後なら字牌）
  const hasPaigaModifiers =
    /[yo](?=\d)|(?<=\d)[ml]/.test(input) ||        // y/o が数字の前、m/l が数字の後
    /(?<![r\d])a\d/.test(input) ||                 // a5m 形式（r5m ではない）
    /[tnhc](?![mps])/.test(input) ||               // t/n/h/c の後に m/p/s がない
    /(?:^|[^0-9])[spr](?:[^0-9mps]|$)/.test(input); // 単独の s/p/r

  if (hasPaigaModifiers) {
    return hasArasinoSymbols ? 'mixed' : 'paiga';
  }

  return hasArasinoSymbols ? 'arasino' : 'arasino';  // デフォルト
}
```

**検出ロジックの説明**:
- 牌姿のみを想定（牌姿以外の文字列は含まない前提）
- 数字との位置関係で修飾子を判定
- 字牌独自記号は後続文字で判定（`3p` = 三筒、`p` = 北）
- 混在記法も許可

### 混在記法の許可

両方式を同時に使うことも許可：

```typescript
// 新篠ゆう + 牌画作成くん
<Tiles hand="123m 2-13p a5s" />
//         ↑基本  ↑新篠  ↑牌画（赤5s）

<Tiles hand="2y13p 55-5s" />
//         ↑牌画  ↑新篠

<Tiles hand="11m 3333+s o66po" />
//         ↑基本  ↑新篠    ↑牌画（暗槓）
```

## テスト戦略

### ユニットテスト

```typescript
describe('parseHandExtended', () => {
  describe('新篠ゆう方式', () => {
    it('チーを解釈', () => {
      const result = parseHandExtended('2-13m');
      expect(result.melds[0]).toEqual({
        type: 'chii',
        from: 'kamicha',
        tiles: [
          { code: '2m', isRotated: true },
          { code: '1m' },
          { code: '3m' }
        ],
        rotatedIndex: 0
      });
    });

    it('ポン（対面）を解釈', () => {
      const result = parseHandExtended('55-5p');
      expect(result.melds[0].from).toBe('toimen');
      expect(result.melds[0].rotatedIndex).toBe(1);
    });
  });

  describe('牌画作成くん方式', () => {
    it('横向き修飾子を解釈', () => {
      const result = parseHandExtended('2y13m');
      expect(result.melds[0].tiles[0].isRotated).toBe(true);
    });

    it('赤ドラ修飾子を解釈', () => {
      const result = parseHandExtended('a5m23m');
      expect(result.concealed[0].code).toBe('0m');
    });

    it('字牌独自記号を解釈', () => {
      const result = parseHandExtended('tnsp');
      expect(result.concealed).toEqual([
        { code: '1z' },  // 東
        { code: '2z' },  // 南
        { code: '3z' },  // 西
        { code: '4z' }   // 北
      ]);
    });
  });

  describe('混在記法', () => {
    it('両方式を同時に解釈', () => {
      const result = parseHandExtended('123m 2-13p a5s');
      expect(result.concealed).toContain({ code: '0s' });
      expect(result.melds[0].type).toBe('chii');
    });
  });

  describe('エッジケース', () => {
    it('空白を含む複雑な手牌', () => {
      const result = parseHandExtended('  123m  2-13p  ');
      expect(result.concealed).toEqual([
        { code: '1m' }, { code: '2m' }, { code: '3m' }
      ]);
      expect(result.melds).toHaveLength(1);
    });

    it('不正な記法のエラーハンドリング', () => {
      expect(() => parseHandExtended('2-1m')).toThrow(); // 順子が不正
      expect(() => parseHandExtended('12-m')).toThrow(); // 順子が不完全
    });

    it('混在する赤ドラ記法', () => {
      const result = parseHandExtended('0m a5p r5s');
      expect(result.concealed.map(t => t.code)).toEqual(['0m', '0p', '0s']);
    });

    it('字牌記号の衝突ケース', () => {
      // r5m は赤五萬（發ではない）
      const result1 = parseHandExtended('r5m');
      expect(result1.concealed[0].code).toBe('0m');

      // r単独は發
      const result2 = parseHandExtended('t n s p h r c');
      expect(result2.concealed.map(t => t.code)).toEqual([
        '1z', '2z', '3z', '4z', '5z', '6z', '7z'
      ]);

      // 3p は三筒、p単独は北
      const result3 = parseHandExtended('3p p 3p');
      expect(result3.concealed.map(t => t.code)).toEqual(['3p', '4z', '3p']);
    });

    it('加槓の記法', () => {
      const result = parseHandExtended('5-55=0p');
      expect(result.melds[0]).toMatchObject({
        type: 'kakan',
        from: 'kamicha',
        calledTileIndex: 0
      });
      expect(result.melds[0].tiles.map(t => t.code)).toEqual([
        '5p', '5p', '5p', '0p'
      ]);
    });

    it('暗槓の両方式', () => {
      // 新篠ゆう方式
      const result1 = parseHandExtended('3333+s');
      expect(result1.melds[0]).toMatchObject({
        type: 'ankan'
      });
      expect(result1.melds[0].tiles[0].isFaceDown).toBe(true);
      expect(result1.melds[0].tiles[3].isFaceDown).toBe(true);

      // 牌画作成くん方式
      const result2 = parseHandExtended('o33so');
      expect(result2.melds[0]).toMatchObject({
        type: 'ankan'
      });
      expect(result2.melds[0].tiles[0].isFaceDown).toBe(true);
      expect(result2.melds[0].tiles[3].isFaceDown).toBe(true);
    });
  });
});
```

### ビジュアルテスト

各テストアプリで視覚的に確認：

```tsx
// apps/react-vite/src/App.tsx
<>
  <h2>新篠ゆう方式</h2>
  <Tiles hand="123m 2-13p 55-5s" />
  <Tiles hand="12m 444-4s 3333+s" />
  <Tiles hand="11m 5-55=0p" />

  <h2>牌画作成くん方式</h2>
  <Tiles hand="123m 2y13p 55y5s" />
  <Tiles hand="12m 444y4s o33so" />
  <Tiles hand="t n s p h r c" />

  <h2>混在</h2>
  <Tiles hand="123m 2-13p a5s" />
  <Tiles hand="11m 3333+s o66po" />

  <h2>エッジケース</h2>
  <Tiles hand="0m a5p r5s" />
  <Tiles hand="r5m 3p p" />
</>
```

## 実装チェックリスト

### Phase 0: 基盤整備
- [ ] 正規化関数の実装（`normalizeNotation`）
- [ ] バリデーション関数の実装（`validateMeld`, `validateHand`）
- [ ] 記法の自動判定ロジック（強化版正規表現）

### Phase 1: パーサー基礎
- [ ] 新篠ゆう方式の記号検出（`-`, `=`, `+`）
- [ ] 牌画作成くん方式の修飾子検出（`y`, `a`, `o`, `m`, `l`）
- [ ] 字牌の独自記号マップ（`tnsprhc` → `1z`〜`7z`）
- [ ] 字牌記号の衝突解決ロジック
- [ ] 赤ドラ修飾子のマップ（`a5m` → `0m`）
- [ ] 加槓記法の解釈（`5-55=0p`）

### Phase 2: データ構造
- [ ] `TileState` 型定義（`isFaceDown` フラグ採用）
- [ ] `MeldInfo` 型定義（`calledTileIndex` 追加）
- [ ] `Hand` 型定義
- [ ] `parseHandExtended` 関数実装
- [ ] 既存 `parseHand` の後方互換性維持

### Phase 3: レンダリング
- [ ] 副露面子のグループ化HTML構造
- [ ] 横向き牌のCSS（`mj-tile-rotated`）
- [ ] 面子間の間隔調整
- [ ] 伏せ牌のSVGアセット追加（`back.svg`）
- [ ] `isFaceDown` フラグに基づくレンダリング

### Phase 4: コンポーネント
- [ ] `Tiles` コンポーネントの拡張
- [ ] `Meld` コンポーネントの実装
- [ ] React対応
- [ ] Hono JSX対応
- [ ] Astro対応

### Phase 5: テスト
- [ ] パーサーのユニットテスト
- [ ] 各方式の統合テスト
- [ ] 混在記法のテスト
- [ ] エッジケースのテスト（追加分）
- [ ] バリデーションのテスト
- [ ] ビジュアルリグレッションテスト
- [ ] 全アプリでの動作確認

## マイルストーン

### M1: 新篠ゆう方式の基本対応（チー・ポン）
- パーサー実装
- レンダリング対応
- テスト

### M2: 牌画作成くん方式の基本対応
- 修飾子パーサー
- 字牌独自記号
- テスト

### M3: カン対応（大明槓・加槓・暗槓）
- 両方式の実装
- 伏せ牌表示
- テスト

### M4: 統合とリリース
- 混在記法のテスト
- ドキュメント整備
- 全アプリでの検証

## 参考資料

- [仕様書](./spec.md)
- [比較表](./comparison.md)
- [MPSZ拡張表記案](https://note.com/yuarasino/n/n1ba95bf3b618)
- [牌画作成くん](https://mahjong-manage.com/paiga/paiga1.php)
