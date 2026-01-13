# CLAUDE.md

Think in English and answer in Japanese.
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

これは **mj-tiles** の Turborepo モノレポです。mj-tiles は麻雀牌表示ライブラリで、React、Hono JSX、Astro などのマルチフレームワークに対応しています。

### モノレポ構造

```
mj-tiles-monorepo/
├── packages/
│   └── mj-tiles/          # メインライブラリパッケージ
└── apps/                  # テスト・デモアプリケーション
    ├── astro/             # Astro（.astro + MDX）
    ├── hono/              # Hono JSX
    ├── next/              # Next.js（App Router + MDX）
    └── react/             # React + Vite（TSX + MDX）
```

## コマンド

### モノレポレベル（root）

```bash
# 依存関係のインストール
bun install

# すべてのパッケージとアプリをビルド
bun run build

# すべてのテストを実行
bun run test

# すべてのバリデーションを実行
bun run validate

# すべての開発サーバーを起動
bun run dev
```

### パッケージ固有（packages/mj-tiles/）

```bash
# SVGプレースホルダーを生成（開発中のみ使用）
cd packages/mj-tiles
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

### mj-tiles パッケージ構造

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

### コアロジック（packages/mj-tiles/src/core/）

**parser.ts** - 麻雀牌記法のパーサー

- `parseTile(input)`: 単一牌を `TileCode` (例: "1m", "7z") に変換
- `parseHand(input)`: 手牌記法（例: "123m456p東南"）を `TileCode[]` に変換
- 漢字字牌（東南西北白發中）と数字形式（1-7z）の両方をサポート
- 赤ドラの2つの記法をサポート: `0m` と `r5m`

**renderer.ts** - HTMLレンダリングエンジン

- `createRenderer(config)`: 設定から `TileRenderer` を生成
- 2つのレンダリングモード (`mode`):
  - `inline`: SVGをHTMLに直接埋め込み（SSR向け、デフォルト）
  - `url`: `<img>` タグでURLを参照（CSR向け、バンドルサイズ削減）
- 2つのスタイリングモード (`styling`):
  - `class`: CSSクラスを使用（デフォルト、`styles.css`が必要）
  - `inline`: HTMLにスタイルを直接埋め込み（CSSファイル不要、バンドラーなし環境向け）
- カスタムCSSクラスのサポート（`class`モード時）

**types.ts** - 共有型定義

- `TileCode`: 牌コード型（例: "1m", "2p", "3s", "7z"）
- `TileAssets`: アセット提供インターフェース
- `RendererConfig`: レンダラー設定

### アセット生成（packages/mj-tiles/src/assets/）

**generated.ts** - 自動生成ファイル

- `src/assets/tiles/*.svg` から `bun run generate` で生成
- SVGOで最適化されたSVG文字列のRecord
- 手動編集禁止

### フレームワーク実装

**React** (packages/mj-tiles/src/react/)

- Context API (`TileProvider`) でレンダラーを提供
- `Tile` と `Tiles` コンポーネントは `dangerouslySetInnerHTML` でHTMLを挿入
- `useTileRenderer` フックでレンダラーにアクセス可能

**Hono JSX** (packages/mj-tiles/src/hono/)

- Reactと同様の構造だが、Hono JSXのエコシステム用
- Context APIとコンポーネント構造は同一
- バンドラーなし環境で使用されることが多いため、`styling: 'inline'` オプションが有用

**Astro** (packages/mj-tiles/src/astro/)

- `.astro` ファイルを直接エクスポート（`package.json` の `exports` で指定）
- TypeScriptコンパイル対象外（`tsconfig.json` で除外）
- `getRenderer()` でシングルトンレンダラーを取得

### テストアプリケーション（apps/）

各アプリケーションは異なるフレームワークとツールチェーンで mj-tiles ライブラリをテストするためのものです。各アプリは複数のパターン（基本TSX/astroとMDX）を1つのアプリ内でテストします：

- **astro**: Astro実装（.astroコンポーネント + MDX統合）
- **hono**: Hono JSXでのSSRサーバー（インラインスタイリング）
- **next**: Next.js App Router + MDX
- **react**: React + Vite実装（TSX + MDX統合）

## 重要な実装ルール

### スタイリングモードの選択

ライブラリは2つのスタイリングモードをサポートしています：

**CSSクラスモード (`styling: 'class'`)** - デフォルト

- `styles.css` ファイルを外部CSSとして読み込む必要がある
- ブラウザキャッシュが有効で、パフォーマンスに優れる
- カスタムCSSでスタイルをオーバーライド可能
- バンドラー環境（Vite、Webpack、Next.jsなど）で推奨

**インラインスタイルモード (`styling: 'inline'`)**

- スタイルをHTML要素の `style` 属性に直接埋め込む
- CSSファイルの配信が不要で、設定がシンプル
- バンドラーなし環境（Hono、CDN経由のスクリプトなど）で有用
- HTMLサイズが大きくなるが、外部依存がない

**実装の注意点**:

- `renderer.ts` の `createRenderer()` で `config.styling` の値を確認
- `class` モード時は、`config.class` で指定されたCSSクラスを使用
- `inline` モード時は、`styles.css` の内容を `style` 属性に直接埋め込む
- デフォルトは `'class'` で、後方互換性を維持

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

### ビルドプロセス

ビルドは Turborepo により自動的に依存関係を考慮して実行されます：

1. `packages/mj-tiles` がまずビルドされる
2. 各 `apps/*` は `packages/mj-tiles` のビルド後にビルドされる

**mj-tiles パッケージのビルドステップ**:

1. `bun run generate` - SVGファイルから `generated.ts` を生成
2. `tsc` - TypeScriptをJavaScriptにコンパイル
3. `cp src/styles.css dist/` - CSSファイルをコピー

**注意**: `packages/mj-tiles/src/assets/generated.ts` は常に最新のSVGファイルから再生成されます。手動編集は失われます。

### 新しいテストアプリの追加

1. `apps/{app-name}/` ディレクトリを作成
2. フレームワークの標準構成でセットアップ
3. `package.json` に `"mj-tiles": "workspace:*"` を追加
4. root の `package.json` の `workspaces` に自動的に含まれる

## 開発ワークフロー

1. **ライブラリの変更**: `packages/mj-tiles/` で変更を行い、`bun test` でテスト
2. **ビルド**: `bun run build` (root) でモノレポ全体をビルド
3. **テストアプリで確認**: 各 `apps/` で動作確認
4. **バリデーション**: `bun run validate` で全アプリのスナップショットテストを実行

## テスト実行方法

### 全体のテスト・バリデーション

```bash
# モノレポ全体のビルド（推奨：最初に実行）
bun run build

# 全アプリケーションのスナップショットテストを実行
bun run validate

# コアライブラリのユニットテストのみ実行
cd packages/mj-tiles && bun test
```

### 個別アプリのテスト実行

各テストアプリケーションのテストは、**アプリのディレクトリから実行する**ことを推奨します：

```bash
# Astro（.astro + MDX）
cd apps/astro && bun test src/validate.test.ts

# Hono JSX
cd apps/hono && bun test src/validate.test.ts

# Next.js（ビルドが必要）
cd apps/next && bun run build && bun test app/validate.test.tsx

# React + Vite（rootから実行可能）
bun test ./apps/react/src/validate.test.tsx
```

### テスト実行時の重要な注意点

**honoの既知の制限**:

- `bun test ./apps/hono/src/validate.test.ts` (rootから直接実行) は、Bunのモジュール解決の問題で失敗します
- 必ずアプリディレクトリから実行するか、`bun run validate` で一括実行してください

**reactの実装**:

- MDXファイルをBunテストランナーが直接トランスパイルできないため、テストではMDXファイルをインポートせず、コンポーネントを直接レンダリングしています
- この実装により、mj-tilesライブラリの動作を正しく検証できます

**nextの実装**:

- スナップショットテストの安定性のため、`next.config.mjs` で固定の `buildId` を使用しています
- テスト実行前に必ず `bun run build` でNext.jsアプリをビルドしてください

### スナップショットの更新

スナップショットを更新する場合：

```bash
# 全体のスナップショット更新
bun run validate --update-snapshots

# 個別アプリのスナップショット更新（例：hono）
cd apps/hono && bun test src/validate.test.ts --update-snapshots
```
