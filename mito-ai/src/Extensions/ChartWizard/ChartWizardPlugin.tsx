/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IRenderMimeRegistry} from '@jupyterlab/rendermime';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';
import '../../../style/ChartWizardPlugin.css'

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
    requires: [IRenderMimeRegistry],
    activate: (app: JupyterFrontEnd, rendermime: IRenderMimeRegistry) => {
        const factory = rendermime.getFactory('image/png');
        
        if (factory) {
            rendermime.addFactory({
                safe: true,
                mimeTypes: ['image/png'],
                createRenderer: (options: IRenderMime.IRendererOptions) => {
                    const originalRenderer = factory.createRenderer(options);
                    return new AugmentedImageRenderer(app, originalRenderer);
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
  
    constructor(_app: JupyterFrontEnd, originalRenderer: IRenderMime.IRenderer) {
        super();
        this.originalRenderer = originalRenderer;
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
    */
    handleButtonClick(model: IRenderMime.IMimeModel): void {
        console.log('Chart Wizard button clicked!', model);
    }
}
  
export default ChartWizardPlugin;

