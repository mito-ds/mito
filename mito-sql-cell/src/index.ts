import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import type { ICellModel } from '@jupyterlab/cells';
import {
  EditorExtensionRegistry,
  IEditorExtensionRegistry
} from '@jupyterlab/codemirror';
import {
  addIcon,
  CommandToolbarButton,
  refreshIcon,
  Toolbar
} from '@jupyterlab/ui-components';
import { find } from '@lumino/algorithm';
import { Widget } from '@lumino/widgets';
import { AddSource } from './addsource';
import { cellTypeSwitcher } from './celltypeselector';
import { hideSqlMagic } from './hidemagic';
import { databaseIcon } from './icon';
import { SqlSourcesModel, SqlSourcesPanel } from './sources';
import { SQLExtension } from './sqlextension';
import { CommandIDs, type ISqlSource } from './tokens';

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
        const result = await showDialog<ISqlSource | null>({
          title: 'Add a SQL source',
          body: new AddSource(sources),
          buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Add' })]
        });

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

    //- Add side panel toolbar items
    const node = document.createElement('h2');
    node.textContent = 'SQL Sources';
    sourcesPanel.toolbar.addItem('header', new Widget({ node }));
    sourcesPanel.toolbar.addItem('spacer', Toolbar.createSpacerItem());
    sourcesPanel.toolbar.addItem(
      'add',
      new CommandToolbarButton({
        commands: app.commands,
        id: CommandIDs.addSource,
        icon: addIcon,
        label: '',
        caption: 'Add a new SQL source'
      })
    );
    sourcesPanel.toolbar.addItem(
      'refresh',
      new CommandToolbarButton({
        commands: app.commands,
        id: CommandIDs.refreshSources,
        icon: refreshIcon,
        label: '',
        caption: 'Refresh the SQL sources'
      })
    );

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
