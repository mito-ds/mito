const esbuild = require('esbuild');

esbuild
    .build({
        entryPoints: ["src/jupyterLabRender.tsx"],
        outfile: 'mitosheet/out.js',
        bundle: true,
        plugins: [],
        loader: {
            '.ttf': 'dataurl'
        },
        watch: process.argv.includes('--watch')
    })
    .then(() => {
        console.log("⚡ Built ⚡")
        if (process.argv.includes('--watch')) {
            console.log("Watching and rebuilding any changes... ")
        }
    })
    .catch(() => process.exit(1));