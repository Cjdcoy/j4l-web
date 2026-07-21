import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { extname, join, parse } from "node:path";
import sharp from "sharp";

const root = new URL("..", import.meta.url).pathname;
const sourceDir = process.env.J4L_SCREENSHOT_DIR || join(root, "cod2", "added_to_mod");
const outputRoot = process.env.J4L_MAP_OUTPUT_DIR || join(root, "public", "maps");
const imageExts = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

const variants = [
  { name: "cards", width: 960, targetKB: 240, startQuality: 78, minQuality: 48 },
];

async function optimize(input, output, options) {
  let width = options.width;
  let quality = options.startQuality;
  let buffer = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    buffer = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .avif({ quality, effort: 5 })
      .toBuffer();

    if (buffer.length <= options.targetKB * 1024) {
      break;
    }

    if (quality > options.minQuality) {
      quality = Math.max(options.minQuality, quality - 8);
    } else {
      width = Math.max(320, Math.floor(width * 0.86));
      quality = options.startQuality;
    }
  }

  await writeFile(output, buffer);
  return { bytes: buffer.length, width, quality };
}

const files = (await readdir(sourceDir))
  .filter((file) => imageExts.has(extname(file).toLowerCase()))
  .sort((a, b) => a.localeCompare(b));

for (const variant of variants) {
  await mkdir(join(outputRoot, variant.name), { recursive: true });
}

const manifest = [];
let processed = 0;

for (const file of files) {
  const input = join(sourceDir, file);
  const inputStats = await stat(input);
  const key = parse(file).name;
  const record = { key, source: file, source_bytes: inputStats.size, outputs: {} };

  for (const variant of variants) {
    const output = join(outputRoot, variant.name, `${key}.avif`);
    const result = await optimize(input, output, variant);
    record.outputs[variant.name] = {
      path: `/maps/${variant.name}/${key}.avif`,
      bytes: result.bytes,
      width: result.width,
      quality: result.quality,
    };
  }

  manifest.push(record);
  processed += 1;
  if (processed % 25 === 0 || processed === files.length) {
    console.log(`Optimized ${processed}/${files.length}`);
  }
}

await writeFile(join(outputRoot, "images.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifest.length} optimized map image records`);
