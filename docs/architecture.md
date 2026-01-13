# アーキテクチャ

mj-tiles パッケージの詳細なアーキテクチャ説明です。

## レイヤー構造

```
assets/ (WebP画像データ)
  ↓ provides
core/ (パーサー + レンダラー)
  ↓ uses
react/, hono/, astro/ (フレームワーク固有の薄いラッパー)
```

## コアロジック（packages/mj-tiles/src/core/）

### parser.ts - 麻雀牌記法のパーサー

- `parseTile(input)`: 単一牌を `TileCode` (例: "1m", "7z") に変換
- `parseHand(input)`: 手牌記法（例: "123m456p東南"）を `TileCode[]` に変換
- `parseHandExtended(input)`: 副露（鳴き）を含む拡張記法を `Hand` オブジェクトに変換
- 漢字字牌（東南西北白發中）と数字形式（1-7z）の両方をサポート
- 赤ドラの2つの記法をサポート: `0m` と `r5m`

副露記法の詳細は [手牌記法](./notation.md) を参照。

### renderer.ts - HTMLレンダリングエンジン

- `createRenderer(config)`: 設定から `TileRenderer` を生成
- 2つのレンダリングモード (`mode`):
  - `inline`: 画像をHTMLに直接埋め込み（SSR向け、デフォルト）
  - `url`: `<img>` タグでURLを参照（CSR向け、バンドルサイズ削減）
- 2つのスタイリングモード (`styling`):
  - `class`: CSSクラスを使用（デフォルト、`styles.css`が必要）
  - `inline`: HTMLにスタイルを直接埋め込み（CSSファイル不要、バンドラーなし環境向け）
- カスタムCSSクラスのサポート（`class`モード時）

### types.ts - 共有型定義

- `TileCode`: 牌コード型（例: "1m", "2p", "3s", "7z"）
- `TileAssets`: アセット提供インターフェース
- `RendererConfig`: レンダラー設定

## アセット生成（packages/mj-tiles/src/assets/）

### generated.ts - 自動生成ファイル

- `src/assets/tiles-images/*.webp` から `bun run generate` で生成
- WebP画像をBase64エンコードしたデータURIのRecord
- 通常の牌と横向き牌（-rotated）の両方を含む
- **手動編集禁止**

## フレームワーク実装

### React (packages/mj-tiles/src/react/)

- Context API (`TileProvider`) でレンダラーを提供
- `Tile` と `Tiles` コンポーネントは `dangerouslySetInnerHTML` でHTMLを挿入
- `useTileRenderer` フックでレンダラーにアクセス可能

### Hono JSX (packages/mj-tiles/src/hono/)

- Reactと同様の構造だが、Hono JSXのエコシステム用
- Context APIとコンポーネント構造は同一
- バンドラーなし環境で使用されることが多いため、`styling: 'inline'` オプションが有用

### Astro (packages/mj-tiles/src/astro/)

- `.astro` ファイルを直接エクスポート（`package.json` の `exports` で指定）
- TypeScriptコンパイル対象外（`tsconfig.json` で除外）
- `getRenderer()` でシングルトンレンダラーを取得

## ビルドプロセス

ビルドは Turborepo により自動的に依存関係を考慮して実行されます：

1. `packages/mj-tiles` がまずビルドされる
2. 各 `apps/*` は `packages/mj-tiles` のビルド後にビルドされる

### mj-tiles パッケージのビルドステップ

1. `bun run generate` - WebP画像ファイルから `generated.ts` を生成
2. `tsc` - TypeScriptをJavaScriptにコンパイル
3. `cp src/styles.css dist/` - CSSファイルをコピー

**注意**: `packages/mj-tiles/src/assets/generated.ts` は常に最新のWebP画像から再生成されます。手動編集は失われます。

## 拡張ガイド

### 手牌記法の拡張

新しい記法を追加する場合は、`packages/mj-tiles/src/core/parser.ts` の `parseHand()` 関数を変更します。パーサーは左から右へ1文字ずつ処理し、以下のパターンに従います：

1. `r` フラグで赤ドラをマーク
2. 数字を蓄積
3. スート文字（m/p/s/z）または漢字字牌で確定

テストは `packages/mj-tiles/src/core/parser.test.ts` に追加してください。

### 新しいフレームワークの追加

1. `packages/mj-tiles/src/{framework}/` ディレクトリを作成
2. レンダラーを使用するコンポーネントを実装
3. `packages/mj-tiles/package.json` の `exports` にサブパスを追加
4. `peerDependencies` と `peerDependenciesMeta` を更新
5. `apps/` に新しいテストアプリケーションを追加

### 新しいテストアプリの追加

1. `apps/{app-name}/` ディレクトリを作成
2. フレームワークの標準構成でセットアップ
3. `package.json` に `"mj-tiles": "workspace:*"` を追加
4. root の `package.json` の `workspaces` に自動的に含まれる
