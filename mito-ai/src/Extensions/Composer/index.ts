import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';
import { IDocumentManager } from '@jupyterlab/docmanager';

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
                console.log('Mito AI Composer clicked!');
                // Create a new notebook
                docManager.createNew('composer_temp.ipynb');
            }
        });
    }
};

export default ComposerPlugin;