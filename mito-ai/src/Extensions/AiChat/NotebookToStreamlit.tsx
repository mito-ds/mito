
import { INotebookTracker } from '@jupyterlab/notebook';
import { ICellModel } from '@jupyterlab/cells';

// Helper function to get cell content
const getCellContent = (cell: ICellModel): string => {
  return cell.sharedModel.source;
};

// Helper function to get cell type
const getCellType = (cell: ICellModel): string => {
  return cell.type;
};

// Convert notebook to Streamlit app
export const convertToStreamlit = (notebookTracker: INotebookTracker): string => {
  const notebookPanel = notebookTracker.currentWidget;
  const notebookName = notebookPanel?.context.path.split('/').pop()?.split('.')[0] || 'notebook';
  
  // Initialize Streamlit code with imports
  let streamlitCode = [
    "import streamlit as st",
    "import pandas as pd",
    "import numpy as np",
    "import matplotlib.pyplot as plt",
    "",
    `st.title('${notebookName}')`,
    ""
  ];
  
  // Process each cell
  notebookPanel?.content.widgets.forEach((cellWidget) => {
    const cellModel = cellWidget.model;
    const cellType = getCellType(cellModel);
    const cellContent = getCellContent(cellModel);

    console.log(cellType, cellContent)
    
    // if (cellType === 'markdown') {
    //   // Convert markdown cells to st.markdown
    //   const escapedContent = cellContent.replace(/"""/g, '\\"\\"\\"');
    //   streamlitCode.push(`st.markdown("""${escapedContent}""")`);
    //   streamlitCode.push("");
    // } 
    // else if (cellType === 'code') {
    //   // For now, just include code cells as Python code with a comment
    //   streamlitCode.push("# Original code cell:");
    //   streamlitCode = streamlitCode.concat(cellContent.split('\n'));
    //   streamlitCode.push("");
    // }
  });
  
  return streamlitCode.join('\n');
};