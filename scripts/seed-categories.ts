// Seeds default categories into D1 database.
import { DEFAULT_CATEGORIES } from "../shared/constants/categories";
import { config, executeD1, executeD1Json } from "./lib";

async function getCategoryCount(): Promise<number> {
  try {
    const results = await executeD1Json(config, "SELECT COUNT(*) as count FROM categories;");
    return results[0]?.count || 0;
  } catch {
    return 0;
  }
}

async function insertCategories() {
  for (const cat of DEFAULT_CATEGORIES) {
    const name = cat.category_name.replace(/'/g, "''");
    const desc = (cat.category_description || "").replace(/'/g, "''");
    await executeD1(
      config,
      `INSERT INTO categories (category_name, category_description, category_created_on) VALUES ('${name}', '${desc}', ${Date.now()});`,
    );
    console.log(`  ✅ ${cat.category_name}`);
  }
}

async function main() {
  console.log(`💾 Database: ${config.db.name} [${config.env}]\n`);

  const count = await getCategoryCount();
  if (count > 0) {
    console.log(`✅ Categories already exist (${count} found)`);
    return;
  }

  console.log(`📝 Seeding ${DEFAULT_CATEGORIES.length} categories...`);
  await insertCategories();
  console.log(`\n✅ Done! Added ${DEFAULT_CATEGORIES.length} categories.`);
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
