import {
    JupyterFrontEnd, JupyterFrontEndPlugin
  } from '@jupyterlab/application';
  import {
    IRenderMimeRegistry
  } from '@jupyterlab/rendermime';
  import {
    IRenderMime
  } from '@jupyterlab/rendermime-interfaces';
  import {
    Widget
  } from '@lumino/widgets';
  
/**
 * A mime renderer plugin for the mimetype application/vnd.jupyter.stderr
 * 
 * This plugin augments the standard error output with a prompt to debug the error in the chat interface.
*/
const errorPlugin: JupyterFrontEndPlugin<void> = {
    id: 'jupyterlab-debug-prompt',
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
                return new AugmentedStderrRenderer(originalRenderer);
            }
            }, -1);  // Giving this renderer a lower rank than the default renderer gives this default priority
        }
    }
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
      // Get the original renderer and append it to the output
      await this.originalRenderer.renderModel(model);
      this.node.appendChild(this.originalRenderer.node);
  
      // Augment the standard error output
      const prompt = document.createElement('div');
      prompt.textContent = "Do you want to debug this error in the chat interface?";
      prompt.style.fontWeight = "bold";
      prompt.style.color = "red";
      prompt.style.marginTop = "10px";
      this.node.appendChild(prompt);
    }
  }
  
  export default errorPlugin;