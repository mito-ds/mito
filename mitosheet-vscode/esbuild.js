/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

// Extension host — runs in Node.js inside VS Code, loaded as CommonJS
esbuild.build({
    entryPoints: ['src/extension.ts'],
    outfile: 'out/extension.js',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external: ['vscode'],
    minify: true,
    watch,
}).then(() => console.log('⚡ Built extension.js'))
  .catch(() => process.exit(1));

// Renderer — runs in the notebook output webview, loaded as ESM
esbuild.build({
    entryPoints: ['src/renderer.ts'],
    outfile: 'out/renderer.js',
    bundle: true,
    platform: 'browser',
    format: 'esm',
    minify: true,
    watch,
}).then(() => console.log('⚡ Built renderer.js'))
  .catch(() => process.exit(1));
