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
    } 
    else if (cellType === 'code') {
      // For now, just include code cells as Python code with a comment
      streamlitCode.push("# Original code cell:");
      streamlitCode = streamlitCode.concat(cellContent.split('\n'));
      streamlitCode.push("");
    }
  });


  console.log(`Creating the file: ${outputPath}`)
  const streamlitSourceCode = streamlitCode.join('\n');
  console.log(streamlitSourceCode)


  // Eventually, we will write this to a file, but there is no uncertainty here, so we're skipping it for now. 
};