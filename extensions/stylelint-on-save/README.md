# Stylelint On Save

Custom VS Code extension that runs `stylelint --fix` on SCSS/CSS files when saved.

## Features

- Automatically runs `pnpm stylelint --fix` on save for `.scss` and `.css` files
- Uses project's `stylelint.config.js` configuration
- Shows output in "Stylelint On Save" output channel

## Configuration

- `stylelintOnSave.enable` - Enable/disable auto-fix on save (default: `true`)
- `stylelintOnSave.configFile` - Path to stylelint config file (default: `stylelint.config.js`)

## Installation

1. Package the extension: `npx @vscode/vsce package`
2. Install: `code --install-extension stylelint-on-save-1.0.0.vsix`
