## mitosheet-vscode Developers Guide

This package is used to enable the mitosheet to communicate with the VS Code API. Specifically it allows for:

- Writing to cells.
- Pulling theme data.

Becuase most of the logic is housed in the mitosheet package, this extension is seldomly updated. 

## Testing Locally

To build this extension run:

```bash
npm run build
```

This will generate a `.vsix` file. Use the command pallet to select the install the VSIX file — best to search for "VSIX." 

## Distribution

There are two main marketplaces that we need to publish to, both of which accept a `.vsix` format:

1. Visual Studio Marketplace
2. Open VSX Registry - used by Cursor.

Both of these are handled by github Actions. 