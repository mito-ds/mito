import { INotebookTracker } from '@jupyterlab/notebook';
import { ICellModel } from '@jupyterlab/cells';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { PathExt } from '@jupyterlab/coreutils';

// Helper function to get cell content
const getCellContent = (cell: ICellModel): string => {
  return cell.sharedModel.source;
};

// Helper function to get cell type
const getCellType = (cell: ICellModel): string => {
  return cell.type;
};

// Convert notebook to Streamlit app
export const convertToStreamlit = async (
  notebookTracker: INotebookTracker,
  docManager: IDocumentManager
): Promise<void> => {
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
  
  // Process each cell
  notebookPanel.content.widgets.forEach((cellWidget) => {
    const cellModel = cellWidget.model;
    const cellType = getCellType(cellModel);
    const cellContent = getCellContent(cellModel);

    console.log(cellType, cellContent)
    
    if (cellType === 'markdown') {
      // Convert markdown cells to st.markdown
      const escapedContent = cellContent.replace(/"""/g, '\\"\\"\\"');
      streamlitCode.push(`st.markdown("""${escapedContent}""")`);
      streamlitCode.push("");

      // Note: The single # Heading markdown in Streamlit is as big as the title, maybe larger.
      // So we might want to downsize them all by one or something.
    } 
    else if (cellType === 'code') {
      // For now, just include code cells as Python code with a comment
      streamlitCode.push("# Original code cell:");
      streamlitCode = streamlitCode.concat(cellContent.split('\n'));
      streamlitCode.push("");

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
    }
  });


  console.log(`Creating the file: ${outputPath}`)
  const streamlitSourceCode = streamlitCode.join('\n');
  console.log(streamlitSourceCode)


  // Eventually, we will write this to a file, but there is no uncertainty here, so we're skipping it for now. 
};