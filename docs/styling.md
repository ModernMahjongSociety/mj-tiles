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
