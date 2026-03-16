import { exec } from "child_process";

import { promisify } from "util";

import type { ScriptConfig } from "./config";

const execAsync = promisify(exec);

export interface D1Result {
  success: boolean;
  data?: any[];
  error?: string;
  raw?: string;
}

export async function executeD1(config: ScriptConfig, command: string): Promise<string> {
  const escaped = command.replace(/"/g, '\\"');
  const cmd = `npx wrangler d1 execute ${config.db.name} ${config.db.remote ? "--remote" : "--local"} --command "${escaped}"`;

  try {
    const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
    return stdout;
  } catch (err: any) {
    const msg = err.stderr || err.stdout || err.message;
    throw new Error(`D1 failed: ${msg}`);
  }
}

export async function executeD1Batch(config: ScriptConfig, commands: string[]): Promise<void> {
  if (commands.length === 0) return;
  await executeD1(config, commands.join("; "));
}

export async function executeD1Json(config: ScriptConfig, command: string): Promise<any[]> {
  const escaped = command.replace(/"/g, '\\"');
  const cmd = `npx wrangler d1 execute ${config.db.name} ${config.db.remote ? "--remote" : "--local"} --json --command "${escaped}"`;

  try {
    const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
    const json = JSON.parse(stdout);
    const data = Array.isArray(json) ? json[0] : json;
    return data.results || [];
  } catch (err: any) {
    throw new Error(`D1 JSON failed: ${err.message}`);
  }
}

export function parseD1Output<T extends Record<string, any>>(
  output: string,
  keys: (keyof T)[],
): T[] {
  const results: T[] = [];
  let current: Partial<T> = {};

  for (const line of output.split("\n")) {
    for (const key of keys) {
      const k = String(key);
      if (line.includes(`"${k}":`)) {
        const strMatch = line.match(new RegExp(`"${k}":\\s*"([^"]+)"`));
        const numMatch = line.match(new RegExp(`"${k}":\\s*(\\d+)`));
        if (strMatch) current[key] = strMatch[1] as any;
        else if (numMatch) current[key] = parseInt(numMatch[1]) as any;
      }
    }

    if (Object.keys(current).length === keys.length) {
      results.push(current as T);
      current = {};
    }
  }

  if (Object.keys(current).length > 0) results.push(current as T);
  return results;
}

export function extractD1Value(output: string, key: string): string | number | null {
  for (const line of output.split("\n")) {
    if (line.includes(`"${key}":`)) {
      const strMatch = line.match(new RegExp(`"${key}":\\s*"([^"]+)"`));
      if (strMatch) return strMatch[1];
      const numMatch = line.match(new RegExp(`"${key}":\\s*(\\d+)`));
      if (numMatch) return parseInt(numMatch[1]);
    }
  }
  return null;
}

export async function getD1Tables(config: ScriptConfig): Promise<string[]> {
  const output = await executeD1(config, "SELECT name FROM sqlite_master WHERE type='table';");
  return parseD1Output<{ name: string }>(output, ["name"])
    .map((t) => t.name)
    .filter((n) => n !== "sqlite_sequence" && !n.startsWith("_cf_"));
}

export async function getD1Views(config: ScriptConfig): Promise<string[]> {
  try {
    const output = await executeD1(config, "SELECT name FROM sqlite_master WHERE type='view';");
    return parseD1Output<{ name: string }>(output, ["name"]).map((v) => v.name);
  } catch {
    return [];
  }
}

export function buildMultiInsert(table: string, columns: string[], rows: any[][]): string {
  const values = rows
    .map((row) => {
      const escaped = row.map((v) => {
        if (v === null) return "NULL";
        if (typeof v === "number") return v;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      return `(${escaped.join(", ")})`;
    })
    .join(", ");

  return `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${values}`;
}
