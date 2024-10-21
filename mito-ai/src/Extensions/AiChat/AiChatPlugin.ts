import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { Extension, Facet, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate
} from '@codemirror/view';

import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { buildChatWidget } from './ChatWidget';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IVariableManager } from '../VariableManager/VariableManagerPlugin';
import {
  EditorExtensionRegistry,
  IEditorExtensionRegistry
} from '@jupyterlab/codemirror';

import { COMMAND_MITO_AI_OPEN_CHAT } from '../../commands';

// Defines new styles for this extension
const baseTheme = EditorView.baseTheme({
  // We need to set some transparency because the stripe are above
  // the selection layer
  '&light .cm-zebraStripe': { backgroundColor: '#d4fafaaa' },
  '&dark .cm-zebraStripe': { backgroundColor: '#1a2727aa' }
});

// Resolve step to use in the editor
const stepSize = Facet.define<number, number>({
  combine: values => (values.length ? Math.min(...values) : 2)
});

// Add decoration to editor lines
const stripe = Decoration.line({
  attributes: { class: 'cm-zebraStripe' }
});

// Create the range of lines requiring decorations
function stripeDeco(view: EditorView) {
  const step = view.state.facet(stepSize) as number;
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      if (line.number % step === 0) {
        builder.add(line.from, line.from, stripe);
      }
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

// Update the decoration status of the editor view
const showStripes = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = stripeDeco(view);
    }

    update(update: ViewUpdate) {
      // Update the stripes if the document changed,
      // the viewport changed or the stripes step changed.
      const oldStep = update.startState.facet(stepSize);
      if (
        update.docChanged ||
        update.viewportChanged ||
        oldStep !== update.view.state.facet(stepSize)
      ) {
        this.decorations = stripeDeco(update.view);
      }
    }
  },
  {
    decorations: v => v.decorations
  }
);

// Full extension composed of elemental extensions
export function zebraStripes(options: { step?: number,  on?: boolean} = {}): Extension {
  if (options.on) {
    return [
      baseTheme,
      typeof options.step !== 'number' ? [] : stepSize.of(options.step),
        showStripes
      ];
    }
  return [];
}



/**
 * Initialization data for the mito-ai extension.
 */
const AiChatPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito_ai:plugin',
  description: 'AI chat for JupyterLab',
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette, IRenderMimeRegistry, IVariableManager, IEditorExtensionRegistry],
  optional: [ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd, 
    notebookTracker: INotebookTracker, 
    palette: ICommandPalette, 
    rendermime: IRenderMimeRegistry,
    variableManager: IVariableManager,
    editorExtensionRegistry: IEditorExtensionRegistry,
    restorer: ILayoutRestorer | null
  ) => {

    // Define a widget creator function,
    // then call it to make a new widget
    const newWidget = () => {
      // Create a blank content widget inside of a MainAreaWidget
      const chatWidget = buildChatWidget(app, notebookTracker, rendermime, variableManager)
      return chatWidget
    }

    let widget = newWidget();

    // Add an application command
    app.commands.addCommand(COMMAND_MITO_AI_OPEN_CHAT, {
      label: 'Your friendly Python Expert chat bot',
      execute: () => {
        
        // In order for the widget to be accessible, the widget must be:
        // 1. Created
        // 2. Added to the widget tracker
        // 3. Attatched to the frontend 

        // Step 1: Create the widget if its not already created
        if (!widget || widget.isDisposed) {
          widget = newWidget();
        }

        // Step 2: Add the widget to the widget tracker if 
        // its not already there
        if (!tracker.has(widget)) {
          tracker.add(widget);
        }

        // Step 3: Attatch the widget to the app if its not 
        // already there
        if (!widget.isAttached) {
          app.shell.add(widget, 'left', { rank: 2000 });
        }
         
        // Now that the widget is potentially accessible, activating the 
        // widget opens the taskpane
        app.shell.activateById(widget.id);
        
        // Set focus on the chat input
        const chatInput: HTMLTextAreaElement | null = widget.node.querySelector('.chat-input');
        chatInput?.focus();
      }
    });

    app.commands.addKeyBinding({
      command: COMMAND_MITO_AI_OPEN_CHAT,
      keys: ['Accel E'],
      selector: 'body',
    });

    app.shell.add(widget, 'left', { rank: 2000 });

    // Add the command to the palette.
    palette.addItem({ command: COMMAND_MITO_AI_OPEN_CHAT, category: 'AI Chat' });

    // Track and restore the widget state
    let tracker = new WidgetTracker({
      namespace: widget.id
    });

    if (restorer) {
      restorer.add(widget, 'mito_ai');
    }



    editorExtensionRegistry.addExtension(
      Object.freeze({
        name: '@jupyterlab-examples/codemirror:zebra-stripes',
        // Default CodeMirror extension parameters
        default: 2,
        factory: () =>
          // The factory will be called for every new CodeMirror editor
          EditorExtensionRegistry.createConfigurableExtension((step: number) =>
            zebraStripes({ step, on: true })
          ),
        // JSON schema defining the CodeMirror extension parameters
        schema: {
          type: 'number',
          title: 'Show stripes',
          description:
            'Display zebra stripes every "step" in CodeMirror editors.'
        }
      })
    );
  }
};

export default AiChatPlugin;


