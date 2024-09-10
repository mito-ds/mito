import React from 'react';
import ReactDOM from 'react-dom';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';

interface ErrorMessageProps {}

const ErrorMessage: React.FC<ErrorMessageProps> = () => {
    return (
        <div className="error-mime-renderer-container">
            <button className='error-mime-renderer-button'>
                <p>Fix Error in AI Chat</p>
            </button>
        </div>
    )
};
  
/**
 * A widget that extends the default StderrRenderer.
*/
class AugmentedStderrRenderer extends Widget implements IRenderMime.IRenderer {
    private originalRenderer: IRenderMime.IRenderer;
  
    constructor(originalRenderer: IRenderMime.IRenderer) {
        super();
        this.originalRenderer = originalRenderer;
    }
  
    /**
     * Render the original error message and append the custom prompt.
     */
    async renderModel(model: IRenderMime.IMimeModel): Promise<void> {    
        const resolveInChatDiv = document.createElement('div');
        ReactDOM.render(<ErrorMessage  />, resolveInChatDiv);
        this.node.appendChild(resolveInChatDiv);

        // Get the original renderer and append it to the output
        await this.originalRenderer.renderModel(model);
        this.node.appendChild(this.originalRenderer.node);
    }

    /* 
        Get the error string from the model.
    */
    getErrorString(model: IRenderMime.IMimeModel): string {
        const error = model.data['application/vnd.jupyter.error']
        if (error && typeof error === 'object' && 'ename' in error && 'evalue' in error) {
            return `${error.ename}: ${error.evalue}`
        }
        return ''
    }
}
  
export default AugmentedStderrRenderer;