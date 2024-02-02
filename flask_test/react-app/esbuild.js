const esbuild = require('esbuild');

/**
 * We have a monorepo. When we locally install packages, it results
 * in multiple versions of react being installed. This causes issues
 * and Mito will not render
 * 
 * We fix this by aliasing react and react-dom to the same version
 * here. We used require.resolve to get the path to the version of
 * react that is installed in this package.
 */
const ensureOneReactVersion = () => {
    const re = /^(react|react-dom)$/
  
    return {
      name: 'alias',
      setup(build) {
        build.onResolve({ filter: re }, args => {
            if (args.path === 'react') {
                return {
                    path: require.resolve("react"),
                }
            }
            if (args.path === 'react-dom') {
                return {
                    path: require.resolve("react-dom"),
                }
            }
        })},
    };
};
  


esbuild
    .build({
        entryPoints: ["src/index.tsx"],
        outfile: 'dist/bundle.js',
        bundle: true,
        sourcemap: true,
        plugins: [
            ensureOneReactVersion()
        ],
        loader: {
            '.ttf': 'dataurl'
        },
        watch: process.argv.includes('--watch')
    })
    .then((e) => {
        console.log("⚡ Built ⚡")
        if (process.argv.includes('--watch')) {
            console.log("Watching and rebuilding any changes... ")
        }
    })
    .catch(() => process.exit(1));