import { mkdir, stat, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import sharp from "sharp";

const projectRoot = new URL("..", import.meta.url).pathname;
const sourceRoot =
  process.env.J4L_RANK_SOURCE_DIR || join(projectRoot, "..", "jump4life", "assets", "ranks");
const outputRoot = process.env.J4L_RANK_OUTPUT_DIR || join(projectRoot, "public", "ranks");

const sources = [
  ...Array.from({ length: 8 }, (_, index) => ({
    input: join(sourceRoot, "core", `rank_core_${String(index + 1).padStart(2, "0")}.png`),
    output: `rank-core-${String(index + 1).padStart(2, "0")}.avif`,
    width: 360,
  })),
  ...Array.from({ length: 7 }, (_, index) => ({
    input: join(sourceRoot, "mythic", `mythic_${String(index + 1).padStart(2, "0")}.png`),
    output: `rank-mythic-${String(index + 1).padStart(2, "0")}.avif`,
    width: 360,
  })),
  ...Array.from({ length: 10 }, (_, index) => ({
    input: join(sourceRoot, "prestige", `p${index + 1}.png`),
    output: `rank-prestige-${String(index + 1).padStart(2, "0")}.avif`,
    width: 640,
  })),
  ...Array.from({ length: 10 }, (_, index) => ({
    input: join(sourceRoot, "prestige", `p${index + 1}.png`),
    output: `rank-prestige-${String(index + 1).padStart(2, "0")}-compact.avif`,
    width: 192,
    height: 96,
    trim: true,
  })),
];

await mkdir(outputRoot, { recursive: true });

const manifest = [];
let sourceBytes = 0;
let outputBytes = 0;

for (const source of sources) {
  const output = join(outputRoot, source.output);
  const sourceStats = await stat(source.input);

  let pipeline = sharp(source.input).rotate();
  pipeline = source.trim
    ? pipeline
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .resize({
          width: source.width,
          height: source.height,
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
    : pipeline.resize({ width: source.width, withoutEnlargement: true });

  await pipeline.avif({ quality: 74, effort: 6, chromaSubsampling: "4:4:4" }).toFile(output);

  const image = sharp(output);
  const [metadata, pixelStats, convertedStats] = await Promise.all([image.metadata(), image.stats(), stat(output)]);
  const alpha = pixelStats.channels[3];
  if (!metadata.hasAlpha || metadata.channels !== 4 || !alpha || alpha.min !== 0 || alpha.max !== 255) {
    throw new Error(`Transparency validation failed for ${source.output}`);
  }

  sourceBytes += sourceStats.size;
  outputBytes += convertedStats.size;
  manifest.push({
    source: basename(source.input),
    path: `/ranks/${source.output}`,
    width: metadata.width,
    height: metadata.height,
    bytes: convertedStats.size,
    alpha: { min: alpha.min, max: alpha.max },
  });
}

await writeFile(join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const mib = (bytes) => (bytes / 1024 / 1024).toFixed(2);
console.log(`Converted ${manifest.length} transparent rank images: ${mib(sourceBytes)} MiB -> ${mib(outputBytes)} MiB`);
