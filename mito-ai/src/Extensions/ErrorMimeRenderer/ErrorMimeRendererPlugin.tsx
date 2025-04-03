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
import { COMMAND_MITO_AI_OPEN_CHAT, COMMAND_MITO_AI_SEND_DEBUG_ERROR_MESSAGE } from '../../commands';
import MagicWandIcon from '../../icons/MagicWand';
import '../../../style/ErrorMimeRendererPlugin.css'
import { CollapsibleWarningBlock } from './CollapsibleWarningBlock';
import { getFullErrorMessageFromModel } from './errorUtils';

interface ErrorMessageProps {
    onDebugClick: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ onDebugClick }) => {
    return (
        <div className="error-mime-renderer-container">
            <button onClick={onDebugClick} className='error-mime-renderer-button'>
                <MagicWandIcon />
                <p>Fix Error in AI Chat</p>
            </button>
        </div>
    )
};
  
/**
 * A mime renderer plugin for the mimetype application/vnd.jupyter.stderr
 * 
 * This plugin augments the standard error output with a prompt to debug the error in the chat interface.
*/
const ErrorMimeRendererPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mito-ai:debug-error-with-ai',
    autoStart: true,
    requires: [IRenderMimeRegistry],
    activate: (app: JupyterFrontEnd, rendermime: IRenderMimeRegistry) => {
        const factory = rendermime.getFactory('application/vnd.jupyter.stderr');
        
        if (factory) {
            rendermime.addFactory({
                safe: true,
                mimeTypes: ['application/vnd.jupyter.stderr'],
                createRenderer: (options: IRenderMime.IRendererOptions) => {
                    const originalRenderer = factory.createRenderer(options);
                    return new AugmentedStderrRenderer(app, originalRenderer);
                }
            }, -1);  // Giving this renderer a lower rank than the default renderer gives this default priority
        }
        console.log("mito-ai: ErrorMimeRendererPlugin activated");
    }
};
  
/**
 * A widget that extends the default StderrRenderer.
*/
class AugmentedStderrRenderer extends Widget implements IRenderMime.IRenderer {
    private originalRenderer: IRenderMime.IRenderer;
    private app: JupyterFrontEnd;
  
    constructor(app: JupyterFrontEnd, originalRenderer: IRenderMime.IRenderer) {
        super();
        this.app = app;
        this.originalRenderer = originalRenderer;
    }
  
    /**
     * Render the original error message and append the custom prompt.
     */
    async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
        // Determine if it's an error or a warning. 
        // An error has:     'application/vnd.jupyter.error' 
        // A warning has:    'application/vnd.jupyter.stderr'
        const isErrorMessage = 'application/vnd.jupyter.error' in model.data;

        // Create the container for the custom UI elements
        const resolveInChatDiv = document.createElement('div');

        const originalNode = this.originalRenderer.node;

        // Only show the Fix Error in AI Chat button if it is an error, not a warning
        if (isErrorMessage) {
            createRoot(resolveInChatDiv).render(
                <ErrorMessage onDebugClick={() => this.openChatInterfaceWithError(model)} />
            );

            // Append the chat container before rendering the original output
            this.node.appendChild(resolveInChatDiv);
            
            // Render the original content
            await this.originalRenderer.renderModel(model);
        } else {
            // Apply styling for warnings
            // Strip styling, use ErrorMimeRendererPlugin.css
            originalNode.style.background = 'transparent';
            originalNode.style.padding = '0px';

            // Render the OutputBlock component
            createRoot(originalNode).render(
                <CollapsibleWarningBlock message={String(model.data['application/vnd.jupyter.stderr'] || '')} />
            );
        }

        // Append the original error/warning rendered node
        this.node.appendChild(originalNode);
    }

    /* 
        Open the chat interface and preload the error message into 
        the user input.
    */
    async openChatInterfaceWithError(model: IRenderMime.IMimeModel): Promise<void> {
        const structuredError = getFullErrorMessageFromModel(model);

        await this.app.commands.execute(COMMAND_MITO_AI_OPEN_CHAT, { focusChatInput: false });
        await this.app.commands.execute(COMMAND_MITO_AI_SEND_DEBUG_ERROR_MESSAGE, { input: structuredError });
    }
}
  
export default ErrorMimeRendererPlugin;