import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

function addLabels(notebook: any) {
    notebook.widgets.forEach((cell: any, index: number) => {
        requestAnimationFrame(() => {
            const existingLabel = cell.node.previousSibling;
            if (
                existingLabel &&
                existingLabel.classList?.contains('cell-number-label')
            ) {
                existingLabel.textContent = `Cell ${index + 1}`;
                return;
            }

            // Create the prompt area (for proper indentation)
            const promptArea = document.createElement('div');
            promptArea.className = 'lm-Widget jp-InputPrompt jp-InputArea-prompt';
            
            // Create the collapse button
            const collapseButton = document.createElement('button');
            collapseButton.className = 'jp-Button jp-collapseHeadingButton';
            collapseButton.setAttribute('data-heading-level', '1');
            
            // Add the button to the prompt area
            promptArea.appendChild(collapseButton);

            // Create the label
            const label = document.createElement('div');
            label.className = 'cell-number-label';
            label.textContent = `Cell ${index + 1}`;

            // Style it to match the prompt alignment
            label.style.fontSize = '0.75rem';
            label.style.color = 'var(--jp-ui-font-color3)';
            label.style.margin = '4px 0';
            label.style.paddingLeft = 'var(--jp-code-padding)'; // aligns with [ ]: prompt
            label.style.marginLeft = 'var(--jp-cell-prompt-width)';

            console.log('in addLabels');
            // Insert prompt area and label above the cell
            const parent = cell.node.parentElement;
            if (parent) {
                parent.insertBefore(promptArea, cell.node);
                parent.insertBefore(label, cell.node);
            }
        });
    });
}

const plugin: JupyterFrontEndPlugin<void> = {
    id: 'cell-numbering',
    autoStart: true,
    requires: [INotebookTracker],
    activate: (app, tracker) => {
        console.log('Cell numbering extension is active');

        tracker.widgetAdded.connect((_: any, notebookPanel: NotebookPanel) => {
            const notebook = notebookPanel.content;

            notebookPanel.context.ready.then(() => {
                requestAnimationFrame(() => {
                    addLabels(notebook);
                });

                notebook.model?.cells.changed.connect(() => {
                    addLabels(notebook);
                });

                notebook.activeCellChanged.connect(() => {
                    addLabels(notebook);
                });
            });
        });
    }
};

export default plugin;
