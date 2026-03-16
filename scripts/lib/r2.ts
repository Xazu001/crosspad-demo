import { exec } from "child_process";

import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

import type { ScriptConfig } from "./config";
import { createLimiter } from "./utils";

const execAsync = promisify(exec);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface R2Object {
  key: string;
  size?: number;
  uploaded?: string;
}

export async function uploadToR2(
  config: ScriptConfig,
  buffer: Buffer,
  key: string,
): Promise<boolean> {
  try {
    if (config.r2.remote) {
      const url = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflare.accountId}/r2/buckets/${config.r2.bucket}/objects/${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${config.cloudflare.apiToken}`,
          "Content-Type": "application/octet-stream",
        },
        body: new Uint8Array(buffer),
        signal: AbortSignal.timeout(60000),
      });
      return res.ok;
    } else {
      const tempPath = path.join(
        config.paths.scripts,
        `.temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      fs.writeFileSync(tempPath, buffer);
      try {
        await execAsync(
          `npx wrangler r2 object put ${config.r2.bucket}/${key} --file="${tempPath}" --local`,
        );
        return true;
      } finally {
        fs.unlinkSync(tempPath);
      }
    }
  } catch {
    return false;
  }
}

export async function uploadFileToR2(
  config: ScriptConfig,
  filePath: string,
  key: string,
): Promise<boolean> {
  return uploadToR2(config, fs.readFileSync(filePath), key);
}

export async function uploadFilesParallel(
  config: ScriptConfig,
  files: Array<{ filePath: string; key: string }>,
  concurrency: number = 20,
): Promise<{ success: number; failed: number }> {
  const limiter = createLimiter(concurrency);
  const buffers = new Map<string, Buffer>();

  for (const file of files) {
    try {
      buffers.set(file.key, fs.readFileSync(file.filePath));
    } catch {}
  }

  const tasks = files.map((file) =>
    limiter(async () => {
      const buffer = buffers.get(file.key);
      if (!buffer) return false;
      return uploadToR2(config, buffer, file.key);
    }),
  );

  const results = await Promise.allSettled(tasks);
  const success = results.filter((r) => r.status === "fulfilled" && r.value === true).length;
  return { success, failed: files.length - success };
}

export async function listR2Objects(config: ScriptConfig): Promise<R2Object[]> {
  const all: R2Object[] = [];
  let cursor: string | undefined;

  do {
    const url = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflare.accountId}/r2/buckets/${config.r2.bucket}/objects${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.cloudflare.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error(`List failed: ${res.statusText}`);

    const data: any = await res.json();
    all.push(...(data.result || []));
    cursor = data.result_info?.is_truncated ? data.result_info.cursor : undefined;
  } while (cursor);

  return all;
}

export async function deleteFromR2(config: ScriptConfig, key: string): Promise<boolean> {
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflare.accountId}/r2/buckets/${config.r2.bucket}/objects/${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.cloudflare.apiToken}`,
        "Content-Type": "application/json",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteR2ObjectsParallel(
  config: ScriptConfig,
  keys: string[],
  concurrency: number = 50,
): Promise<{ deleted: number; failed: number }> {
  const limiter = createLimiter(concurrency);
  const tasks = keys.map((key) => limiter(() => deleteFromR2(config, key)));
  const results = await Promise.allSettled(tasks);
  const deleted = results.filter((r) => r.status === "fulfilled" && r.value === true).length;
  return { deleted, failed: keys.length - deleted };
}

export async function downloadFromR2(
  config: ScriptConfig,
  key: string,
  maxRetries: number = 5,
  silent: boolean = false,
): Promise<Buffer | null> {
  let lastError = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflare.accountId}/r2/buckets/${config.r2.bucket}/objects/${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${config.cloudflare.apiToken}` },
        signal: AbortSignal.timeout(60000),
      });

      if (res.ok) return Buffer.from(await res.arrayBuffer());

      if (res.status === 429 || res.status === 503) {
        await sleep(Math.min(1000 * Math.pow(2, attempt), 30000));
        continue;
      }

      lastError = res.statusText;
      break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < maxRetries) {
        await sleep(Math.min(1000 * Math.pow(2, attempt), 30000));
        continue;
      }
    }
  }

  if (!silent) console.error(`❌ ${key}: ${lastError}`);
  return null;
}

export interface DownloadOptions {
  concurrency?: number;
  delayBetweenRequests?: number;
  maxRetries?: number;
  silent?: boolean;
}

export async function downloadR2ObjectsParallel(
  config: ScriptConfig,
  keys: string[],
  destDir: string,
  options: DownloadOptions = {},
): Promise<{ success: number; failed: number; failedKeys: string[] }> {
  const { concurrency = 5, delayBetweenRequests = 100, maxRetries = 5, silent = true } = options;
  const limiter = createLimiter(concurrency);
  const failedKeys: string[] = [];

  const tasks = keys.map((key) =>
    limiter(async () => {
      await sleep(delayBetweenRequests);
      const buffer = await downloadFromR2(config, key, maxRetries, silent);

      if (!buffer) {
        failedKeys.push(key);
        return false;
      }

      const destPath = path.join(destDir, key);
      const destDirPath = path.dirname(destPath);
      if (!fs.existsSync(destDirPath)) {
        fs.mkdirSync(destDirPath, { recursive: true });
      }
      fs.writeFileSync(destPath, buffer);
      return true;
    }),
  );

  const results = await Promise.allSettled(tasks);
  const success = results.filter((r) => r.status === "fulfilled" && r.value === true).length;
  return { success, failed: keys.length - success, failedKeys };
}

export async function checkR2BucketExists(
  config: ScriptConfig,
  maxRetries: number = 3,
): Promise<boolean> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${config.cloudflare.accountId}/r2/buckets`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.cloudflare.apiToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(30000),
      });

      if (res.status === 429 || res.status === 503) {
        await sleep(Math.min(2000 * Math.pow(2, attempt), 30000));
        continue;
      }

      if (!res.ok) return false;

      const data: any = await res.json();
      return (data.result?.buckets || []).some((b: any) => b.name === config.r2.bucket);
    } catch {
      if (attempt < maxRetries) {
        await sleep(Math.min(2000 * Math.pow(2, attempt), 30000));
        continue;
      }
      return false;
    }
  }
  return false;
}
