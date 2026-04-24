## mitosheet-vscode Developer Guide

This package enables mitosheet to communicate with the VS Code API, specifically:

- Writing to cells
- Pulling theme data

Because most logic is housed in the mitosheet package, this extension is seldom updated.

## Testing Locally

To build this extension, run:

```bash
npm run build
```

This will generate a `.vsix` file. Use the Command Palette to install it — search for "VSIX."

## Distribution

There are two marketplaces we publish to, both of which accept a `.vsix` format:

1. Visual Studio Marketplace
2. Open VSX Registry (used by Cursor)

Both are handled by GitHub Actions. The only required change is bumping the version in `package.json`.