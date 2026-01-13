import sharp from "sharp";
import { mkdir } from "fs/promises";

const OUTPUT_DIR = "src/assets/tiles-images";
const WIDTH = 66;
const HEIGHT = 90;

async function generateBackTile() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  // 黄色の縞模様の裏面画像を生成
  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 斜め縞パターン -->
    <pattern id="stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="4" height="8" fill="#FFD700" />
      <rect x="4" width="4" height="8" fill="#FFA500" />
    </pattern>
  </defs>

  <!-- 外枠（濃いゴールド） -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#B8860B" rx="4" />

  <!-- 縞模様の背景 -->
  <rect x="3" y="3" width="${WIDTH - 6}" height="${HEIGHT - 6}" fill="url(#stripes)" rx="2" />

  <!-- 内側の枠線 -->
  <rect x="3" y="3" width="${WIDTH - 6}" height="${HEIGHT - 6}" fill="none" stroke="#B8860B" stroke-width="1" rx="2" />

  <!-- 中央装飾（オプション） -->
  <circle cx="${WIDTH / 2}" cy="${HEIGHT / 2}" r="8" fill="none" stroke="#B8860B" stroke-width="2" opacity="0.3" />
</svg>`.trim();

  await sharp(Buffer.from(svg))
    .webp({ quality: 85 })
    .toFile(`${OUTPUT_DIR}/back.webp`);

  console.log("✓ Generated back.webp (黄色の縞模様の裏面画像)");
}

generateBackTile().catch(console.error);
