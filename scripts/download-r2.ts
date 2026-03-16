// Downloads objects from R2 bucket with folder selection and resume support.
import * as fs from "fs";
import * as path from "path";

import {
  askQuestion,
  checkR2BucketExists,
  chunk,
  config,
  downloadR2ObjectsParallel,
  listR2Objects,
} from "./lib";

interface DownloadState {
  bucket: string;
  sourceFolder: string;
  completedKeys: string[];
  lastUpdated: string;
}

const STATE_FILE = ".download-state.json";

function extractFolders(keys: string[]): string[] {
  const folders = new Set<string>();
  for (const key of keys) {
    const parts = key.split("/");
    if (parts.length > 1) folders.add(parts[0]);
  }
  return Array.from(folders).sort();
}

function loadState(destDir: string): DownloadState | null {
  const p = path.join(destDir, STATE_FILE);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function saveState(destDir: string, bucket: string, folder: string, keys: string[]) {
  fs.writeFileSync(
    path.join(destDir, STATE_FILE),
    JSON.stringify(
      {
        bucket,
        sourceFolder: folder,
        completedKeys: keys,
        lastUpdated: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

function clearState(destDir: string) {
  const p = path.join(destDir, STATE_FILE);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

async function selectFolder(folders: string[]): Promise<string> {
  if (folders.length === 0) return "";

  console.log("\n  📂 Folders:");
  console.log("     0. [ALL]");
  folders.forEach((f, i) => console.log(`    ${String(i + 1).padStart(2)}. ${f}/`));

  const answer = await askQuestion(`\n  Select folder (0-${folders.length}): `);
  const idx = parseInt(answer, 10);
  if (idx >= 1 && idx <= folders.length) return folders[idx - 1];
  return "";
}

async function main() {
  const bucket = config.r2.bucket;
  console.log(`� Bucket: ${bucket} [${config.env}]\n`);

  if (!(await checkR2BucketExists(config))) {
    throw new Error(`Bucket "${bucket}" not found`);
  }

  const objects = await listR2Objects(config);
  const allKeys = objects.map((o) => o.key).filter(Boolean);

  if (allKeys.length === 0) {
    console.log("✅ Bucket is empty");
    return;
  }

  console.log(`📊 ${allKeys.length} object(s)`);

  const folders = extractFolders(allKeys);
  const sourceFolder = await selectFolder(folders);
  const keysToDownload = sourceFolder
    ? allKeys.filter((k) => k.startsWith(sourceFolder + "/"))
    : allKeys;

  console.log(
    `✅ Selected: ${keysToDownload.length} object(s)${sourceFolder ? ` from "${sourceFolder}/"` : ""}`,
  );
  if (keysToDownload.length === 0) return;

  const defaultDest = path.join(process.cwd(), "scripts/default-kits", bucket);
  const customDest = await askQuestion(`\n  Destination (Enter for ${defaultDest}): `);
  const destDir = customDest.trim() || defaultDest;

  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  // Resume support
  const state = loadState(destDir);
  let keys = keysToDownload;
  let resuming = false;

  if (
    state?.bucket === bucket &&
    state.sourceFolder === sourceFolder &&
    state.completedKeys.length > 0
  ) {
    const completedSet = new Set(state.completedKeys);
    const remaining = keysToDownload.filter((k) => !completedSet.has(k));

    if (remaining.length < keysToDownload.length) {
      console.log(
        `\n  🔄 Previous state: ${state.completedKeys.length} done, ${remaining.length} remaining`,
      );
      const answer = await askQuestion("  Resume? (Y/n/restart): ");

      if (answer.toLowerCase() === "restart") {
        clearState(destDir);
      } else if (answer.toLowerCase() !== "n") {
        keys = remaining;
        resuming = true;
      }
    }
  }

  if (keys.length === 0) {
    console.log("\n✅ All done!");
    clearState(destDir);
    return;
  }

  console.log(`\n  📋 ${keys.length} objects${resuming ? " (resuming)" : ""} → ${destDir}`);
  const confirm = await askQuestion("  Proceed? (Y/n): ");
  if (confirm.toLowerCase() === "n") return;

  console.log("\n🚀 Downloading...\n");

  const completedKeys: string[] = resuming ? [...(state?.completedKeys || [])] : [];
  const batches = chunk(keys, 25);
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const pct = Math.round(((i + 1) / batches.length) * 100);
    process.stdout.write(
      `\r  📦 ${i + 1}/${batches.length} | ${pct}% | ✅ ${totalSuccess} | ❌ ${totalFailed}`,
    );

    const { success, failed, failedKeys } = await downloadR2ObjectsParallel(
      config,
      batch,
      destDir,
      { concurrency: 3, delayBetweenRequests: 200, maxRetries: 5, silent: true },
    );

    completedKeys.push(...batch.filter((k) => !failedKeys.includes(k)));
    saveState(destDir, bucket, sourceFolder, completedKeys);
    totalSuccess += success;
    totalFailed += failed;
  }

  console.log(`\n\n✅ Done! Success: ${totalSuccess}, Failed: ${totalFailed}`);
  if (totalFailed === 0) clearState(destDir);
  else console.log("💡 Run again to retry failed downloads");
  console.log(`📁 ${destDir}`);
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
