const esbuild = require('esbuild');

esbuild
    .build({
        entryPoints: ["src/jupyterRender.tsx"],
        outfile: 'mitosheet/mito_frontend.js',
        bundle: true,
        plugins: [],
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