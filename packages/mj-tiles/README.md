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

## ドキュメント

詳細なドキュメントは [GitHubリポジトリ](https://github.com/ModernMahjongSociety/mj-tiles) をご覧ください。

- [手牌記法](https://github.com/ModernMahjongSociety/mj-tiles/blob/main/docs/notation.md) - 基本記法、副露記法の詳細
- [スタイリングオプション](https://github.com/ModernMahjongSociety/mj-tiles/blob/main/docs/styling.md) - CSSクラス vs インラインスタイル、カスタムアセット
- [アーキテクチャ](https://github.com/ModernMahjongSociety/mj-tiles/blob/main/docs/architecture.md) - 内部構造、拡張ガイド

## 謝辞

本ライブラリで使用している麻雀牌画像は、[麻雀豆腐](https://majandofu.com)さんの[麻雀牌画像素材](https://majandofu.com/mahjong-images)を使用させていただいております。素敵な素材を提供してくださり、ありがとうございます。

牌姿表記は、以下を参考にさせていただきました：
- [新篠ゆう](https://note.com/yuarasino)さんの[MPSZ拡張表記案](https://note.com/yuarasino/n/n1ba95bf3b618)
- [牌画作成くん byその研](https://mahjong-manage.com/paiga/paiga1.php)

## ライセンス

MIT
