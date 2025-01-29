import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';
import { IDocumentManager } from '@jupyterlab/docmanager';
// import { COMMAND_MITO_AI_OPEN_CHAT } from '../../commands';
import { MainAreaWidget } from '@jupyterlab/apputils';
import ComposerWidget from './ComposerWidget';

const ComposerPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mito-ai:composer',
    autoStart: true,
    requires: [ILauncher, IDocumentManager],
    activate: (app: JupyterFrontEnd, launcher: ILauncher, docManager: IDocumentManager) => {
        console.log('ComposerPlugin activated');

        // Add the launcher item
        launcher.add({
            command: 'mito-ai:open-composer',
            category: 'Notebook',
            rank: 1,
        });

        // Add the command to the command registry
        app.commands.addCommand('mito-ai:open-composer', {
            label: 'Mito AI Composer',
            execute: () => {
                // Create a new notebook
                // docManager.createNew('composer_temp.ipynb');
                // // Open the chat widget
                // app.commands.execute(COMMAND_MITO_AI_OPEN_CHAT);
                const content = new ComposerWidget({ app });
                const widget = new MainAreaWidget<ComposerWidget>({ content });
                widget.title.label = 'Mito Composer';
                app.shell.add(widget, 'main');
            }
        });
    }
};

export default ComposerPlugin;