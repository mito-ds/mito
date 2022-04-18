// Copyright (c) Mito

export * from './version';
export * from './jupyter/widget';

/**
 * By exporting this plugin directly, JLab 3 can get access 
 * directly to the plugin and activate it.
 * 
 * I believe this is only required for JLab 3 and not Jlab 2
 * or the notebook, but I could be wrong...
 */
import mitosheetJupyterLabPlugin from './plugin';
export default mitosheetJupyterLabPlugin;