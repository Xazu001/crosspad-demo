const path = require("path");

const [filePath, configFile, cwd] = process.argv.slice(2);

async function run() {
  try {
    const stylelint = require(path.join(cwd, "node_modules", "stylelint"));
    const fs = require("fs");
    const code = fs.readFileSync(filePath, "utf8");

    const result = await stylelint.lint({
      code,
      codeFilename: filePath,
      configFile: path.join(cwd, configFile),
      fix: true,
      quietDeprecationWarnings: true,
    });

    if (result.code && result.code !== code) {
      fs.writeFileSync(filePath, result.code, "utf8");
      process.stdout.write("FIXED");
    } else {
      process.stdout.write("OK");
    }
  } catch (err) {
    process.stderr.write(err.message);
    process.exit(1);
  }
}

run();
