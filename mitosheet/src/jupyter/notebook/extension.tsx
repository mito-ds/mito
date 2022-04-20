// Copyright (c) Jupyter Development Team.

// This file contains the javascript that is run when the notebook is loaded.
// It contains some requirejs configuration and the `load_ipython_extension`
// which is required for any notebook extension.
//
// Some static assets may be required by the custom widget javascript. The base
// url for the notebook is not known at build time and is therefore computed
// dynamically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__webpack_public_path__ = document.querySelector('body')?.getAttribute('data-base-url') + 'nbextensions/mitosheet';


// Configure requirejs
if (window.require) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.require as any).config({
        map: {
            "*" : {
                "mitosheet": "nbextensions/mitosheet/index",
            }
        }
    });
}

// Export the required load_ipython_extension
module.exports = {
    // eslint-disable-next-line  @typescript-eslint/no-empty-function
    load_ipython_extension: function() {}
};
