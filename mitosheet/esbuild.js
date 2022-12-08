const esbuild = require('esbuild');

esbuild
    .build({
        entryPoints: ["src/jupyterRender.tsx"],
        outfile: 'mitosheet/mito_frontend.js',
        bundle: true,
        minify: !process.argv.includes('--watch'), // We only minimize if we're not watching
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