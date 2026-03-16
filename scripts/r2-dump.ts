// ⚠️ Destructive: Clears all objects from R2 bucket.
import {
  checkR2BucketExists,
  chunk,
  config,
  deleteR2ObjectsParallel,
  listR2Objects,
  tripleConfirm,
} from "./lib";

async function main() {
  console.log(`📦 Bucket: ${config.r2.bucket} [${config.env}]\n`);

  if (!(await checkR2BucketExists(config))) {
    throw new Error(`Bucket "${config.r2.bucket}" not found`);
  }

  const objects = await listR2Objects(config);
  if (objects.length === 0) {
    console.log("✅ Bucket is already empty!");
    return;
  }

  console.log(`📊 Found ${objects.length} object(s)\n`);
  if (!(await tripleConfirm(config.r2.bucket, "bucket"))) return;

  console.log("\n🔥 Deleting...");
  const keys = objects.map((o) => o.key).filter(Boolean);
  const batches = chunk(keys, 1000);

  let totalDeleted = 0;
  let totalFailed = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`  📦 Batch ${i + 1}/${batches.length} (${batch.length} objects)`);

    const { deleted, failed } = await deleteR2ObjectsParallel(config, batch, 50);
    totalDeleted += deleted;
    totalFailed += failed;
  }

  console.log(`\n✅ Deleted: ${totalDeleted}, Failed: ${totalFailed}`);
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
