import * as readline from "readline";

export function createLimiter(concurrency: number) {
  let running = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    if (queue.length > 0 && running < concurrency) {
      running++;
      queue.shift()!();
    }
  };

  return <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      queue.push(() => {
        fn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            running--;
            next();
          });
      });
      next();
    });
  };
}

export function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/** Triple confirmation for destructive operations */
export async function tripleConfirm(
  resourceName: string,
  resourceType: "database" | "bucket",
): Promise<boolean> {
  const label = resourceType === "database" ? "Database" : "Bucket";

  console.log("\n" + "=".repeat(60));
  console.log(`⚠️  WARNING: DELETING ALL DATA FROM ${label.toUpperCase()}: "${resourceName}"`);
  console.log("🔥 THIS CANNOT BE UNDONE!");
  console.log("=".repeat(60) + "\n");

  const c1 = await askQuestion(`Enter ${resourceType} name ('${resourceName}'): `);
  if (c1 !== resourceName) {
    console.log("❌ Cancelled");
    return false;
  }

  const c2 = await askQuestion("Are you sure? Type 'Y': ");
  if (c2 !== "Y") {
    console.log("❌ Cancelled");
    return false;
  }

  const c3 = await askQuestion("Final confirmation - type 'Y': ");
  if (c3 !== "Y") {
    console.log("❌ Cancelled");
    return false;
  }

  return true;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
