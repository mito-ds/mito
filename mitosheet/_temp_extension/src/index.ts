import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the mitosheet extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'mitosheet:plugin',
  description: 'The Mito Spreadsheet',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension mitosheet is activated!');
  }
};

export default plugin;
