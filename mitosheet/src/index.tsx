// Copyright (c) Mito

export * from './version';

/**
 * This export of the widgets into the main namespace is
 * how JNotebooks finds them, and displays them.
 */
export * from './jupyter/widget';

/**
 * By exporting this plugin directly, JLab 3 can get access 
 * directly to the plugin and activate it. This plugin activation
 * is only for JLab 3.0, as far as I understand...
 */
import mitosheetJupyterLabPlugin from './plugin';
export default mitosheetJupyterLabPlugin;