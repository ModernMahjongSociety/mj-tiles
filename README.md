# mj-tiles

麻雀牌表示ライブラリ - MDXやJSXで麻雀牌を簡単に表示するためのマルチフレームワーク対応ライブラリ

## 特徴

- **マルチフレームワーク対応**: React、Hono JSX、Astro（+ React/Preact/Solid islands）で使用可能
- **単一パッケージ**: サブパスエクスポートで必要な部分だけをインポート
- **TypeScript完全対応**: 型安全な開発が可能
- **SSR/CSR両対応**: インラインモード（SSR）とURLモード（CSR）をサポート
- **柔軟なスタイリング**: CSSクラス（デフォルト）またはインラインスタイルを選択可能

## インストール

```bash
npm install mj-tiles
# or
bun add mj-tiles
```

## クイックスタート

### React / Next.js

```tsx
import { Tiles, Tile } from "mj-tiles/react";
import "mj-tiles/styles.css";

function MyComponent() {
  return (
    <div>
      <Tiles hand="123m456p789s東南" />
      <p>単騎 <Tile tile="中" /> 待ち</p>
    </div>
  );
}
```

### Hono JSX

```tsx
import { TileProvider, Tiles } from "mj-tiles/hono";

app.get("/", (c) => {
  return c.html(
    <TileProvider config={{ styling: "inline" }}>
      <Tiles hand="123m456p789s東南" />
    </TileProvider>
  );
});
```

### Astro

```astro
---
import Tiles from 'mj-tiles/astro/Tiles.astro'
import 'mj-tiles/styles.css'
---

<Tiles hand="123m456p789s東南" />
```

## 手牌記法

```tsx
// 数牌
<Tiles hand="123m456p789s" />

// 字牌（漢字 or z形式）
<Tiles hand="東南西北白發中" />
<Tiles hand="1234567z" />

// 赤ドラ
<Tiles hand="0m0p0s" />      // 0形式
<Tiles hand="r5mr5pr5s" />   // r5形式
```

詳細は [手牌記法ドキュメント](./docs/notation.md) を参照してください。

## ドキュメント

- [手牌記法](./docs/notation.md) - 基本記法、副露記法の詳細
- [スタイリングオプション](./docs/styling.md) - CSSクラス vs インラインスタイル、カスタムアセット
- [テスト実行方法](./docs/testing.md) - モノレポでのテスト実行ガイド
- [アーキテクチャ](./docs/architecture.md) - 内部構造、拡張ガイド

## テストアプリ

各フレームワークでの実装例：

- [Astro](./apps/astro/) - .astro + MDX + React/Preact/Solid islands
- [Hono](./apps/hono/) - Hono JSXでのSSRサーバー
- [Next.js](./apps/next/) - Next.js App Router + MDX
- [React](./apps/react/) - React + Vite（TSX + MDX）

## 開発

```bash
bun install      # 依存関係のインストール
bun run build    # ビルド
bun run validate # テスト実行
```

詳細は [テスト実行方法](./docs/testing.md) を参照してください。
