# CLAUDE.md

Think in English and answer in Japanese.
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**mj-tiles** の Turborepo モノレポ。麻雀牌表示ライブラリで、React、Hono JSX、Astro に対応。

### モノレポ構造

```
mj-tiles-monorepo/
├── packages/
│   └── mj-tiles/          # メインライブラリパッケージ
└── apps/                  # テスト・デモアプリケーション
    ├── astro/             # Astro（.astro + MDX + React/Preact/Solid islands）
    ├── hono/              # Hono JSX
    ├── next/              # Next.js（App Router + MDX）
    └── react/             # React + Vite（TSX + MDX）
```

## コマンド

### モノレポレベル（root）

```bash
bun install        # 依存関係のインストール
bun run build      # すべてのパッケージとアプリをビルド
bun run test       # すべてのテストを実行
bun run validate   # すべてのバリデーションを実行
bun run dev        # すべての開発サーバーを起動
```

### パッケージ固有（packages/mj-tiles/）

```bash
cd packages/mj-tiles
bun run generate   # WebP画像からTypeScriptコードを生成
bun run build      # ビルド（generate + tsc + CSSコピー）
bun test           # テスト実行
bun test src/core/parser.test.ts  # 単一テストファイル
```

## アーキテクチャ概要

### サブパスエクスポート

- `mj-tiles/core` - フレームワーク非依存のコアロジック
- `mj-tiles/assets` - 画像アセットとデフォルト設定
- `mj-tiles/react` - React用コンポーネント
- `mj-tiles/hono` - Hono JSX用コンポーネント
- `mj-tiles/astro` - Astro用コンポーネント

### レイヤー構造

```
assets/ (WebP画像データ)
  ↓ provides
core/ (パーサー + レンダラー)
  ↓ uses
react/, hono/, astro/ (フレームワーク固有ラッパー)
```

詳細は [アーキテクチャドキュメント](./docs/architecture.md) を参照。

## 開発ワークフロー

1. **ライブラリの変更**: `packages/mj-tiles/` で変更を行い、`bun test` でテスト
2. **ビルド**: `bun run build` (root) でモノレポ全体をビルド
3. **テストアプリで確認**: 各 `apps/` で動作確認
4. **バリデーション**: `bun run validate` で全アプリのスナップショットテストを実行

## ドキュメント

- [手牌記法](./docs/notation.md) - 基本記法、副露記法の詳細
- [スタイリングオプション](./docs/styling.md) - CSSクラス vs インラインスタイル
- [テスト実行方法](./docs/testing.md) - モノレポでのテスト実行ガイド
- [アーキテクチャ](./docs/architecture.md) - 内部構造、拡張ガイド
