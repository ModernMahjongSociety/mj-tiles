import { readdir, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

const SOURCE_DIR = process.env.HOME + "/Downloads/pai-images";
const OUTPUT_DIR = "src/assets/tiles-images";
const QUALITY = 85;

// ファイル名からTileCodeへのマッピング
const FILENAME_TO_TILECODE: Record<string, string> = {
  // 萬子
  man1: "1m", man2: "2m", man3: "3m", man4: "4m", man5: "5m",
  man6: "6m", man7: "7m", man8: "8m", man9: "9m",
  // 筒子
  pin1: "1p", pin2: "2p", pin3: "3p", pin4: "4p", pin5: "5p",
  pin6: "6p", pin7: "7p", pin8: "8p", pin9: "9p",
  // 索子
  sou1: "1s", sou2: "2s", sou3: "3s", sou4: "4s", sou5: "5s",
  sou6: "6s", sou7: "7s", sou8: "8s", sou9: "9s",
  // 字牌
  ji1: "1z", ji2: "2z", ji3: "3z", ji4: "4z",
  ji5: "5z", ji6: "6z", ji7: "7z",
  // 赤ドラ
  aka1: "0m", aka2: "0p", aka3: "0s",
  // 裏面
  hai: "back",
};

async function convertImages() {
  // 出力ディレクトリを作成
  await mkdir(OUTPUT_DIR, { recursive: true });

  const files = await readdir(SOURCE_DIR);
  const embFiles = files.filter(f => f.includes("-66-90-l") && f.includes("-emb.png"));

  let converted = 0;
  let skipped = 0;

  for (const file of embFiles) {
    // 横向き画像かどうかを判定（例: man1-66-90-l-yoko-emb.png）
    const isRotated = file.includes("-yoko-");

    // ファイル名からベース名を抽出
    const baseName = isRotated
      ? file.split("-66-90-l-yoko-emb.png")[0]
      : file.split("-66-90-l-emb.png")[0];
    const tileBaseName = baseName;

    const tileCode = FILENAME_TO_TILECODE[tileBaseName];
    if (!tileCode) {
      console.log(`Skipped: ${file} (no mapping found)`);
      skipped++;
      continue;
    }

    const outputFileName = isRotated
      ? `${tileCode}-rotated.webp`
      : `${tileCode}.webp`;

    const inputPath = join(SOURCE_DIR, file);
    const outputPath = join(OUTPUT_DIR, outputFileName);

    try {
      await sharp(inputPath)
        .webp({ quality: QUALITY, alphaQuality: 100 })
        .toFile(outputPath);

      converted++;
      console.log(`✓ ${file} → ${outputFileName}`);
    } catch (error) {
      console.error(`✗ Failed to convert ${file}:`, error);
    }
  }

  console.log(`\nConversion complete: ${converted} converted, ${skipped} skipped`);

  // 裏面画像の確認
  const backExists = embFiles.some(f => f.startsWith("hai-66-90-l-emb.png"));
  if (!backExists) {
    console.warn("\n⚠️  Warning: 裏面画像 (hai-66-90-l-emb.png) が見つかりませんでした。");
    console.warn("   別途用意してください。");
  }
}

convertImages().catch(console.error);
