import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { convertNotebookToStreamlit } from './NotebookToStreamlit';
import { IAppBuilderService } from './AppBuilderPlugin';

const StreamlitConversionPlugin: JupyterFrontEndPlugin<void> = {
  id: 'streamlit-converter',
  autoStart: true,
  requires: [INotebookTracker, IAppBuilderService],
  activate: async(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    appBuilderService: IAppBuilderService
  ) => {
    console.log('mito-ai: StreamlitConversionPlugin activated');

    await app.restored;
//     await app.started;
    console.log("Triggering deploy app button")
    const shouldTriggerDeploy = localStorage.getItem('trigger_deploy_after_login') === 'true';

    if (shouldTriggerDeploy) {
      localStorage.removeItem('trigger_deploy_after_login');

      // Wait until a notebook is actually active
      if (notebookTracker.currentWidget) {
        // Give the notebook a bit of time to finish loading context/kernel
        await notebookTracker.currentWidget.context.ready;

        // Call the deploy function
        await convertNotebookToStreamlit(notebookTracker, appBuilderService);
      } else {
        console.warn("No active notebook found to deploy");
      }
    }
  }
};

export default StreamlitConversionPlugin;
