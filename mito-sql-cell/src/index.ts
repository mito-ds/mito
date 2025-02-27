import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Dialog } from '@jupyterlab/apputils';
import type { ICellModel } from '@jupyterlab/cells';
import {
  EditorExtensionRegistry,
  IEditorExtensionRegistry
} from '@jupyterlab/codemirror';
import { find } from '@lumino/algorithm';
import { AddSource } from './addsource';
import { cellTypeSwitcher } from './celltypeselector';
import { CommandIDs } from './commands';
import { hideSqlMagic } from './hidemagic';
import { databaseIcon } from './icon';
import { SqlSourcesModel, SqlSourcesPanel } from './sources';
import { SQLExtension } from './sqlextension';
import { type ISqlSource } from './tokens';

/**
 * Plugin using a custom cell widget for SQL cells.
 */
const sqlCell: JupyterFrontEndPlugin<void> = {
  id: 'mito-sql-cell:sql-cell',
  description: 'Plugin adding support SQL cells.',
  requires: [IEditorExtensionRegistry],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    editorExtensionRegistry: IEditorExtensionRegistry
  ) => {
    // Model handling the SQL sources
    const sources = new SqlSourcesModel();

    // Add commands
    app.commands.addCommand(CommandIDs.addSource, {
      execute: async () => {
        // Use `Dialog` instead of `showDialog` to add custom CSS class
        const dialog = new Dialog<ISqlSource | null>({
          title: 'Add a SQL source',
          body: new AddSource(sources),
          buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Add' })]
        });
        dialog.addClass('mito-sql-add-source-dialog');
        const result = await dialog.launch();

        if (result.button.accept && result.value) {
          sources.push(result.value);
          return result.value;
        }
      },
      label: 'Add a SQL source',
      caption: 'Prompt the user to add a new SQL source.'
    });
    app.commands.addCommand(CommandIDs.deleteSource, {
      execute: async args => {
        const { name } = args as { name: string };
        const source = find(sources, source => source.connectionName === name);
        if (source) {
          sources.removeValue(source);
        }
      },
      label: 'Delete a SQL source',
      caption: 'Delete a SQL source provided by its name.'
    });
    app.commands.addCommand(CommandIDs.refreshSources, {
      execute: async () => {
        await sources.refresh();
      },
      label: 'Refresh SQL sources',
      caption: 'Refresh the list of SQL sources'
    });

    // Sidebar panel for the SQL sources
    //- Create the widget
    const sourcesPanel = new SqlSourcesPanel({
      model: sources,
      commands: app.commands
    });
    sourcesPanel.id = 'mito-sql-sources';
    sourcesPanel.title.icon = databaseIcon;
    sourcesPanel.title.caption = 'SQL Sources';

    //- Add the sources panel to the left sidebar
    app.shell.add(sourcesPanel, 'left', { rank: 1000 });

    // Add the widget extension adding the SQL toolbar to notebook cells
    const sqlCellExtension = new SQLExtension(sources, app.commands);
    app.docRegistry.addWidgetExtension('Notebook', sqlCellExtension);

    editorExtensionRegistry.addExtension({
      name: 'mito-sql-cell:hide-sql-magics',
      // Don't add the extension to the file editor or non-code cells
      factory: options =>
        options.inline && (options.model as ICellModel).type === 'code'
          ? EditorExtensionRegistry.createImmutableExtension(hideSqlMagic)
          : null
    });

    // Read the SQL sources from the backend
    Promise.all([app.started, app.restored]).then(async () => {
      await sources.refresh();
    });
  }
};

export default [cellTypeSwitcher, sqlCell];
