// Copyright (c) Mito

/**
 * By exporting this plugin directly, JLab 4 can get access 
 * directly to the plugin and activate it. Since Notebook 7 is 
 * built on top of JLab 4, this also activates the plugin for Notebook 7.
 * 
 * 
 * TODO: In development mode, this file does not seem to have any impact. 
 * I can delete the below lines with no impact. Is this completely unneeded?
 */

import mitosheetJupyterLabPlugin from './plugin';
export default mitosheetJupyterLabPlugin; 