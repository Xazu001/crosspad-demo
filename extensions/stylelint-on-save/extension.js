const fs = require("fs");
const { createRequire } = require("module");
const path = require("path");

const vscode = require("vscode");

let outputChannel;
const fixingFiles = new Set();
const pendingFixes = new Map();
const DEBOUNCE_MS = 50;

const stylelintCache = new Map();

function activate(context) {
  outputChannel = vscode.window.createOutputChannel("Stylelint On Save");
  outputChannel.appendLine("Stylelint On Save: activated");

  const disposable = vscode.workspace.onDidSaveTextDocument((document) => {
    const filePath = document.fileName;
    if (fixingFiles.has(filePath)) return;

    const config = vscode.workspace.getConfiguration("stylelintOnSave");
    if (!config.get("enable", true)) return;

    const ext = path.extname(filePath).toLowerCase();
    if (ext !== ".scss" && ext !== ".css") return;

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) return;

    if (pendingFixes.has(filePath)) {
      clearTimeout(pendingFixes.get(filePath));
    }

    pendingFixes.set(
      filePath,
      setTimeout(() => {
        pendingFixes.delete(filePath);
        runStylelint(document, workspaceFolder, config);
      }, DEBOUNCE_MS),
    );
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(outputChannel);
}

function getStylelint(cwd) {
  if (stylelintCache.has(cwd)) {
    return stylelintCache.get(cwd);
  }

  try {
    const packageJsonPath = path.join(cwd, "package.json");
    const workspaceRequire = createRequire(packageJsonPath);
    const stylelint = workspaceRequire("stylelint");
    stylelintCache.set(cwd, stylelint);
    outputChannel.appendLine(`Stylelint loaded from: ${cwd}`);
    return stylelint;
  } catch (err) {
    outputChannel.appendLine(`Failed to load stylelint: ${err.message}`);
    return null;
  }
}

async function runStylelint(document, workspaceFolder, config) {
  const cwd = workspaceFolder.uri.fsPath;
  const configFile = config.get("configFile", "stylelint.config.js");
  const filePath = document.fileName;
  const relPath = path.relative(cwd, filePath);
  const code = document.getText();

  const stylelint = getStylelint(cwd);
  if (!stylelint) {
    outputChannel.appendLine(`[Error] ${relPath}: Stylelint not available`);
    return;
  }

  fixingFiles.add(filePath);

  try {
    const result = await stylelint.lint({
      code,
      codeFilename: filePath,
      configFile: path.join(cwd, configFile),
      fix: true,
      quietDeprecationWarnings: true,
    });

    const fixedCode = result.code;

    if (fixedCode && fixedCode !== code) {
      fs.writeFileSync(filePath, fixedCode, "utf8");
      outputChannel.appendLine(`Fixed: ${relPath}`);

      const doc = vscode.workspace.textDocuments.find(
        (d) => d.uri.toString() === document.uri.toString(),
      );
      if (doc) {
        const newText = fs.readFileSync(filePath, "utf8");
        const oldText = doc.getText();
        if (newText !== oldText) {
          const edit = new vscode.WorkspaceEdit();
          edit.replace(
            document.uri,
            new vscode.Range(doc.positionAt(0), doc.positionAt(oldText.length)),
            newText,
          );
          await vscode.workspace.applyEdit(edit);
          fixingFiles.add(filePath);
          await doc.save();
        }
      }
    }
  } catch (err) {
    outputChannel.appendLine(`[Error] ${relPath}: ${err.message}`);
  }

  setTimeout(() => fixingFiles.delete(filePath), 300);
}

function deactivate() {
  pendingFixes.forEach((t) => clearTimeout(t));
  pendingFixes.clear();
  fixingFiles.clear();
  stylelintCache.clear();
  if (outputChannel) outputChannel.dispose();
}

module.exports = {
  activate,
  deactivate,
};
