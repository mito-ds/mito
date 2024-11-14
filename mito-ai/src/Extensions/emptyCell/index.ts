import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  EditorExtensionRegistry,
  IEditorExtensionRegistry
} from '@jupyterlab/codemirror';
import { advicePlugin } from './emptyCell';

export const localPrompt: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:local-prompt',
  description: 'Add a local prompt to editor.',
  autoStart: true,
  requires: [IEditorExtensionRegistry],
  activate: (
    app: JupyterFrontEnd,
    extensions: IEditorExtensionRegistry
  ): void => {
    extensions.addExtension({
      name: 'mito-ai:local-prompt',
      factory: () =>
        EditorExtensionRegistry.createImmutableExtension(advicePlugin)
    });
  }
};
