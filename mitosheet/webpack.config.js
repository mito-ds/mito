// This webpack config is just for building the mitosheet/nbextension file

var path = require('path');
var version = require('./package.json').version;
var webpack = require('webpack');

// Custom webpack rules are generally the same for all webpack bundles, hence
// stored in a separate local variable.
var rules = [
    { test: /\.css$/, use: ['style-loader', 'css-loader']},
    {
        test: /\.(jpe?g|png|gif|svg)$/i, 
        use: ['file-loader']
    },
    {
        test: /\.ttf$/,
        loader: 'file-loader',
        options: {
            publicPath: '/nbextensions/mitosheet/'
        }
    }
]


module.exports = (env, argv) => {
    var devtool = argv.mode === 'development' ? 'source-map' : false;
    return [
        {// Bundle for the notebook containing the custom widget views and models
        //
        // This bundle contains the implementation for the custom widget views and
        // custom widget.
        // It must be an amd module
        //
            entry: './lib/index.js',
            output: {
                filename: 'index.js',
                path: path.resolve(__dirname, 'mitosheet', 'nbextension'),
                libraryTarget: 'amd',
                publicPath: '',
            },
            devtool,
            module: {
                rules: rules
            },
            plugins: [
                new webpack.DefinePlugin({
                    "process.env": "{}",
                })
            ],
            externals: ['@jupyter-widgets/base'],
        },
    ];
}