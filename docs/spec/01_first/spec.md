# mj-tiles - 麻雀牌表示ライブラリ

## 概要

MDXやJSXで麻雀牌を簡単に表示するためのマルチフレームワーク対応ライブラリを作成する。
単一パッケージでサブパスエクスポートを使い、Hono方式の設計にする。
Bunで開発・ビルドを行う。

## 要件

- 単一パッケージ `mj-tiles` でサブパスエクスポート
- フレームワーク非依存のコアロジック
- React、Hono JSX、Astro用アダプター
- デフォルトSVGアセットをインラインでバンドル（34種の牌）
- ユーザーによるカスタムアセット差し替え可能
- SSR前提だがCSR向けURL参照モードも提供
- TypeScript完全対応
- tree-shaking対応

## 使用例

```tsx
// React / Next.js / Remix
import { Tiles } from 'mj-tiles/react'
<Tiles hand="123m456p789s東南" />

// HonoX
import { Tiles } from 'mj-tiles/hono'
<Tiles hand="123m456p789s東南" />

// Astro / MDX
---
import Tiles from 'mj-tiles/astro/Tiles.astro'
import Tile from 'mj-tiles/astro/Tile.astro'
---
<Tiles hand="123m456p789s東南" />
単騎 <Tile tile="中" /> 待ち

// カスタムアセット
import { createRenderer } from 'mj-tiles/core'
import type { TileAssets } from 'mj-tiles/core'

const customAssets: TileAssets = {
  getSvg: (code) => myCustomSvgs[code]
}
const renderer = createRenderer({ assets: customAssets })
```

## ディレクトリ構成

```
mj-tiles/
├── src/
│   ├── core/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── parser.ts
│   │   └── renderer.ts
│   ├── assets/
│   │   ├── index.ts
│   │   ├── tiles/          # 元SVGファイル（ビルド用）
│   │   │   ├── 1m.svg
│   │   │   └── ...
│   │   └── generated.ts    # スクリプトで生成
│   ├── react/
│   │   ├── index.ts
│   │   ├── context.tsx
│   │   └── components.tsx
│   ├── hono/
│   │   ├── index.ts
│   │   ├── context.tsx
│   │   └── components.tsx
│   ├── astro/
│   │   ├── index.ts        # configureTiles, getRenderer
│   │   ├── config.ts
│   │   ├── Tile.astro      # そのまま配布
│   │   └── Tiles.astro     # そのまま配布
│   └── styles.css
├── scripts/
│   └── generate-assets.ts
├── dist/                   # ビルド成果物（.astro以外）
├── package.json
├── tsconfig.json
└── README.md
```

## package.json

```json
{
  "name": "mj-tiles",
  "version": "0.0.1",
  "type": "module",
  "sideEffects": false,
  "exports": {
    "./core": {
      "import": {
        "types": "./dist/core/index.d.ts",
        "default": "./dist/core/index.js"
      }
    },
    "./assets": {
      "import": {
        "types": "./dist/assets/index.d.ts",
        "default": "./dist/assets/index.js"
      }
    },
    "./react": {
      "import": {
        "types": "./dist/react/index.d.ts",
        "default": "./dist/react/index.js"
      }
    },
    "./hono": {
      "import": {
        "types": "./dist/hono/index.d.ts",
        "default": "./dist/hono/index.js"
      }
    },
    "./astro": {
      "import": {
        "types": "./dist/astro/index.d.ts",
        "default": "./dist/astro/index.js"
      }
    },
    "./astro/Tile.astro": "./src/astro/Tile.astro",
    "./astro/Tiles.astro": "./src/astro/Tiles.astro",
    "./styles.css": "./dist/styles.css"
  },
  "files": ["dist", "src/astro/*.astro", "README.md"],
  "scripts": {
    "generate": "bun run scripts/generate-assets.ts",
    "build": "bun run generate && bun run build:ts",
    "build:ts": "tsc && bun run build:copy",
    "build:copy": "cp src/styles.css dist/",
    "test": "bun test",
    "prepublishOnly": "bun run build"
  },
  "peerDependencies": {
    "react": ">=18",
    "hono": ">=4",
    "astro": ">=4"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "hono": { "optional": true },
    "astro": { "optional": true }
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/react": "^18",
    "typescript": "^5.0.0",
    "react": "^18",
    "hono": "^4",
    "astro": "^4",
    "svgo": "^3"
  },
  "license": "MIT"
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  },
  "include": ["src/**/*"],
  "exclude": ["src/assets/tiles", "src/**/*.astro", "**/*.test.ts"]
}
```

## src/core/types.ts

```ts
export type Suit = "m" | "p" | "s" | "z";
export type TileCode = `${number}${Suit}`;

export interface TileAssets {
  getSvg: (code: TileCode) => string | null;
  getUrl?: (code: TileCode) => string; // CSR向けURL参照
}

export interface RendererConfig {
  assets: TileAssets;
  mode?: "inline" | "url"; // デフォルト: inline
  class?: {
    tile?: string;
    tiles?: string;
    error?: string;
  };
}

export interface TileRenderer {
  tile: (input: string) => string;
  hand: (input: string) => string;
}
```

## src/core/parser.ts

```ts
import type { TileCode } from "./types";

const HONOR_MAP: Record<string, TileCode> = {
  東: "1z",
  南: "2z",
  西: "3z",
  北: "4z",
  白: "5z",
  發: "6z",
  中: "7z",
};

const CODE_TO_LABEL: Record<string, string> = {
  "1z": "東",
  "2z": "南",
  "3z": "西",
  "4z": "北",
  "5z": "白",
  "6z": "發",
  "7z": "中",
};

export function parseTile(input: string): TileCode | null {
  if (HONOR_MAP[input]) return HONOR_MAP[input];
  if (/^[0-9][mpsz]$/.test(input)) return input as TileCode;
  return null;
}

export function parseHand(input: string): TileCode[] {
  const tiles: TileCode[] = [];
  let nums: string[] = [];

  for (const char of input) {
    if (/[0-9]/.test(char)) {
      nums.push(char);
    } else if (/[mpsz]/.test(char)) {
      tiles.push(...nums.map((n) => `${n}${char}` as TileCode));
      nums = [];
    } else if (HONOR_MAP[char]) {
      tiles.push(HONOR_MAP[char]);
    }
  }
  return tiles;
}

export function getTileLabel(code: TileCode): string {
  return CODE_TO_LABEL[code] ?? code;
}
```

## src/core/renderer.ts

```ts
import type { TileCode, RendererConfig, TileRenderer } from "./types";
import { parseTile, parseHand, getTileLabel } from "./parser";

export function createRenderer(config: RendererConfig): TileRenderer {
  const mode = config.mode ?? "inline";
  const cls = {
    tile: config.class?.tile ?? "mj-tile",
    tiles: config.class?.tiles ?? "mj-tiles",
    error: config.class?.error ?? "mj-tile-error",
  };

  function renderTileCode(code: TileCode): string {
    const label = getTileLabel(code);

    if (mode === "url" && config.assets.getUrl) {
      const url = config.assets.getUrl(code);
      return `<img class="${cls.tile}" src="${url}" alt="${label}" width="32" height="44" />`;
    }

    const svg = config.assets.getSvg(code);
    if (!svg) {
      return `<span class="${cls.error}">[${label}]</span>`;
    }

    const svgWithAttrs = svg.replace(
      "<svg",
      `<svg aria-label="${label}" class="${cls.tile}"`,
    );
    return svgWithAttrs;
  }

  return {
    tile(input: string): string {
      const code = parseTile(input);
      if (!code) return `<span class="${cls.error}">[${input}]</span>`;
      return renderTileCode(code);
    },

    hand(input: string): string {
      const codes = parseHand(input);
      const rendered = codes.map(renderTileCode).join("");
      return `<span class="${cls.tiles}">${rendered}</span>`;
    },
  };
}
```

## src/core/index.ts

```ts
export * from "./types";
export * from "./parser";
export { createRenderer } from "./renderer";
```

## scripts/generate-assets.ts

```ts
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { optimize } from "svgo";

const TILES_DIR = "src/assets/tiles";
const OUTPUT = "src/assets/generated.ts";

async function generate() {
  const files = await readdir(TILES_DIR);
  const entries: Record<string, string> = {};

  for (const file of files) {
    if (!file.endsWith(".svg")) continue;

    const code = file.replace(".svg", "");
    const content = await readFile(join(TILES_DIR, file), "utf-8");

    const result = optimize(content, {
      multipass: true,
      plugins: ["preset-default", "removeDimensions"],
    });

    entries[code] = result.data.replace(/'/g, "\\'");
  }

  const lines = Object.entries(entries)
    .map(([code, svg]) => `  '${code}': '${svg}'`)
    .join(",\n");

  const output = `// Auto-generated by scripts/generate-assets.ts - do not edit
import type { TileCode } from '../core/types'

export const tiles: Record<TileCode, string> = {
${lines}
} as const
`;

  await writeFile(OUTPUT, output);
  console.log(`Generated ${Object.keys(entries).length} tiles`);
}

generate().catch(console.error);
```

## src/assets/index.ts

```ts
import { tiles } from "./generated";
import type { TileAssets, TileCode } from "../core/types";

export const defaultAssets: TileAssets = {
  getSvg: (code: TileCode) => tiles[code] ?? null,
};

export { tiles };
```

## src/react/context.tsx

```tsx
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  createRenderer,
  type RendererConfig,
  type TileRenderer,
} from "../core";
import { defaultAssets } from "../assets";

const defaultRenderer = createRenderer({ assets: defaultAssets });
const TileContext = createContext<TileRenderer>(defaultRenderer);

export interface TileProviderProps {
  config?: Partial<RendererConfig>;
  children: ReactNode;
}

export function TileProvider({ config, children }: TileProviderProps) {
  const renderer = useMemo(
    () =>
      createRenderer({
        assets: config?.assets ?? defaultAssets,
        mode: config?.mode,
        class: config?.class,
      }),
    [config],
  );

  return (
    <TileContext.Provider value={renderer}>{children}</TileContext.Provider>
  );
}

export function useTileRenderer(): TileRenderer {
  return useContext(TileContext);
}
```

## src/react/components.tsx

```tsx
import { useTileRenderer } from "./context";

interface TileProps {
  tile: string;
  className?: string;
}

export function Tile({ tile, className }: TileProps) {
  const renderer = useTileRenderer();
  const html = renderer.tile(tile);

  return (
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

interface TilesProps {
  hand: string;
  className?: string;
}

export function Tiles({ hand, className }: TilesProps) {
  const renderer = useTileRenderer();
  const html = renderer.hand(hand);

  return (
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
```

## src/react/index.ts

```ts
export { TileProvider, useTileRenderer } from "./context";
export type { TileProviderProps } from "./context";
export { Tile, Tiles } from "./components";
```

## src/hono/context.tsx

```tsx
import { createContext, useContext } from "hono/jsx";
import {
  createRenderer,
  type RendererConfig,
  type TileRenderer,
} from "../core";
import { defaultAssets } from "../assets";

const defaultRenderer = createRenderer({ assets: defaultAssets });
const TileContext = createContext<TileRenderer>(defaultRenderer);

export const TileProvider = TileContext.Provider;

export function useTileRenderer(): TileRenderer {
  return useContext(TileContext);
}

export function createTileConfig(
  config?: Partial<RendererConfig>,
): TileRenderer {
  return createRenderer({
    assets: config?.assets ?? defaultAssets,
    mode: config?.mode,
    class: config?.class,
  });
}
```

## src/hono/components.tsx

```tsx
import type { FC } from "hono/jsx";
import { raw } from "hono/html";
import { useTileRenderer } from "./context";

interface TileProps {
  tile: string;
}

export const Tile: FC<TileProps> = ({ tile }) => {
  const renderer = useTileRenderer();
  return raw(renderer.tile(tile));
};

interface TilesProps {
  hand: string;
}

export const Tiles: FC<TilesProps> = ({ hand }) => {
  const renderer = useTileRenderer();
  return raw(renderer.hand(hand));
};
```

## src/hono/index.ts

```ts
export { TileProvider, useTileRenderer, createTileConfig } from "./context";
export { Tile, Tiles } from "./components";
```

## src/astro/config.ts

```ts
import {
  createRenderer,
  type RendererConfig,
  type TileRenderer,
} from "../core";
import { defaultAssets } from "../assets";

let globalRenderer: TileRenderer = createRenderer({ assets: defaultAssets });

export function configureTiles(config: Partial<RendererConfig>): void {
  globalRenderer = createRenderer({
    assets: config.assets ?? defaultAssets,
    mode: config.mode,
    class: config.class,
  });
}

export function getRenderer(): TileRenderer {
  return globalRenderer;
}
```

## src/astro/index.ts

```ts
export { configureTiles, getRenderer } from "./config";
// .astroファイルは別途直接importする:
// import Tiles from 'mj-tiles/astro/Tiles.astro'
```

## src/astro/Tile.astro

```astro
---
import { getRenderer } from 'mj-tiles/astro'

interface Props {
  tile: string
}

const { tile } = Astro.props
const html = getRenderer().tile(tile)
---

<Fragment set:html={html} />
```

## src/astro/Tiles.astro

```astro
---
import { getRenderer } from 'mj-tiles/astro'

interface Props {
  hand: string
}

const { hand } = Astro.props
const html = getRenderer().hand(hand)
---

<Fragment set:html={html} />
```

## src/styles.css

```css
.mj-tile {
  display: inline-block;
  width: 32px;
  height: 44px;
  vertical-align: middle;
}

.mj-tiles {
  display: inline-flex;
  gap: 2px;
  align-items: center;
}

.mj-tile-error {
  display: inline-block;
  padding: 2px 4px;
  color: #dc2626;
  font-size: 12px;
  background: #fef2f2;
  border-radius: 2px;
}
```

## SVGファイル命名規則

src/assets/tiles/ に配置:

- 萬子: 1m.svg 〜 9m.svg
- 筒子: 1p.svg 〜 9p.svg
- 索子: 1s.svg 〜 9s.svg
- 字牌: 1z.svg(東), 2z.svg(南), 3z.svg(西), 4z.svg(北), 5z.svg(白), 6z.svg(發), 7z.svg(中)
- 赤ドラ（オプション）: 0m.svg, 0p.svg, 0s.svg

## 実装順序

1. プロジェクト初期化（bun init）
2. package.json、tsconfig.json設定
3. src/core 実装
4. scripts/generate-assets.ts 作成
5. src/assets/tiles にプレースホルダーSVG配置
6. src/assets 実装（generate実行）
7. src/react 実装
8. src/hono 実装
9. src/astro 実装（.astroファイル含む）
10. src/styles.css 作成
11. ビルド確認
12. テスト作成

## テスト

```ts
// src/core/parser.test.ts
import { describe, test, expect } from "bun:test";
import { parseTile, parseHand } from "./parser";

describe("parseTile", () => {
  test("数牌をパース", () => {
    expect(parseTile("1m")).toBe("1m");
    expect(parseTile("5p")).toBe("5p");
    expect(parseTile("9s")).toBe("9s");
  });

  test("字牌をパース", () => {
    expect(parseTile("東")).toBe("1z");
    expect(parseTile("中")).toBe("7z");
  });
});

describe("parseHand", () => {
  test("手牌文字列をパース", () => {
    expect(parseHand("123m")).toEqual(["1m", "2m", "3m"]);
    expect(parseHand("123m456p")).toEqual(["1m", "2m", "3m", "4p", "5p", "6p"]);
    expect(parseHand("東南西北")).toEqual(["1z", "2z", "3z", "4z"]);
  });
});
```

## 注意事項

- .astroファイルはビルドせずsrcからそのまま配布（Astro側でコンパイル）
- SSR前提の設計なのでクライアントバンドルサイズは問題にならない
- CSR使用時はmode: 'url'を推奨
- アクセシビリティ: SVGにaria-labelを付与
