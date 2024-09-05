import { Extension, Facet, RangeSetBuilder, StateEffect } from '@codemirror/state';
import { INotebookTracker } from '@jupyterlab/notebook';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { CodeMirrorEditor, IEditorExtensionRegistry } from '@jupyterlab/codemirror';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';


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
export function zebraStripes(options: { step?: number, on?: boolean } = {}): Extension {
    // If the extension is turned on, add the stripes
    if (options.on) {
        return [
            baseTheme,
            typeof options.step !== 'number' ? [] : stepSize.of(options.step),
            showStripes
        ];
    } else {
        // Otherwise, just return the basic themes
        return [baseTheme]
    }
}

/**
 * Initialization data for the @jupyterlab-examples/codemirror-extension extension.
 */

const codeDiffPlugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-examples/codemirror-extension:plugin',
  description: 'A minimal JupyterLab extension adding a CodeMirror extension.',
  autoStart: true,
  requires: [IEditorExtensionRegistry, ICommandPalette, INotebookTracker],
  activate: (app: JupyterFrontEnd, extensions: IEditorExtensionRegistry, palette: ICommandPalette, notebookTracker: INotebookTracker) => {
    
    // Helper function to update all notebook cells with zebra stripes
    // Helper function to update all notebook cells with zebra stripes
    function updateNotebookZebraStripes(enabled: boolean) {
        notebookTracker.forEach(notebookPanel => {
            console.log('Updating notebook:', notebookPanel);
            // Get all cells in the notebook
            const activeCell = notebookPanel.content.activeCell;
            if (activeCell) {
                console.log('Updating cell:', activeCell);
    
                // Check if the editor is a CodeMirror editor
                const editor = activeCell.editor;
                if (editor instanceof CodeMirrorEditor) {
                    const cmEditorView = editor.editor; // Access the underlying CodeMirror editor view
    
                    if (cmEditorView instanceof EditorView) {
                        console.log('Updating editor:', cmEditorView);
    
                        const options = {
                            step: cmEditorView.state.facet(stepSize), // Retain the existing step size
                            on: enabled
                        };
                        console.log('Updating options:', options);
    
                        const newState = cmEditorView.state.update({
                            effects: StateEffect.reconfigure.of(zebraStripes(options))
                        });
                        console.log('New state:', newState);
    
                        cmEditorView.dispatch(newState);
                    } else {
                        console.error('EditorView is not available in the CodeMirror editor.');
                    }
                } else {
                    console.error('Active cell does not have a CodeMirror editor.');
                }
            }
        });
    }

    // Add commands to toggle stripes on and off
    app.commands.addCommand('code-diff:on', {
      label: 'Enable Zebra Stripes',
      execute: () => {
        console.log('Enabling zebra stripes');
        updateNotebookZebraStripes(true);
      }
    });

    app.commands.addCommand('code-diff:off', {
      label: 'Disable Zebra Stripes',
      execute: () => {
        console.log('Disabling zebra stripes');
        updateNotebookZebraStripes(false);
      }
    });

    // Add commands to the command palette
    palette.addItem({ command: 'code-diff:on', category: 'Code Diff' });
    palette.addItem({ command: 'code-diff:off', category: 'Code Diff' });
  }
};

export default codeDiffPlugin;