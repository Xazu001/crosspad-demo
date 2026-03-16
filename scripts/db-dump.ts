// ⚠️ Destructive: Clears all tables and views from D1 database.
import { config, executeD1, getD1Tables, getD1Views, parseD1Output, tripleConfirm } from "./lib";

async function getForeignKeyDeps(tables: string[]): Promise<Map<string, string[]>> {
  const deps = new Map<string, string[]>();

  for (const table of tables) {
    try {
      const output = await executeD1(config, `PRAGMA foreign_key_list(${table});`);
      const refs = parseD1Output<{ table: string }>(output, ["table"])
        .map((r) => r.table)
        .filter((t) => tables.includes(t));

      if (refs.length > 0) deps.set(table, refs);
    } catch {
      // Ignore errors when fetching foreign key list for a table
    }
  }

  return deps;
}

function topoSort(tables: string[], deps: Map<string, string[]>): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(table: string) {
    if (visiting.has(table) || visited.has(table)) return;
    visiting.add(table);
    for (const dep of deps.get(table) || []) {
      if (tables.includes(dep)) visit(dep);
    }
    visiting.delete(table);
    visited.add(table);
    sorted.push(table);
  }

  for (const table of tables) visit(table);
  return sorted;
}

async function clearTable(name: string): Promise<boolean> {
  try {
    await executeD1(config, `DELETE FROM ${name};`);
    console.log(`  ✅ ${name}`);
    return true;
  } catch (err: any) {
    console.error(`  ❌ ${name}: ${err.message}`);
    return false;
  }
}

async function clearTableNoFK(name: string): Promise<boolean> {
  try {
    await executeD1(
      config,
      `PRAGMA foreign_keys = OFF; DELETE FROM ${name}; PRAGMA foreign_keys = ON;`,
    );
    console.log(`  ✅ ${name} (FK disabled)`);
    return true;
  } catch (err: any) {
    console.error(`  ❌ ${name}: ${err.message}`);
    return false;
  }
}

async function dropTable(name: string): Promise<boolean> {
  if (name === "_cf_KV" || name.startsWith("__")) return true;

  try {
    await executeD1(config, `DELETE FROM ${name};`);
    await executeD1(config, `DROP TABLE IF EXISTS ${name};`);
    console.log(`  💥 ${name}`);
    return true;
  } catch (err: any) {
    console.error(`  ❌ ${name}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`💾 Database: ${config.db.name} [${config.env}]\n`);

  let tables = await getD1Tables(config);
  if (tables.length === 0) {
    tables = [
      "pad_samples",
      "kit_categories",
      "group_members",
      "user_rights",
      "user_settings",
      "logins",
      "verified_user",
      "samples",
      "pads",
      "kits",
      "categories",
      "groups",
      "users",
    ];
  }

  const views = await getD1Views(config);
  const deps = await getForeignKeyDeps(tables);
  const sorted = topoSort(tables, deps);

  console.log(`📊 Tables: ${tables.join(", ")}`);
  if (views.length > 0) console.log(`👁️  Views: ${views.join(", ")}`);
  console.log(`📋 Order: ${sorted.join(", ")}\n`);

  if (!(await tripleConfirm(config.db.name, "database"))) return;

  console.log("\n🔥 Clearing tables...");
  const failed: string[] = [];
  for (const t of sorted) {
    if (!(await clearTable(t))) failed.push(t);
  }

  if (failed.length > 0) {
    console.log("\n🔄 Retrying with FK disabled...");
    for (const t of failed) await clearTableNoFK(t);
  }

  if (views.length > 0) {
    console.log("\n👁️  Dropping views...");
    for (const v of views) {
      await executeD1(config, `DROP VIEW IF EXISTS ${v};`).catch((err) => {
        console.warn(`  ⚠️ Failed to drop view ${v}: ${err.message}`);
      });
    }
  }

  console.log("\n� Dropping tables...");
  for (const t of [...sorted].reverse()) await dropTable(t);

  console.log("\n✅ Done!");
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
