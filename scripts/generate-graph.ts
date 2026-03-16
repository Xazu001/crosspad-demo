// Generates PWA icons from icon.png and copies OG graph assets.
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(__dirname, "../public/assets/icon.png");
const outputDir = path.join(__dirname, "../public/assets/graph");
const ogGraphPath = path.join(__dirname, "../public/assets/crosspad-og-graph.png");

const iconSizes = [
  { size: 32, name: "favicon-32x32.png" },
  { size: 96, name: "favicon-96x96.png" },
  { size: 192, name: "icon-192x192.png" },
  { size: 512, name: "icon-512x512.png" },
  { size: 1024, name: "icon-1024x1024.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 167, name: "apple-touch-icon-167x167.png" },
  { size: 152, name: "apple-touch-icon-152x152.png" },
  { size: 144, name: "msapplication-icon-144x144.png" },
  { size: 70, name: "mstile-70x70.png" },
  { size: 150, name: "mstile-150x150.png" },
  { size: 310, name: "mstile-310x310.png" },
];

async function main() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Copy OG graph
  if (fs.existsSync(ogGraphPath)) {
    fs.copyFileSync(ogGraphPath, path.join(outputDir, "crosspad-og-graph.png"));
    console.log("✅ OG graph copied");
  }

  // Generate icons
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ icon.png not found: ${inputPath}`);
    process.exit(1);
  }

  // Extract background color from edge of source image
  const metadata = await sharp(inputPath).metadata();
  const { width = 512, height = 512 } = metadata;

  // Sample edge pixels to determine background color
  const edgeBuffer = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });

  const { data, info } = edgeBuffer;
  const channels = info.channels;
  const hasAlpha = channels >= 4;

  // Sample pixels from a ring around center (70-85% distance) to find background color
  const samplePoints: number[] = [];
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const maxDist = Math.min(width, height) / 2;
  const innerRadius = maxDist * 0.7; // 70% from center
  const outerRadius = maxDist * 0.85; // 85% from center (in the dark background ring)

  // Sample points in a ring around center
  const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  for (const angle of angles) {
    const rad = (angle * Math.PI) / 180;
    const midRadius = (innerRadius + outerRadius) / 2;
    const x = Math.round(centerX + Math.cos(rad) * midRadius);
    const y = Math.round(centerY + Math.sin(rad) * midRadius);
    const idx = (y * width + x) * channels;
    if (idx >= 0 && idx < data.length - channels) {
      samplePoints.push(idx);
    }
  }

  // Collect non-transparent pixels
  let r = 0,
    g = 0,
    b = 0,
    count = 0;
  for (const idx of samplePoints) {
    if (idx >= 0 && idx < data.length - 2) {
      const alpha = hasAlpha ? data[idx + 3] : 255;
      if (alpha > 128) {
        // Only use non-transparent pixels
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
    }
  }

  // Fallback to center if no edge pixels found
  if (count === 0) {
    const centerIdx = (Math.floor(height / 2) * width + Math.floor(width / 2)) * channels;
    r = data[centerIdx] || 0;
    g = data[centerIdx + 1] || 0;
    b = data[centerIdx + 2] || 0;
    count = 1;
  }

  const edgeColor = {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
    alpha: 1,
  };

  console.log(
    `  🎨 Detected edge color: rgb(${edgeColor.r}, ${edgeColor.g}, ${edgeColor.b}) from ${count} samples`,
  );

  for (const { size, name } of iconSizes) {
    await sharp(inputPath)
      .resize(size, size, { fit: "cover" })
      .flatten({ background: edgeColor })
      .png({ quality: 90 })
      .toFile(path.join(outputDir, name));
    console.log(`  ✅ ${name} (${size}x${size})`);
  }

  // Favicon (rounded)
  const size = 32;
  const roundedSvg = `<svg width="${size}" height="${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="black"/>
  </svg>`;
  const roundedMask = sharp(Buffer.from(roundedSvg)).png();

  await sharp(inputPath)
    .resize(size, size, { fit: "cover" })
    .flatten({ background: edgeColor })
    .composite([{ input: await roundedMask.toBuffer(), blend: "dest-in" }])
    .toFile(path.join(__dirname, "../public/favicon.ico"));
  console.log("  ✅ favicon.ico (rounded)");

  // Maskable icons - filled with background color
  for (const size of [192, 512]) {
    await sharp(inputPath)
      .resize(size, size, { fit: "cover" })
      .flatten({ background: edgeColor })
      .png({ quality: 90 })
      .toFile(path.join(outputDir, `icon-maskable-${size}x${size}.png`));
    console.log(`  ✅ icon-maskable-${size}x${size}.png`);
  }

  // Update manifest.json
  const manifestPath = path.join(__dirname, "../public/manifest.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.icons = [
      {
        src: "/assets/graph/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/graph/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/assets/graph/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/graph/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/assets/graph/icon-1024x1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
    ];
    if (manifest.shortcuts) {
      manifest.shortcuts.forEach((s: any) => {
        s.icons = [{ src: "/assets/graph/icon-96x96.png", sizes: "96x96" }];
      });
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log("  ✅ manifest.json updated");
  }

  console.log(`\n✅ Done! → ${outputDir}`);
}

main();
