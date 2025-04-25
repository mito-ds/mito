import { INotebookTracker } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { PathExt } from '@jupyterlab/coreutils';
import { getIncludeCellInApp } from '../../utils/notebook';
import { detectVisualizationType, getCellContent, getCellType, transformMatplotlibCell, transformMitoAppInput, transformPlotlyCell } from './notebookToStreamlitUtils';
import { generateRequirementsTxt } from './requirementsUtils';

// Convert notebook to Streamlit app
export const convertToStreamlit = async (
  notebookTracker: INotebookTracker,
  docManager: IDocumentManager
): Promise<void> => {

  console.log(docManager)
  const notebookPanel = notebookTracker.currentWidget;
  if (!notebookPanel) {
    console.error('No notebook is currently active');
    return;
  }
  
  const notebookPath = notebookPanel.context.path;
  const notebookDir = PathExt.dirname(notebookPath);
  const notebookName = PathExt.basename(notebookPath, '.ipynb');
  const outputFileName = `${notebookName}-streamlit-app.py`;
  const outputPath = PathExt.join(notebookDir, outputFileName);
  
  // Initialize Streamlit code with imports
  let streamlitCode = [
    "import streamlit as st",
    "import pandas as pd",
    "import numpy as np",
    "",
    `st.title('${notebookName}')`,
    ""
  ];

  // TODO: we can set the app favicon https://docs.streamlit.io/develop/api-reference/configuration/st.set_page_config
  
  // Process each cell
  notebookPanel.content.widgets.forEach((cellWidget) => {
    const cellModel = cellWidget.model;
    const cellType = getCellType(cellModel);
    const cellContent = getCellContent(cellModel);

    // Check if the cell is marked to skip.
    const includeCellInApp = getIncludeCellInApp(notebookTracker, cellModel.id)
    if (!includeCellInApp) {
      return
    }
    
    if (cellType === 'markdown') {
      // Convert markdown cells to st.markdown
      const escapedContent = cellContent.replace(/"""/g, '\\"\\"\\"');
      streamlitCode.push(`st.markdown("""${escapedContent}""")`);
      streamlitCode.push("");

      // Note: The single # Heading markdown in Streamlit is as big as the title, maybe larger.
      // So we might want to downsize them all by one or something.
    } else if (cellType === 'code') {
      // Check for visualization outputs if it's a code cell


      // TODO: Instead of chekcing cellType, we should just check this instanceof so we don't have to do both
      // to be type safe
      if (cellWidget instanceof CodeCell) {
        const { hasViz, vizType } = detectVisualizationType(cellWidget);
        
        let transformedCellContent = false;
        if (hasViz) {
          if (vizType === 'matplotlib') {
            // For matplotlib, transform the cell to add st.pyplot calls after plt.show() calls
            streamlitCode = streamlitCode.concat(transformMatplotlibCell(cellContent));
            transformedCellContent = true;
          } else if (vizType === 'plotly') {
            // For plotly, transform the cell to add st.plotly_chart calls
            streamlitCode = streamlitCode.concat(transformPlotlyCell(cellContent));
            transformedCellContent = true;
          }
        }

        if (!transformedCellContent) {
          // For non-visualization code cells, just include them as is
          streamlitCode.push("# Code Cell");
          const transformedLines = cellContent.split('\n').map(line => { return transformMitoAppInput(line)})
          streamlitCode = streamlitCode.concat(transformedLines);
          streamlitCode.push("");
        }
      }



      /* 
      Dispalying dataframes:
      It turns out that streamlit autoamtically renders dataframes if they are hanging on a line of code by themselves. 
      This is pretty close to what Jupyter does except that in Jupyter the dataframe has to be the final line of code in the code cell. 
      In Streamlit, since there are no code cells, that is not the case. 

      This will take care of the mito default dataframe output since we don't write any new code to display that dataframe. Sweet!
      However, this will not automatically handle:
      1. When the user does display(df) which the Ai sometimes does. This is almost never written by users, so maybe we shold just some prompt 
      engineering to handle this.
      2. If the user has a mitosheet.sheet() call. In that case, maybe we should convert it to a mito spreadsheet component. This should be 
      pretty easy to detect I think! 
      */

      /* 

      If the cell was marked to not display the outputs, we need to find a way to remove any hanging variables on a line.
      There are a few options to do this:
      1. Use pylance linting for the cell, if we get `Expression value is unusedPylancereportUnusedExpression` and the cell has outputs turned off, 
          then we would remove that line.. We would need to do this when we convert each cell otherwise we will not be able to easily 
          go back from line of code to the cell to figure out if we should be dispalying that cell's output or not. Or add comments in 
          the .py file that mark which code comes from which cell.
          -> It looks like we can use pyright to run linter for reportUnusedExpression. What we could do is: Add the line  to every line of code
              in a cell that should have outputs displayed. Then, run the linter, then remove any line of code that fails the reportUnusedExpression check. Finally, remove all of the
              # pyright: ignore reportUnusedExpression to clean up the code. It would be nice if we could turn the rule on and off for a series of lines, but I'm not seeing how to do that.. 
          -> Or maybe we can convert each cell, get the python code, run the linter if the cell is not supposed to show outputs, delete the lines that fail.
      2. Use AI and tell it to remove hanging variables from the cell.
      3. Find all of the variable names in the notebook and then look for lines that only contain a variable name. We also need to remove
          just hardcoded values. Although, these are probably pretty rare. 
      4. Maybe there is a streamlit configuration setting we can turn on for certain lines of code? 
           -> I'm not seeing one.. 


      Anyways, all together, I'm starting to think that this is not a feature we should use in v1. There is probably more work here than it is useful even though 
      it is a good polish feature. Let's see if users actually want it. We could easily do 'exclude entire cell' instead of just 'exclude cell output'
      */
    }
  });

  // Create the streamlit app.py file
  console.log(`Creating the file: ${outputPath}`)
  const streamlitSourceCode = streamlitCode.join('\n');
  console.log(streamlitSourceCode)
  // Eventually, we will write this to a file, but there is no uncertainty here, so we're skipping it for now. 


  // Build the requirements.txt file    
  const requirementsContent = await generateRequirementsTxt(notebookTracker);
  console.log("Creating requirements txt")
  console.log(requirementsContent)


  // In your convertToStreamlit function:
  console.log("DocManager structure:", Object.keys(docManager));


  const requirementsPath = PathExt.join(notebookDir, 'requirements.txt');
  try {
    // Use the contents manager to create the file
    await docManager.services.contents.save(requirementsPath, {
      type: 'file',
      format: 'text',
      content: requirementsContent
    });
    console.log(`Successfully saved requirements.txt to: ${requirementsPath}`);
  } catch (error) {
    console.error('Error creating requirements.txt file:', error);
  }
};