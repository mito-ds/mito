/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker, MainAreaWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';
import { IRenderMimeRegistry} from '@jupyterlab/rendermime';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';
import { ChartWizardWidget } from './ChartWizardWidget';
import { COMMAND_MITO_AI_OPEN_CHART_WIZARD } from '../../commands';
import '../../../style/ChartWizardPlugin.css'

export interface ChartWizardData {
    imageData: string; // base64 encoded image
    sourceCode: string;
    cellId?: string;
}

interface ChartWizardButtonProps {
    onButtonClick: () => void;
}

const ChartWizardButton: React.FC<ChartWizardButtonProps> = ({ onButtonClick }) => {
    return (
        <div className="chart-wizard-container">
            <button onClick={onButtonClick} className='chart-wizard-button'>
                <p>Chart Wizard</p>
            </button>
        </div>
    )
};
  
/**
 * A mime renderer plugin for matplotlib charts (image/png)
 * 
 * This plugin augments matplotlib chart outputs with a Chart Wizard button.
*/
const ChartWizardPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mito-ai:chart-wizard',
    autoStart: true,
    requires: [IRenderMimeRegistry, ICommandPalette, INotebookTracker],
    optional: [ILayoutRestorer],
    activate: (app: JupyterFrontEnd, rendermime: IRenderMimeRegistry, palette: ICommandPalette, notebookTracker: INotebookTracker, restorer: ILayoutRestorer | null) => {
        // Create a widget creator function
        const newWidget = (chartData?: ChartWizardData): MainAreaWidget => {
            const content = new ChartWizardWidget(chartData);
            const widget = new MainAreaWidget({ content });
            widget.id = 'mito-ai-chart-wizard';
            widget.title.label = 'Chart Wizard';
            widget.title.closable = true;
            return widget;
        };

        let widget = newWidget();

        // Track and restore the widget state
        const tracker = new WidgetTracker<MainAreaWidget>({
            namespace: widget.id
        });

        // Function to open the Chart Wizard panel
        const openChartWizard = (chartData?: ChartWizardData): void => {
            // Dispose the old widget and create a new one if needed
            if (widget && !widget.isDisposed) {
                widget.dispose();
            }
            widget = newWidget(chartData);

            // Add the widget to the tracker
            if (!tracker.has(widget)) {
                void tracker.add(widget);
            }

            // Add the widget to the app
            if (!widget.isAttached) {
                void app.shell.add(widget, 'main');
            }

            // Activate the widget
            app.shell.activateById(widget.id);
        };

        // Add an application command
        app.commands.addCommand(COMMAND_MITO_AI_OPEN_CHART_WIZARD, {
            label: 'Open Chart Wizard',
            execute: () => {
                openChartWizard();
            }
        });

        // Add the command to the palette
        palette.addItem({
            command: COMMAND_MITO_AI_OPEN_CHART_WIZARD,
            category: 'Mito AI'
        });

        if (!tracker.has(widget)) {
            void tracker.add(widget);
        }

        if (restorer) {
            restorer.add(widget, 'mito-ai-chart-wizard');
        }

        // Set up the image renderer factory
        const factory = rendermime.getFactory('image/png');
        
        if (factory) {
            rendermime.addFactory({
                safe: true,
                mimeTypes: ['image/png'],
                createRenderer: (options: IRenderMime.IRendererOptions) => {
                    const originalRenderer = factory.createRenderer(options);
                    return new AugmentedImageRenderer(app, originalRenderer, notebookTracker, openChartWizard);
                }
            }, -1);  // Giving this renderer a lower rank than the default renderer gives this default priority
        }
        console.log("mito-ai: ChartWizardPlugin activated");
    }
};
  
/**
 * A widget that extends the default ImageRenderer for matplotlib charts.
*/
class AugmentedImageRenderer extends Widget implements IRenderMime.IRenderer {
    private originalRenderer: IRenderMime.IRenderer;
    private notebookTracker: INotebookTracker;
    private openChartWizard: (chartData?: ChartWizardData) => void;
  
    constructor(_app: JupyterFrontEnd, originalRenderer: IRenderMime.IRenderer, notebookTracker: INotebookTracker, openChartWizard: (chartData?: ChartWizardData) => void) {
        super();
        this.originalRenderer = originalRenderer;
        this.notebookTracker = notebookTracker;
        this.openChartWizard = openChartWizard;
    }
  
    /**
     * Render the original image and append the Chart Wizard button.
     */
    async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
        // Create the container for the Chart Wizard button
        const chartWizardDiv = document.createElement('div');

        const originalNode = this.originalRenderer.node;

        // Render the Chart Wizard button
        createRoot(chartWizardDiv).render(
            <ChartWizardButton onButtonClick={() => this.handleButtonClick(model)} />
        );

        // Append the button container before rendering the original output
        this.node.appendChild(chartWizardDiv);
        
        // Render the original image content
        await this.originalRenderer.renderModel(model);

        // Append the original image rendered node
        this.node.appendChild(originalNode);
    }

    /* 
        Handle the Chart Wizard button click.
        Extracts chart data and source code, then opens the Chart Wizard panel.
    */
    handleButtonClick(model: IRenderMime.IMimeModel): void {
        // Extract image data from the model
        const imageData = model.data['image/png'] as string | undefined;
        if (!imageData) {
            console.error('No image data found in model');
            this.openChartWizard();
            return;
        }

        // Get the notebook panel
        const notebookPanel = this.notebookTracker.currentWidget;
        if (!notebookPanel) {
            console.error('No active notebook panel');
            this.openChartWizard({ imageData, sourceCode: '' });
            return;
        }

        // Find the cell that contains this output by traversing up the DOM tree
        const cellElement = this.node.closest('.jp-Cell') as HTMLElement | null;
        if (!cellElement) {
            console.error('Could not find cell element');
            this.openChartWizard({ imageData, sourceCode: '' });
            return;
        }

        // Find the cell widget by checking which cell's node contains our element
        const cellWidget = notebookPanel.content.widgets.find(cell => {
            if (cell instanceof CodeCell) {
                return cell.node.contains(cellElement) || cellElement.contains(cell.node);
            }
            return false;
        });
        
        let sourceCode = '';
        let cellId: string | undefined;
        
        if (cellWidget instanceof CodeCell) {
            sourceCode = cellWidget.model.sharedModel.source;
            cellId = cellWidget.model.id;
        } else {
            console.warn('Could not find CodeCell widget for this output');
        }

        // Open the Chart Wizard with the extracted data
        this.openChartWizard({ imageData, sourceCode, cellId });
    }
}
  
export default ChartWizardPlugin;

