# テスト実行方法

このプロジェクトはTurborepoモノレポで、複数のテストアプリケーションを含んでいます。

## 全体のテスト実行

```bash
# モノレポ全体のビルド（推奨：最初に実行）
bun run build

# 全アプリケーションのスナップショットテストを実行
bun run validate

# コアライブラリのユニットテストのみ実行
cd packages/mj-tiles && bun test
```

## 個別アプリのテスト実行

各テストアプリケーションのテストは、**アプリのディレクトリから実行する**ことを推奨します：

```bash
# Astro（.astro + MDX + React/Preact/Solid islands）
cd apps/astro && bun test src/validate.test.ts

# Hono JSX
cd apps/hono && bun test src/validate.test.ts

# Next.js（ビルドが必要）
cd apps/next && bun run build && bun test app/validate.test.tsx

# React + Vite（rootから実行可能）
bun test ./apps/react/src/validate.test.tsx
```

## コアライブラリのテスト

```bash
# パッケージディレクトリでテスト実行
cd packages/mj-tiles
bun test

# 特定のテストファイルのみ実行
bun test src/core/parser.test.ts
```

## スナップショットの更新

```bash
# 全体のスナップショット更新
bun run validate --update-snapshots

# 個別アプリのスナップショット更新（例：hono）
cd apps/hono && bun test src/validate.test.ts --update-snapshots
```

## 注意事項

### hono

- `bun test ./apps/hono/src/validate.test.ts` (rootから直接実行) は、Bunのモジュール解決の問題で失敗します
- 必ずアプリディレクトリから実行するか、`bun run validate` で一括実行してください

### react

- MDXファイルをBunテストランナーが直接トランスパイルできないため、テストではMDXファイルをインポートせず、コンポーネントを直接レンダリングしています
- この実装により、mj-tilesライブラリの動作を正しく検証できます

### next

- スナップショットテストの安定性のため、`next.config.mjs` で固定の `buildId` を使用しています
- テスト実行前に必ず `bun run build` でNext.jsアプリをビルドしてください
