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

## CSS変数によるカスタマイズ

mj-tilesはCSS変数を使用しており、簡単にスタイルをカスタマイズできます：

```css
:root {
  /* 牌のサイズ */
  --mj-tile-height: 2em;        /* デフォルト: 1.5em */
  --mj-tile-vertical-align: -0.4em;  /* デフォルト: -0.3em */

  /* 牌の間隔 */
  --mj-tiles-gap: 4px;          /* デフォルト: 2px */
  --mj-hand-gap: 12px;          /* 副露間の間隔、デフォルト: 8px */

  /* エラー表示 */
  --mj-error-color: #dc2626;
  --mj-error-bg: #fef2f2;
}
```

`em`単位を使用しているため、周囲のテキストサイズに応じて自動的にスケールします。

---

## Tailwind CSS との統合

mj-tilesのCSSは`@layer components`を使用しており、Tailwind CSSとシームレスに統合できます。

### 基本的な使い方

```tsx
import { Tiles } from "mj-tiles/react";
import "mj-tiles/styles.css";  // Tailwindのスタイルと一緒にインポート

<Tiles hand="123m456p789s" />
```

### ユーティリティクラスでの上書き

Tailwindの`utilities`レイヤーは`components`より優先されるため、ユーティリティクラスで直接スタイルを上書きできます：

```tsx
// 牌を大きく表示
<Tiles hand="123m" className="[&_.mj-tile]:h-8" />

// 間隔を広げる
<Tiles hand="123m" className="gap-2" />
```

### CSS変数をTailwindテーマと統合

`tailwind.config.js`でCSS変数をテーマに追加：

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      height: {
        'tile': 'var(--mj-tile-height, 1.5em)',
        'tile-lg': '2em',
        'tile-xl': '2.5em',
      },
    },
  },
}
```

```tsx
<Tiles hand="123m" className="[&_.mj-tile]:h-tile-lg" />
```

### グローバルでサイズを変更

```css
/* globals.css */
@layer base {
  :root {
    --mj-tile-height: 2em;
  }
}
```

---

## 詳細度の設計

mj-tilesは`.mj-tile.mj-tile`セレクタを使用し、詳細度を`(0, 2, 0)`に設定しています。これにより、一般的なリセットCSSやレイアウトスタイルとの競合を回避できます：

| セレクタ | 詳細度 | 結果 |
|----------|--------|------|
| `img` | (0, 0, 1) | mj-tilesが勝つ |
| `.content img` | (0, 1, 1) | mj-tilesが勝つ |
| `.mj-tile.mj-tile` | (0, 2, 0) | ← mj-tiles |
| `#main img` | (1, 0, 1) | IDセレクタが勝つ |

IDセレクタを使用している場合は、CSS変数で上書きするか、より高い詳細度でスタイルを定義してください。

---

## トラブルシューティング

### それでもスタイルが効かない場合

1. **CSSファイルがインポートされているか確認**
   ```tsx
   import "mj-tiles/styles.css";
   ```

2. **IDセレクタとの競合**
   IDセレクタ（`#content img`など）は詳細度が高いため、CSS変数で対応：
   ```css
   #content {
     --mj-tile-height: 1.5em;
   }
   ```

3. **インラインスタイルモードを使用**
   CSSの競合を完全に回避したい場合：
   ```tsx
   <TileProvider config={{ styling: "inline" }}>
     <Tiles hand="123m" />
   </TileProvider>
   ```