// Copyright (c) Mito

export * from './version';

/**
 * By exporting this plugin directly, JLab 4 can get access 
 * directly to the plugin and activate it. Since Notebook 7 is 
 * built on top of JLab 4, this also activates the plugin for Notebook 7.
 */
import mitosheetJupyterLabPlugin from './plugin';
export default mitosheetJupyterLabPlugin;