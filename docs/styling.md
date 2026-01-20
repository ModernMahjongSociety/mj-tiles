# スタイリングオプション

mj-tiles は2種類のスタイリング方法をサポートしています。

## CSSクラスモード（デフォルト）

牌要素にCSSクラスを付与し、外部CSSファイルでスタイリングします。

```tsx
import { Tiles } from "mj-tiles/react";
import "mj-tiles/styles.css"; // CSSファイルのインポートが必要

<Tiles hand="123m456p789s" />
```

**メリット:**
- CSSファイルをブラウザがキャッシュできる
- スタイルとマークアップの分離
- カスタムCSSでのスタイルオーバーライドが容易

**デメリット:**
- CSSファイルを別途配信する必要がある
- バンドラーなし環境では設定が複雑

## インラインスタイルモード

HTMLにスタイルを直接埋め込みます。CSSファイルの配信が難しい環境に最適です。

```tsx
import { TileProvider, Tiles } from "mj-tiles/react";

<TileProvider config={{ styling: "inline" }}>
  <Tiles hand="123m456p789s" />
</TileProvider>
```

**メリット:**
- CSSファイルが不要で、配信設定がシンプル
- バンドラーなし環境（Hono、CDN経由のスクリプトなど）で便利
- SSRで完全にスタイル付きのHTMLを生成

**デメリット:**
- HTMLサイズが大きくなる
- ブラウザキャッシュが効かない
- カスタムスタイルの適用が難しい

## 使い分けガイド

| 環境 | 推奨スタイリング | 理由 |
|------|----------------|------|
| React + Vite/Webpack | `class` | バンドラーがCSSを最適化 |
| Next.js / Remix | `class` | フレームワークがCSS配信を処理 |
| Astro | `class` | ビルドツールがCSS処理を行う |
| Hono（静的ファイル配信あり） | `class` | `/public`などからCSSを配信可能 |
| Hono（バンドラーなし） | `inline` | CSSファイル配信の設定が不要 |
| CDN経由のスクリプト | `inline` | 外部依存を最小化 |

## カスタムアセット

デフォルトのアセットを独自のデザインに差し替えることができます：

```tsx
import { TileProvider } from "mj-tiles/react";
import type { TileAssets } from "mj-tiles/core";

const customAssets: TileAssets = {
  getSvg: (code) => {
    return myCustomSvgs[code];
  },
};

function App() {
  return (
    <TileProvider config={{ assets: customAssets }}>
      <Tiles hand="123m456p789s" />
    </TileProvider>
  );
}
```

## URL モード（CSR向け）

バンドルサイズを削減したい場合、URL参照モードを使用できます：

```tsx
import { TileProvider } from "mj-tiles/react";

const urlAssets = {
  getSvg: () => null,
  getUrl: (code) => `/tiles/${code}.svg`,
};

function App() {
  return (
    <TileProvider config={{ assets: urlAssets, mode: "url" }}>
      <Tiles hand="123m456p789s" />
    </TileProvider>
  );
}
```

## フレームワーク別の実装例

各環境での詳しい実装例は、以下のテストアプリを参照してください：

- **[Astro](../apps/astro/)** - .astro + MDX + React/Preact/Solid islands
- **[Hono](../apps/hono/)** - Hono JSXでのSSRサーバー（インラインスタイル）
- **[Next.js](../apps/next/)** - Next.js App Router + MDX
- **[React](../apps/react/)** - React + Vite実装（TSX + MDX統合）

---

## トラブルシューティング

### 画像が大きく表示される / スタイルが効かない

mj-tilesの画像が意図したサイズで表示されない場合、プロジェクトのCSSとの**詳細度（specificity）の競合**が原因である可能性があります。

#### 原因

多くのプロジェクトでは、リセットCSSやレイアウトスタイルで`img`要素に対してスタイルを設定しています：

```css
/* よくあるリセットCSS */
img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* レイアウトスタイルの例 */
.content img {
  height: auto;
  border-radius: 8px;
  margin: 24px 0;
}
```

これらのスタイルがmj-tilesの`.mj-tile`クラスより高い詳細度を持つ場合、`height: auto`が適用され、画像が元のサイズ（非常に大きい）で表示されます。

| セレクタ | 詳細度 |
|----------|--------|
| `.mj-tile` | (0, 1, 0) |
| `img` | (0, 0, 1) |
| `.content img` | (0, 1, 1) ← `.mj-tile`より高い |

#### 解決方法

**方法1: 競合するスタイルからmj-tileを除外する（推奨）**

```css
/* Before */
.content img {
  height: auto;
  border-radius: 8px;
  margin: 24px 0;
}

/* After */
.content img:not(.mj-tile) {
  height: auto;
  border-radius: 8px;
  margin: 24px 0;
}
```

**方法2: 高い詳細度でmj-tileのスタイルを定義する**

```css
/* グローバルCSSに追加 */
img.mj-tile {
  display: inline-block;
  height: 2em;  /* お好みのサイズに調整 */
  width: auto;
  vertical-align: -0.4em;
}
```

#### Astro での例

Astroのスコープ付きスタイルで`:global()`を使用している場合：

```astro
<style>
  /* Before */
  .content :global(img) {
    height: auto;
    border-radius: 8px;
    margin: 24px 0;
  }

  /* After */
  .content :global(img:not(.mj-tile)) {
    height: auto;
    border-radius: 8px;
    margin: 24px 0;
  }
</style>
```

### サイズのカスタマイズ

デフォルトのサイズ（`height: 1.5em`）を変更したい場合は、以下のようにCSSを追加してください：

```css
img.mj-tile {
  height: 2em;  /* 大きめ */
  vertical-align: -0.4em;  /* サイズに応じて調整 */
}
```

`em`単位を使用することで、周囲のテキストサイズに応じて自動的にスケールします。

---

## 補足: なぜ `import 'mj-tiles/styles.css'` だけでは不十分な場合があるのか

mj-tilesのスタイルシートをインポートしても、以下の理由でスタイルが効かないことがあります：

1. **CSSの読み込み順序**: プロジェクトのグローバルCSSやレイアウトスタイルが後に読み込まれると、同じ詳細度のスタイルは上書きされる
2. **詳細度の競合**: `.content img`のような複合セレクタは`.mj-tile`より詳細度が高い
3. **フレームワーク固有の挙動**: Astroのスコープ付きスタイルなど、フレームワークによってはスタイルの適用順序が異なる

これらの問題を回避するため、プロジェクト側でmj-tileを除外する設定を追加することを推奨します。