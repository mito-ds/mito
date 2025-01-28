import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';

const ComposerPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mito-ai:composer',
    autoStart: true,
    requires: [ILauncher],
    activate: (app: JupyterFrontEnd, launcher: ILauncher) => {
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
            }
        });
    }
};

export default ComposerPlugin;