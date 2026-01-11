# Hono JSX テストアプリ

このアプリは、Hono JSX環境でmj-tilesライブラリをテストするためのものです。

## 特徴

このアプリは**インラインスタイルモード** (`styling: 'inline'`) を使用しています。これにより、外部CSSファイルの配信なしで麻雀牌を表示できます。

### インラインスタイルモードの利点（Hono環境）

1. **CSSファイル配信が不要** - バンドラーなし環境で設定がシンプル
2. **完全なSSR** - スタイル付きのHTMLを直接生成
3. **外部依存なし** - HTMLだけで完結

## 実装例

```tsx
import { Hono } from 'hono'
import { TileProvider, Tile, Tiles, createTileConfig } from 'mj-tiles/hono'
import { defaultAssets } from 'mj-tiles/assets'

const app = new Hono()

app.get('/', (c) => {
  const renderer = createTileConfig({
    assets: defaultAssets,
    styling: "inline"  // ← インラインスタイルモード
  })

  return c.html(
    <TileProvider value={renderer}>
      <html>
        <head><title>Hono JSX Test (Inline Styling)</title></head>
        <body>
          <h1>Hono JSX Tiles</h1>
          <Tile tile="1m" />
          <Tiles hand="123m456p789s東南西" />
        </body>
      </html>
    </TileProvider>
  )
})

export default {
  port: 3000,
  fetch: app.fetch,
}
```

### 重要なポイント

- `createTileConfig({ styling: "inline" })` でインラインスタイルモードを指定
- `<link rel="stylesheet">` タグは不要
- 各牌要素にスタイルが `style` 属性として埋め込まれる
- Bunで直接実行可能（バンドラー不要）

## 開発とテスト

```bash
# 開発サーバーを起動
bun run dev

# ビルド
bun run build

# バリデーションテストを実行（アプリディレクトリから）
bun run validate
```

開発サーバーを起動すると、http://localhost:3000 で確認できます。

## CSSクラスモードとの比較

もしCSSファイルを配信できる環境であれば、以下のようにCSSクラスモードも使用できます：

```tsx
const renderer = createTileConfig({
  assets: defaultAssets,
  styling: "class"  // ← CSSクラスモード（デフォルト）
})

return c.html(
  <TileProvider value={renderer}>
    <html>
      <head>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Tiles hand="123m456p789s" />
      </body>
    </html>
  </TileProvider>
)
```

ただし、この場合は`mj-tiles/styles.css`を静的ファイルとして配信する必要があります。

## 関連リンク

- [mj-tiles メインドキュメント](../../README.md)
- [Hono公式ドキュメント](https://hono.dev/)
