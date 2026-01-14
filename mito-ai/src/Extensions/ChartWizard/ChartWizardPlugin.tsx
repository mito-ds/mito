/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';
import { ChartWizardWidget } from './ChartWizardWidget';
import { COMMAND_MITO_AI_OPEN_CHART_WIZARD } from '../../commands';
import TextAndIconButton from '../../components/TextAndIconButton';
import MagicWand from '../../icons/MagicWand'
import { logEvent } from '../../restAPI/RestAPI';
import '../../../style/ChartWizardPlugin.css'

export interface ChartWizardData {
    sourceCode: string;
    cellId: string;
    notebookTracker: INotebookTracker;
}

interface ChartWizardButtonProps {
    onButtonClick: () => void;
}

const ChartWizardButton: React.FC<ChartWizardButtonProps> = ({ onButtonClick }) => {
    return (
        <>
            <TextAndIconButton 
                icon={MagicWand}
                text="Chart Wizard"
                title="Chart Wizard"
                onClick={onButtonClick} 
                variant='purple'
                width='fit-contents'
                iconPosition='left'
            />
        </>
    )
};

const ChartWizardPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mito-ai:chart-wizard',
    autoStart: true,
    requires: [IRenderMimeRegistry, ICommandPalette, INotebookTracker],
    optional: [ILayoutRestorer],
    activate: (
        app: JupyterFrontEnd,
        rendermime: IRenderMimeRegistry,
        palette: ICommandPalette,
        notebookTracker: INotebookTracker,
        restorer: ILayoutRestorer | null
    ): void => {
        // Create the Chart Wizard widget
        const widget = new ChartWizardWidget();
        widget.id = 'mito-ai-chart-wizard';
        widget.title.label = 'Chart Wizard';
        widget.title.closable = true;

        // Track and restore the widget state
        const tracker = new WidgetTracker<ChartWizardWidget>({
            namespace: widget.id
        });

        // Function to open/update the Chart Wizard panel
        const openChartWizard = (chartData?: ChartWizardData): void => {
            // Update widget with new data if provided
            if (chartData) {
                widget.updateChartData(chartData);
            }

            // Add the widget to the tracker if not already there
            if (!tracker.has(widget)) {
                void tracker.add(widget);
            }

            // Get the current notebook panel for split-right mode
            const notebookPanel = notebookTracker.currentWidget;
            const refId = notebookPanel?.id;

            // Add the widget to main area with split-right mode (like StreamlitPreviewPlugin)
            if (!widget.isAttached) {
                if (refId) {
                    app.shell.add(widget, 'main', {
                        mode: 'split-right',
                        ref: refId
                    });
                } else {
                    // Fallback to right sidebar if no notebook is open
                    app.shell.add(widget, 'right');
                }
            }

            // Activate the widget
            app.shell.activateById(widget.id);
        };

        app.commands.addCommand(COMMAND_MITO_AI_OPEN_CHART_WIZARD, {
            label: 'Open Chart Wizard',
            execute: () => {
                void logEvent('clicked_chart_wizard_button', { source: 'command_palette' });
                openChartWizard();
            }
        });

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
    private reactRoot: Root | null = null;

    constructor(
        _app: JupyterFrontEnd,
        originalRenderer: IRenderMime.IRenderer,
        notebookTracker: INotebookTracker,
        openChartWizard: (chartData?: ChartWizardData) => void
    ) {
        super();
        this.originalRenderer = originalRenderer;
        this.notebookTracker = notebookTracker;
        this.openChartWizard = openChartWizard;
    }

    /**
     * Render the original image and append the Chart Wizard button.
     */
    async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
        // Clean up any existing React root before creating a new one
        if (this.reactRoot) {
            this.reactRoot.unmount();
            this.reactRoot = null;
        }

        const chartWizardDiv = document.createElement('div');
        chartWizardDiv.className = 'chart-wizard-button-container';
        const originalNode = this.originalRenderer.node;

        // Store the root reference so we can unmount it later
        this.reactRoot = createRoot(chartWizardDiv);
        this.reactRoot.render(
            <ChartWizardButton onButtonClick={() => this.handleButtonClick(model)} />
        );

        this.node.style.position = 'relative';
        this.node.classList.add('chart-wizard-output-container');
        this.node.appendChild(chartWizardDiv);
        await this.originalRenderer.renderModel(model);
        this.node.appendChild(originalNode);
    }

    /**
     * Dispose of the widget and clean up the React root.
     */
    dispose(): void {
        if (this.reactRoot) {
            this.reactRoot.unmount();
            this.reactRoot = null;
        }
        super.dispose();
    }

    /* 
        Handle the Chart Wizard button click.
        Extracts chart data and source code, then opens the Chart Wizard panel.
    */
    handleButtonClick(_model: IRenderMime.IMimeModel): void {
        void logEvent('clicked_chart_wizard_button', { source: 'chart_output_button' });
        
        // Get the notebook panel
        const notebookPanel = this.notebookTracker.currentWidget;
        if (!notebookPanel) {
            console.error('No active notebook panel');
            return;
        }

        // Find the cell that contains this output by traversing up the DOM tree
        const cellElement = this.node.closest('.jp-Cell') as HTMLElement | null;
        if (!cellElement) {
            console.error('Could not find cell element');
            return;
        }

        // Find the cell widget by checking which cell's node contains our element
        const cellWidget = notebookPanel.content.widgets.find(cell => {
            if (cell instanceof CodeCell) {
                return cell.node.contains(cellElement) || cellElement.contains(cell.node);
            }
            return false;
        });

        if (!(cellWidget instanceof CodeCell)) {
            console.warn('Could not find CodeCell widget for this output');
            return;
        }

        const sourceCode = cellWidget.model.sharedModel.source;
        const cellId = cellWidget.model.id;

        // Open the Chart Wizard with the extracted data
        this.openChartWizard({ sourceCode, cellId, notebookTracker: this.notebookTracker });
    }
}

export default ChartWizardPlugin;