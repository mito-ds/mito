/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

const esbuild = require('esbuild');
const react = require('react');


/**
 * This plugin is used to make react external to the bundle in the mitodashwrapper.js file.
 * 
 * This is necessary as we want to use the react that is already loaded in the page for dash, 
 * and is defined globally as `window.React`.
 * 
 * This plugin is used because esbuild does not support externalizing modules (it's external
 * option does something with local files), so we have to do it manually.
 */
const useReactExternal = () => {
  const PLUGIN_NAME = 'use-react-external'
  return {
    name: PLUGIN_NAME,
    setup(build) {

      // Filter for the react imports
      build.onResolve({ filter: /^react$/ }, (args) => ({
        path: args.path,
        namespace: PLUGIN_NAME,
      }));
      

      build.onLoad({ filter: /.*/, namespace: PLUGIN_NAME }, (args) => {
        // Get all top-level react exports, and export them as well
        const exports = Object.keys(react).filter((x) => x !== 'default');
        return {
          contents: `
export default React;
${exports.map((x) => `export const ${x} = React.${x};`).join('\n')}` };
      });
    },
  };
}


esbuild
  .build({
    entryPoints: ['./src/dash/index.tsx'],
    bundle: true,
    outfile: 'mitosheet/mito_dash/v1/mitoBuild/component.js',
    sourcemap: false,
    platform: 'browser',
    target: ['es6'],
    loader: {
      '.ttf': 'dataurl'
    },
    globalName: 'dash_spreadsheet_v1',
    plugins: [useReactExternal()],
    watch: process.argv.includes('--watch')
  }).then(() => {
    console.log("Built")
  }).catch(() => process.exit(1)
)
