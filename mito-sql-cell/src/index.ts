import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';
import {
  EditorExtensionRegistry,
  IEditorExtensionRegistry
} from '@jupyterlab/codemirror';
import { NotebookPanel } from '@jupyterlab/notebook';
import {
  addIcon,
  CommandToolbarButton,
  refreshIcon,
  Toolbar
} from '@jupyterlab/ui-components';
import { find } from '@lumino/algorithm';
import { AddSource } from './addsource';
import { cellTypeSwitcher } from './celltypeselector';
import { NotebookContentFactory } from './contentfactory';
import { hideSqlMagic } from './hidemagic';
import { databaseIcon } from './icon';
import { SqlSourcesModel, SqlSourcesPanel } from './sources';
import { CommandIDs, type ISqlSource } from './tokens';
import { Widget } from '@lumino/widgets';

/**
 * Plugin using a custom cell widget for SQL cells.
 */
const contentFactory: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> = {
  id: 'mito-sql-cell:notebook-content-factory',
  description:
    'Plugin providing the notebook content factory with a special treatment for SQL cells.',
  provides: NotebookPanel.IContentFactory,
  requires: [IEditorServices, IEditorExtensionRegistry],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    editorServices: IEditorServices,
    editorExtensionRegistry: IEditorExtensionRegistry
  ) => {
    const sources = new SqlSourcesModel();

    // Add commands
    app.commands.addCommand(CommandIDs.addSource, {
      execute: async () => {
        const result = await showDialog<ISqlSource | null>({
          title: 'Add a SQL source',
          body: new AddSource(),
          buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Add' })]
        });

        if (result.button.accept && result.value) {
          sources.push(result.value);
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

    Promise.all([app.started, app.restored]).then(async () => {
      await sources.refresh();
    });

    const sourcesPanel = new SqlSourcesPanel({
      model: sources,
      commands: app.commands
    });
    sourcesPanel.id = 'mito-sql-sources';
    sourcesPanel.title.icon = databaseIcon;
    sourcesPanel.title.caption = 'SQL Sources';

    // Add toolbar items
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
        label: ''
      })
    );
    sourcesPanel.toolbar.addItem(
      'refresh',
      new CommandToolbarButton({
        commands: app.commands,
        id: CommandIDs.refreshSources,
        icon: refreshIcon,
        label: ''
      })
    );

    app.shell.add(sourcesPanel, 'left', { rank: 1000 });

    editorExtensionRegistry.addExtension({
      name: 'mito-sql-cell:hide-sql-magics',
      // Don't add the extension to the file editor
      factory: options =>
        options.inline
          ? EditorExtensionRegistry.createImmutableExtension(hideSqlMagic)
          : null
    });

    // FIXME use simpler widget extension instead of replacing the content factory
    const editorFactory = editorServices.factoryService.newInlineEditor;
    return new NotebookContentFactory({
      editorFactory,
      sqlSources: sources
    });
  }
};

export default [cellTypeSwitcher, contentFactory];
