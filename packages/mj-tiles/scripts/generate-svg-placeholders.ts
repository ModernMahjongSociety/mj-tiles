import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const TILES_DIR = "src/assets/tiles";

// 萬子: 1m～9m
const manzu = Array.from({length: 9}, (_, i) => `${i+1}m`);
// 筒子: 1p～9p
const pinzu = Array.from({length: 9}, (_, i) => `${i+1}p`);
// 索子: 1s～9s
const souzu = Array.from({length: 9}, (_, i) => `${i+1}s`);
// 字牌: 1z～7z
const jihai = [
  {code: "1z", label: "東"},
  {code: "2z", label: "南"},
  {code: "3z", label: "西"},
  {code: "4z", label: "北"},
  {code: "5z", label: "白"},
  {code: "6z", label: "發"},
  {code: "7z", label: "中"},
];
// 赤ドラ: 0m, 0p, 0s
const akadora = ["0m", "0p", "0s"];

async function generateSvg(code: string, displayLabel?: string) {
  const label = displayLabel || code;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44">
  <rect fill="#f5f5f5" stroke="#333" stroke-width="0.5" width="32" height="44" rx="2"/>
  <text x="16" y="24" text-anchor="middle" font-size="10" fill="#333">${label}</text>
</svg>`;

  await writeFile(join(TILES_DIR, `${code}.svg`), svg);
}

async function generate() {
  await mkdir(TILES_DIR, { recursive: true });

  // 萬子・筒子・索子
  for (const code of [...manzu, ...pinzu, ...souzu]) {
    await generateSvg(code);
  }

  // 字牌（漢字ラベル付き）
  for (const {code, label} of jihai) {
    await generateSvg(code, label);
  }

  // 赤ドラ
  for (const code of akadora) {
    await generateSvg(code, `赤${code}`);
  }

  console.log(`Generated ${manzu.length + pinzu.length + souzu.length + jihai.length + akadora.length} SVG files`);
}

generate().catch(console.error);
