# React + Vite テストアプリ

このアプリは、React + Vite環境でmj-tilesライブラリをテストするためのものです。

## 特徴

このアプリは**CSSクラスモード**（デフォルト）を使用しています。これにより、外部CSSファイルでスタイルを管理し、ブラウザキャッシュのメリットを享受できます。

### CSSクラスモードの利点（Vite環境）

1. **ブラウザキャッシュが有効** - CSSファイルがキャッシュされ、パフォーマンス向上
2. **HTMLサイズが小さい** - スタイルがCSSファイルに分離される
3. **カスタマイズが容易** - CSSでスタイルをオーバーライド可能
4. **Viteの最適化** - バンドラーがCSSを自動で処理・最適化

## 実装例

```tsx
import { TileProvider, Tile, Tiles } from 'mj-tiles/react'
import { defaultAssets } from 'mj-tiles/assets'
import 'mj-tiles/styles.css'  // ← CSSファイルをインポート

export default function App() {
  return (
    <TileProvider config={{ assets: defaultAssets }}>
      <h1>React Vite Tiles</h1>
      <Tile tile="1m" />
      <Tiles hand="123m456p789s東南西" />
    </TileProvider>
  )
}
```

### 重要なポイント

- `import 'mj-tiles/styles.css'` でCSSファイルをインポート
- `styling` オプションを指定しない場合、デフォルトで `'class'` モードになる
- Viteが自動的にCSSを処理し、最適化してバンドルに含める
- 本番ビルドではCSSが最小化され、フィンガープリント付きのファイル名で出力される

## 開発とテスト

```bash
# 開発サーバーを起動
bun run dev

# 本番ビルド
bun run build

# バリデーションテストを実行
bun run validate
```

開発サーバーを起動すると、http://localhost:5173 で確認できます。

## カスタムスタイルの適用

CSSクラスモードでは、独自のCSSでスタイルをオーバーライドできます：

```css
/* src/custom-tiles.css */
.mj-tile {
  transform: scale(1.2);
  margin: 0 4px;
}

.mj-tiles {
  background: #f0f0f0;
  padding: 10px;
  border-radius: 8px;
}
```

```tsx
import 'mj-tiles/styles.css'
import './custom-tiles.css'  // カスタムスタイル

<TileProvider config={{
  assets: defaultAssets,
  class: {
    tile: 'mj-tile custom-tile',  // カスタムクラスを追加
    tiles: 'mj-tiles custom-tiles'
  }
}}>
  <Tiles hand="123m456p789s" />
</TileProvider>
```

## インラインスタイルモードとの比較

もしCSSファイルのインポートを避けたい場合は、インラインスタイルモードも使用できます：

```tsx
import { TileProvider, Tile, Tiles } from 'mj-tiles/react'
import { defaultAssets } from 'mj-tiles/assets'
// import 'mj-tiles/styles.css'  // ← 不要

export default function App() {
  return (
    <TileProvider config={{
      assets: defaultAssets,
      styling: "inline"  // ← インラインスタイルモード
    }}>
      <h1>React Vite Tiles</h1>
      <Tile tile="1m" />
      <Tiles hand="123m456p789s東南西" />
    </TileProvider>
  )
}
```

ただし、インラインスタイルモードでは：
- HTMLサイズが大きくなる
- ブラウザキャッシュが効かない
- カスタムスタイルの適用が難しい

という欠点があるため、Vite環境ではCSSクラスモード（デフォルト）を推奨します。

## 関連リンク

- [mj-tiles メインドキュメント](../../README.md)
- [Vite公式ドキュメント](https://vitejs.dev/)
- [React公式ドキュメント](https://react.dev/)
