# mj-tiles

麻雀牌表示ライブラリ - MDXやJSXで麻雀牌を簡単に表示するためのマルチフレームワーク対応ライブラリ

## 特徴

- **マルチフレームワーク対応**: React、Hono JSX、Astro で使用可能
- **単一パッケージ**: サブパスエクスポートで必要な部分だけをインポート
- **TypeScript完全対応**: 型安全な開発が可能
- **tree-shaking対応**: 使用する部分だけがバンドルされる
- **カスタマイズ可能**: デフォルトのSVGアセットを簡単に差し替え可能
- **SSR/CSR両対応**: インラインモード（SSR）とURLモード（CSR）をサポート

## インストール

```bash
npm install mj-tiles
# or
bun add mj-tiles
```

## 使用例

### React / Next.js / Remix

```tsx
import { Tiles, Tile } from 'mj-tiles/react'
import 'mj-tiles/styles.css'

function MyComponent() {
  return (
    <div>
      <Tiles hand="123m456p789s東南" />
      <p>単騎 <Tile tile="中" /> 待ち</p>
    </div>
  )
}
```

### Hono JSX

```tsx
import { Tiles } from 'mj-tiles/hono'

app.get('/', (c) => {
  return c.html(
    <html>
      <head>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Tiles hand="123m456p789s東南" />
      </body>
    </html>
  )
})
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
import { TileProvider } from 'mj-tiles/react'
import type { TileAssets } from 'mj-tiles/core'

const customAssets: TileAssets = {
  getSvg: (code) => {
    // 独自のSVGを返す
    return myCustomSvgs[code]
  }
}

function App() {
  return (
    <TileProvider config={{ assets: customAssets }}>
      <Tiles hand="123m456p789s" />
    </TileProvider>
  )
}
```

## URL モード（CSR向け）

バンドルサイズを削減したい場合、URL参照モードを使用できます：

```tsx
import { TileProvider } from 'mj-tiles/react'

const urlAssets = {
  getSvg: () => null,
  getUrl: (code) => `/tiles/${code}.svg`
}

function App() {
  return (
    <TileProvider config={{ assets: urlAssets, mode: 'url' }}>
      <Tiles hand="123m456p789s" />
    </TileProvider>
  )
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

## ライセンス

MIT
