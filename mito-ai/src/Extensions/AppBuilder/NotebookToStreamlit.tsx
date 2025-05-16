/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from '@jupyterlab/notebook';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { PathExt } from '@jupyterlab/coreutils';
import { getIncludeCellInApp } from '../../utils/notebook';
import { getCellContent, removeInvalidLines, transformMitoAppInput } from './cellConversionUtils';
import { generateRequirementsTxt } from './requirementsUtils';
import { saveFileWithKernel } from './fileUtils';
import { generateDisplayVizFunction, transformVisualizationCell } from './visualizationConversionUtils';
import { IAppBuilderService } from './AppBuilderPlugin';
import { UUID } from '@lumino/coreutils';
import { deployAppNotification } from './DeployAppNotification';
import { IBuildAppReply } from '../../websockets/appBuilder/appBuilderModels';

/* 
This function converts a notebook into a streamlit app. It processes each cell one by one,
and makes sure to convert specific functionality from the jupyter to streamlit equivalents.
For example, in Jupyter, you can display a streamlit graph by calling plt.show(), whereas in Streamlit,
you need to call st.plotly_chart().

This function returns:
1. A <notebook-name>-streamlit-app.py file
2. A requirements.txt file that lists the dependencies for the streamlit app
*/
export const convertNotebookToStreamlit = async (
  notebookTracker: INotebookTracker,
  appBuilderService?: IAppBuilderService,
): Promise<void> => {
  const notebookPanel = notebookTracker.currentWidget;
  if (!notebookPanel) {
    console.error('No notebook is currently active');
    return;
  }

  const notebookPath = notebookPanel.context.path;
  const notebookName = PathExt.basename(notebookPath, '.ipynb');
  const appFilePath = `./app.py`;

  // Initialize Streamlit code with imports
  let streamlitCode = [
    "import streamlit as st",
    "",
    `st.title('${notebookName}')`,
    generateDisplayVizFunction(),
    ""
  ];

  // TODO: we can set the app favicon https://docs.streamlit.io/develop/api-reference/configuration/st.set_page_config

  // Process each cell
  notebookPanel.content.widgets.forEach((cellWidget) => {
    const cellModel = cellWidget.model;
    let cellContent = getCellContent(cellModel);

    // Check if the cell is marked to skip.
    const includeCellInApp = getIncludeCellInApp(notebookTracker, cellModel.id)
    if (!includeCellInApp) {
      return
    }

    if (cellWidget instanceof MarkdownCell) {
      streamlitCode.push("\n# Converting Markdown Cell");
      // Convert markdown cells to st.markdown
      // TODO: The single # Heading markdown in Streamlit is as big as the title, maybe larger.
      // So we might want to downsize them all by one # to make it look nicer.
      const escapedContent = cellContent.replace(/"""/g, '\\"\\"\\"');
      streamlitCode.push(`st.markdown("""${escapedContent}""")`);
      streamlitCode.push("");
    } else if (cellWidget instanceof CodeCell) {
      
      streamlitCode.push("\n# Converting Code Cell");

      // Convert the Mito App Input into Streamlit components
      cellContent = cellContent.split('\n').map(line => { return transformMitoAppInput(line) }).join('\n');

      cellContent = removeInvalidLines(cellContent);

      // Transform the cell for visualizations using our new unified approach
      cellContent = transformVisualizationCell(cellContent);

      streamlitCode = streamlitCode.concat(cellContent);

      /* 
      Displaying dataframes:
      
      Streamlit automatically renders variables that appear alone on a line,
      similar to Jupyter's behavior with the last line of a cell.
      
      Benefits:
      - Default Mito dataframe output works without modification
      
      TODO: Edge cases to handle:
      1. User/AI-generated display(df) calls. We can tell the AI to not generate this. Users almost never do.
      2. mitosheet.sheet() calls - consider converting to Mito spreadsheet component or just dataframe output
      */
    }
  });

  // Create the streamlit app.py file
  const streamlitSourceCode = streamlitCode.join('\n');

  // Build the requirements.txt file    
  const requirementsContent = await generateRequirementsTxt(notebookTracker);

  // Save the files to the current directory
  await saveFileWithKernel(notebookTracker, './requirements.txt', requirementsContent);
  await saveFileWithKernel(notebookTracker, appFilePath, streamlitSourceCode);

  // Get the full path to the folder
  const pathToFolder = PathExt.dirname(notebookPath);

  // After building the files, we need to send a request to the backend to deploy the app
  if (appBuilderService) {
    try {
      console.log("Sending request to deploy the app");
      
      const response: IBuildAppReply = await appBuilderService.client.sendMessage({
        type: 'build-app',
        message_id: UUID.uuid4(),
        path: pathToFolder
      });
      
      console.log("App deployment response:", response);

      const url = response.url;
      deployAppNotification(url);

    } catch (error) {
      // TODO: Do something with the error
      console.error("Error deploying app:", error);
    }
  } else {
    console.warn("AppBuilderService not provided - app will not be deployed");
  }
};