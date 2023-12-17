exports = require('@jupyterlab/galata/lib/playwright-config');

// extend the default configuration, specifically setting
// use: permissions: ["clipboard-read"]

module.exports = {
    ...exports,
    use: {
        ...exports.use,
        permissions: ['clipboard-read'],
    },
};