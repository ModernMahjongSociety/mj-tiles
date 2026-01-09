# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

```bash
# 依存関係のインストール
bun install

# SVGプレースホルダーを生成（開発中のみ使用）
bun run generate:svg

# SVGアセットからTypeScriptコードを生成
bun run generate

# ビルド（generate + tsc + CSSコピー）
bun run build

# TypeScriptコンパイルのみ
bun run build:ts

# テスト実行
bun test

# 単一テストファイルの実行
bun test src/core/parser.test.ts
```

## アーキテクチャ

### パッケージ構造

このライブラリは、サブパスエクスポートを使用した単一パッケージとして設計されています：

- `mj-tiles/core` - フレームワーク非依存のコアロジック
- `mj-tiles/assets` - SVGアセットとデフォルト設定
- `mj-tiles/react` - React用コンポーネント
- `mj-tiles/hono` - Hono JSX用コンポーネント
- `mj-tiles/astro` - Astro用コンポーネント（.astroファイルを直接エクスポート）

### レイヤー構造

```
assets/ (SVGデータ)
  ↓ provides
core/ (パーサー + レンダラー)
  ↓ uses
react/, hono/, astro/ (フレームワーク固有の薄いラッパー)
```

### コアロジック（src/core/）

**parser.ts** - 麻雀牌記法のパーサー
- `parseTile(input)`: 単一牌を `TileCode` (例: "1m", "7z") に変換
- `parseHand(input)`: 手牌記法（例: "123m456p東南"）を `TileCode[]` に変換
- 漢字字牌（東南西北白發中）と数字形式（1-7z）の両方をサポート
- 赤ドラの2つの記法をサポート: `0m` と `r5m`

**renderer.ts** - HTMLレンダリングエンジン
- `createRenderer(config)`: 設定から `TileRenderer` を生成
- 2つのレンダリングモード:
  - `inline`: SVGをHTMLに直接埋め込み（SSR向け、デフォルト）
  - `url`: `<img>` タグでURLを参照（CSR向け、バンドルサイズ削減）
- カスタムCSSクラスのサポート

**types.ts** - 共有型定義
- `TileCode`: 牌コード型（例: "1m", "2p", "3s", "7z"）
- `TileAssets`: アセット提供インターフェース
- `RendererConfig`: レンダラー設定

### アセット生成（src/assets/）

**generated.ts** - 自動生成ファイル
- `src/assets/tiles/*.svg` から `bun run generate` で生成
- SVGOで最適化されたSVG文字列のRecord
- 手動編集禁止

### フレームワーク実装

**React** (src/react/)
- Context API (`TileProvider`) でレンダラーを提供
- `Tile` と `Tiles` コンポーネントは `dangerouslySetInnerHTML` でHTMLを挿入
- `useTileRenderer` フックでレンダラーにアクセス可能

**Hono JSX** (src/hono/)
- Reactと同様の構造だが、Hono JSXのエコシステム用
- Context APIとコンポーネント構造は同一

**Astro** (src/astro/)
- `.astro` ファイルを直接エクスポート（`package.json` の `exports` で指定）
- TypeScriptコンパイル対象外（`tsconfig.json` で除外）
- `getRenderer()` でシングルトンレンダラーを取得

## 重要な実装ルール

### 手牌記法の拡張

新しい記法を追加する場合は、`src/core/parser.ts` の `parseHand()` 関数を変更します。パーサーは左から右へ1文字ずつ処理し、以下のパターンに従います：

1. `r` フラグで赤ドラをマーク
2. 数字を蓄積
3. スート文字（m/p/s/z）または漢字字牌で確定

テストは `src/core/parser.test.ts` に追加してください。

### 新しいフレームワークの追加

1. `src/{framework}/` ディレクトリを作成
2. レンダラーを使用するコンポーネントを実装
3. `package.json` の `exports` にサブパスを追加
4. `peerDependencies` と `peerDependenciesMeta` を更新

### ビルドプロセス

ビルドは以下の順序で実行されます：
1. `bun run generate` - SVGファイルから `generated.ts` を生成
2. `tsc` - TypeScriptをJavaScriptにコンパイル
3. `cp src/styles.css dist/` - CSSファイルをコピー

**注意**: `src/assets/generated.ts` は常に最新のSVGファイルから再生成されます。手動編集は失われます。
