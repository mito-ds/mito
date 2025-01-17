import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { NotebookPanel } from '@jupyterlab/notebook';
import { NotebookContentFactory } from './contentfactory';

/**
 * Initialization data for the mito-sql-cell extension.
 */
const plugin: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> = {
  id: 'mito-sql-cell:notebook-content-factory',
  description:
    'Plugin providing the notebook content factory with a special treatment for SQL cells.',
  provides: NotebookPanel.IContentFactory,
  requires: [IEditorServices],
  autoStart: true,
  activate: (app: JupyterFrontEnd, editorServices: IEditorServices) => {
    const editorFactory = editorServices.factoryService.newInlineEditor;
    return new NotebookContentFactory({
      editorFactory,
      sqlSources: { sources: ['db1', 'db2'] }
    });
  }
};

export default plugin;
