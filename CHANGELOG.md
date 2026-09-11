# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-09-11

### Added
- 麻雀牌画像のアクセシビリティ対応（accessible name / aria-label の日本語生成）
- `TileAssets.getSize` を追加し、遅延読み込み中の画像領域を `width`/`height` で確保

### Fixed
- 横向き牌の描画サイズと、遅延読み込み時のレイアウトシフトを修正

### Changed
- `TileAssets.getUrl` は該当画像が無い場合に `undefined` を返す（横向き画像を持たない牌はCSS回転にフォールバック）
- アセット生成の出力順を安定化

## [0.2.0] - 2026-01-24

### Added
- CSS詳細度を強化し、Tailwind CSSとの併用をサポート
- スタイリングのトラブルシューティングセクションをドキュメントに追加

### Changed
- 依存関係の更新（bun.lock）

## [0.1.0] - 2024-12-XX

### Added
- 初回リリース
- React、Hono JSX、Astro対応の麻雀牌表示ライブラリ
- MDXサポート
- 文中インライン表示対応
- 手牌記法パーサー
- WebPベースの画像アセット
