# mj-tiles

麻雀牌表示ライブラリ - MDXやJSXで麻雀牌を簡単に表示するためのマルチフレームワーク対応ライブラリ

## 特徴

- **マルチフレームワーク対応**: React、Hono JSX、Astro で使用可能
- **単一パッケージ**: サブパスエクスポートで必要な部分だけをインポート
- **TypeScript完全対応**: 型安全な開発が可能
- **tree-shaking対応**: 使用する部分だけがバンドルされる
- **カスタマイズ可能**: デフォルトのSVGアセットを簡単に差し替え可能
- **SSR/CSR両対応**: インラインモード（SSR）とURLモード（CSR）をサポート
- **柔軟なスタイリング**: CSSクラス（デフォルト）またはインラインスタイルを選択可能

## インストール

```bash
npm install mj-tiles
# or
bun add mj-tiles
```

## 使用例

### React / Next.js / Remix

```tsx
import { Tiles, Tile } from "mj-tiles/react";
import "mj-tiles/styles.css";

function MyComponent() {
  return (
    <div>
      <Tiles hand="123m456p789s東南" />
      <p>
        単騎 <Tile tile="中" /> 待ち
      </p>
    </div>
  );
}
```

### Hono JSX

#### CSSファイルを使用する場合（デフォルト）

```tsx
import { Tiles } from "mj-tiles/hono";

app.get("/", (c) => {
  return c.html(
    <html>
      <head>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Tiles hand="123m456p789s東南" />
      </body>
    </html>,
  );
});
```

#### バンドラーなし環境（インラインスタイル）

CSSファイルの配信が難しい環境では、インラインスタイルを使用できます：

```tsx
import { TileProvider, Tiles } from "mj-tiles/hono";

app.get("/", (c) => {
  return c.html(
    <TileProvider config={{ styling: "inline" }}>
      <html>
        <body>
          <Tiles hand="123m456p789s東南" />
        </body>
      </html>
    </TileProvider>,
  );
});
```

### Astro

```astro
---
import Tiles from 'mj-tiles/astro/Tiles.astro'
import Tile from 'mj-tiles/astro/Tile.astro'
import 'mj-tiles/styles.css'
---

<html>
  <body>
    <Tiles hand="123m456p789s東南" />
    <p>単騎 <Tile tile="中" /> 待ち</p>
  </body>
</html>
```

## 手牌記法

以下の記法で手牌を指定できます：

### 基本記法

- **数牌**: `123m` (萬子)、`456p` (筒子)、`789s` (索子)
- **字牌（漢字）**: `東南西北白發中`
- **字牌（数字）**: `1234567z` (東南西北白發中)
- **赤ドラ**: `0m`、`0p`、`0s` または `r5m`、`r5p`、`r5s`

### 使用例

```tsx
// 数牌のみ
<Tiles hand="123m456p789s" />

// 字牌（漢字）
<Tiles hand="東南西北白發中" />

// 字牌（z形式）
<Tiles hand="1234567z" />

// 国士無双（z形式）
<Tiles hand="19m19p19s1234567z" />

// 赤ドラ（0形式）
<Tiles hand="1230m456p789s" />

// 赤ドラ（r5形式）
<Tiles hand="123mr5p789s" />
<Tiles hand="r5mr5pr5s" />  // 赤5萬、赤5筒、赤5索
```

## カスタムアセット

デフォルトのSVGアセットを独自のデザインに差し替えることができます：

```tsx
import { TileProvider } from "mj-tiles/react";
import type { TileAssets } from "mj-tiles/core";

const customAssets: TileAssets = {
  getSvg: (code) => {
    // 独自のSVGを返す
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

## スタイリングオプション

mj-tiles は2種類のスタイリング方法をサポートしています：

### CSSクラスモード（デフォルト）

デフォルトでは、牌要素にCSSクラスを付与し、外部CSSファイルでスタイリングします。

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

### インラインスタイルモード

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

### 使い分けガイド

| 環境 | 推奨スタイリング | 理由 |
|------|----------------|------|
| React + Vite/Webpack | `class` | バンドラーがCSSを最適化 |
| Next.js / Remix | `class` | フレームワークがCSS配信を処理 |
| Astro | `class` | ビルドツールがCSS処理を行う |
| Hono（静的ファイル配信あり） | `class` | `/public`などからCSSを配信可能 |
| Hono（バンドラーなし） | `inline` | CSSファイル配信の設定が不要 |
| CDN経由のスクリプト | `inline` | 外部依存を最小化 |

### フレームワーク別の実装例

各環境での詳しい実装例は、以下のドキュメントを参照してください：

- **[Hono JSX（インラインスタイル）](./apps/hono-jsx/README.md)** - バンドラーなし環境でのインラインスタイル実装
- **[React + Vite（CSSクラス）](./apps/react-vite/README.md)** - バンドラー環境でのCSSクラス実装とカスタマイズ方法

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

## 開発

```bash
# 依存関係のインストール
bun install

# SVGプレースホルダーを生成
bun run generate:svg

# ビルド
bun run build

# テスト
bun test
```

## テスト実行方法

このプロジェクトはTurborepoモノレポで、複数のテストアプリケーションを含んでいます。

### 全体のテスト実行

```bash
# モノレポ全体のビルドとバリデーション（推奨）
bun run build
bun run validate
```

### 個別アプリのテスト実行

各アプリケーションのテストは、**そのアプリのディレクトリから実行する**必要があります：

```bash
# Astro基本実装
cd apps/astro-basic && bun test src/validate.test.ts

# Astro + MDX
cd apps/astro-mdx && bun test src/validate.test.ts

# Hono JSX
cd apps/hono-jsx && bun test src/validate.test.ts

# Next.js + MDX
cd apps/next-mdx && bun run build && bun test app/validate.test.tsx

# React + Vite
bun test ./apps/react-vite/src/validate.test.tsx

# Vite + React + MDX
bun test ./apps/vite-react-mdx/src/validate.test.tsx
```

**注意**: 一部のテスト（特にhono-jsx）は、Bunのモジュール解決の都合上、rootディレクトリから直接実行すると失敗する場合があります。この場合は上記のようにアプリディレクトリから実行するか、`bun run validate` で一括実行してください。

### コアライブラリのテスト

```bash
# パッケージディレクトリでテスト実行
cd packages/mj-tiles
bun test

# 特定のテストファイルのみ実行
bun test src/core/parser.test.ts
```
