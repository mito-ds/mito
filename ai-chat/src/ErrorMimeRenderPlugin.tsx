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
                return new AugmentedStderrRenderer(app, originalRenderer);
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
      // Get the original renderer and append it to the output
      await this.originalRenderer.renderModel(model);
      this.node.appendChild(this.originalRenderer.node);
  
      // Augment the standard error output
      const resolveInChatDiv = document.createElement('div');
      resolveInChatDiv.onclick = () => {
        // Open the chat interface and put this error in the chat
        // Execute the command ai-chat:open
        console.log('passing this to the chat:', model.data)
        const error = model.data['application/vnd.jupyter.error']
        if (error && typeof error === 'object' && 'ename' in error && 'evalue' in error) {
            const errorName = (error as { ename: string; evalue: string }).ename;
            const errorValue = (error as { ename: string; evalue: string }).evalue;

            const conciseErrorMessage = `${errorName}: ${errorValue}`
            this.app.commands.execute('ai-chat:open', { error: conciseErrorMessage });
        
        } else {
            this.app.commands.execute('ai-chat:open');
        }
      };

      resolveInChatDiv.textContent = "Do you want to debug this error in the chat interface?";
      resolveInChatDiv.style.fontWeight = "bold";
      resolveInChatDiv.style.color = "red";
      resolveInChatDiv.style.marginTop = "10px";
      this.node.appendChild(resolveInChatDiv);
    }
}
  
export default errorPlugin;