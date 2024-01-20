const esbuild = require('esbuild');

esbuild
    .build({
        entryPoints: ["src/streamlit/renderMitoStreamlitWrapper.tsx"],
        outfile: 'mitosheet/streamlit/v1/mitoBuild/component.js',
        bundle: true,
        //minify: true,
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

esbuild
    .build({
        entryPoints: ["src/streamlit/renderMitoMessagePasser.tsx"],
        outfile: 'mitosheet/streamlit/v1/messagingBuild/component.js',
        bundle: true,
        minify: true,
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