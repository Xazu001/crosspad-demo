// Generates RSA key pair and encodes PEM keys into base64 .env variables.
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const secretsDir = path.join(process.cwd(), ".secrets");
const privateKeyPath = path.join(secretsDir, "JWT_PRIVATE_KEY.pem");
const publicKeyPath = path.join(secretsDir, "JWT_PUBLIC_KEY.pem");
const outputEnvPath = path.join(secretsDir, ".env");

try {
  // Create .secrets directory if it doesn't exist
  if (!fs.existsSync(secretsDir)) {
    fs.mkdirSync(secretsDir, { recursive: true });
    console.log("  📁 Created .secrets directory\n");
  }

  // Generate RSA key pair if files don't exist
  if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
    console.log("  🔐 Generating RSA 2048-bit key pair...\n");

    // Generate private key
    execSync(`openssl genrsa -out "${privateKeyPath}" 2048`, { stdio: "inherit" });

    // Extract public key from private key
    execSync(`openssl rsa -in "${privateKeyPath}" -pubout -out "${publicKeyPath}"`, {
      stdio: "inherit",
    });

    console.log("\n  ✅ Generated JWT_PRIVATE_KEY.pem and JWT_PUBLIC_KEY.pem\n");
  } else {
    console.log("  ℹ️  Key files already exist, skipping generation\n");
  }

  const pemFiles = fs
    .readdirSync(secretsDir)
    .filter((f) => f.endsWith(".pem") && !f.includes("-BASE64"));
  if (pemFiles.length === 0) {
    console.error("❌ No .pem files in .secrets");
    process.exit(1);
  }

  let envContent = "";

  for (const file of pemFiles) {
    const content = fs.readFileSync(path.join(secretsDir, file), "utf8").trim();
    const encoded = Buffer.from(content).toString("base64");
    const varName = path.basename(file, ".pem").toUpperCase();

    envContent += `${varName}="${encoded}"\n`;
    fs.writeFileSync(path.join(secretsDir, `${varName}-BASE64.pem`), encoded);
    console.log(`  ✅ ${file} → ${varName}`);
  }

  fs.writeFileSync(outputEnvPath, envContent);
  console.log(`\n✅ Done! .env saved to: ${outputEnvPath}\n`);
  console.log(envContent);
} catch (err) {
  console.error("❌", err);
  process.exit(1);
}
