import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

/**
 * Remove all comment lines from .env file content
 * Comments are lines starting with # (after optional whitespace)
 */
function stripEnvComments(content: string): string {
  const lines = content.split("\n");
  const cleaned: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Keep non-comment lines and empty lines
    if (!trimmed.startsWith("#") && trimmed !== "") {
      cleaned.push(line);
    }
  }

  return cleaned.join("\n");
}

/**
 * Remove all // comments from JSONC file content
 * Preserves string content that may contain //
 */
function stripJsoncComments(content: string): string {
  const lines = content.split("\n");
  const cleaned: string[] = [];

  for (const line of lines) {
    // Simple approach: remove // comments that are not inside strings
    // This handles most cases; complex nested strings may need more sophisticated parsing
    let result = "";
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        result += char;
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        result += char;
        continue;
      }

      // Check for // comment start (not in string)
      if (!inString && char === "/" && line[i + 1] === "/") {
        // Remove trailing whitespace before comment
        result = result.trimEnd();
        break;
      }

      result += char;
    }

    // Only add non-empty lines
    if (result.trim()) {
      cleaned.push(result);
    }
  }

  return cleaned.join("\n");
}

export function deleteComments(): void {
  console.log("\n  🧹 Cleaning comments from demo files...\n");

  // Process .env.example
  const envPath = resolve(process.cwd(), ".env.example");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    const cleaned = stripEnvComments(content);
    writeFileSync(envPath, cleaned + "\n", "utf-8");
    console.log("  ✅ Cleaned .env.example (removed # comments)");
  } else {
    console.log("  ⚠️  .env.example not found, skipping");
  }

  // Process wrangler.jsonc
  const wranglerPath = resolve(process.cwd(), "wrangler.jsonc");
  if (existsSync(wranglerPath)) {
    const content = readFileSync(wranglerPath, "utf-8");
    const cleaned = stripJsoncComments(content);
    writeFileSync(wranglerPath, cleaned + "\n", "utf-8");
    console.log("  ✅ Cleaned wrangler.jsonc (removed // comments)");
  } else {
    console.log("  ⚠️  wrangler.jsonc not found, skipping");
  }

  console.log("\n  📝 Note: Empty lines were also removed for cleaner output\n");
}

// Run if called directly
deleteComments();
