// Copyright (c) Jupyter Development Team.

import { getCellAtIndex, getCellText, writeEmptyMitosheetCell } from "./extensionUtils"; 

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


function registerBeforeSaveHandler() {

    const notebook = (window as any).Jupyter?.notebook
  
    // Add event listener for cell selection changes
    notebook.events.on('before_save.Notebook', handleBeforeSave);
}

// Function to handle the before_save.Notebook event
const handleBeforeSave = () => {
    console.log("HERE")
    const cells = (window as any).Jupyter?.notebook?.get_cells();
    console.log("calling this now")

    if (cells !== undefined) {
        const numCells = cells?.length ?? 0;
        var idx = 0

        // Loop through all of the cells
        for(idx; idx < numCells; idx++) {
            console.log(idx)
            const cell = getCellAtIndex(idx);
            if (cell === undefined) {
                continue;
            }


            const cellText = getCellText(cell);
            const metadata = cell.metadata;
            if (metadata) {
                if (cellText.indexOf('SAVE_TAG') >= 0) {
                    metadata['SAVE_TAG'] = 'true'
                } else {
                    delete metadata['SAVE_TAG']
                }
            }
        }
    }
};
  
// Call the function to register the event handler
registerBeforeSaveHandler();
  
// Try to add a button
(window as any).Jupyter?.toolbar.add_buttons_group([{
    id : 'mito-toolbar-button-id', // Since we're unable to set the className, we use the id for styling
    label : 'New Mitosheet',
    title: 'Create a blank Mitosheet below the active code cell',
    icon: 'fa-regular fa-table', // For now we use a font awesome icon, since we can't load our icon -- this is what Jupyter suggests
    callback : () => {
        writeEmptyMitosheetCell()
    },
}]);

// Export the required load_ipython_extension
module.exports = {
    // eslint-disable-next-line  @typescript-eslint/no-empty-function
    load_ipython_extension: function() {}
};