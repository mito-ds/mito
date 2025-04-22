import { INotebookTracker } from '@jupyterlab/notebook';
import { ICellModel, CodeCell } from '@jupyterlab/cells';
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

// Helper function to check if a cell output contains a dataframe
const hasDataframeOutput = (cell: CodeCell): boolean => {
  const outputs = cell.model.outputs;
  
  for (let i = 0; i < outputs.length; i++) {
    const output = outputs.get(i);
    
    // Check for dataframe output types
    const mimeTypes = output.data ? Object.keys(output.data) : [];
    
    // Common mime types for dataframe outputs
    const dataframeMimeTypes = [
      'application/vnd.dataframe+json',
      //'application/vnd.jupyter.widget-view+json', // For widget-based dataframes
      'text/html' // Often used for rendered dataframes
    ];
    
    // If any of the mime types match dataframe types
    if (mimeTypes.some(type => dataframeMimeTypes.includes(type))) {
      // Check content in HTML to confirm it looks like a dataframe table
      if (output.data['text/html']) {
        const html = output.data['text/html'] as string;
        // Check for typical dataframe HTML patterns (table with pandas styling)
        if (html.includes('<table') && 
            (html.includes('dataframe') || html.includes('pandas') || 
             html.includes('<tbody>') || html.includes('<tr>'))) {
          return true;
        }
      }
      
      // For other dataframe types, trust the mime type
      if (output.data['application/vnd.dataframe+json']) {
        return true;
      }
    }
  }
  
  return false;
};

// Extract variable name from a code cell
// const extractDisplayedVariable = (cellContent: string): string | null => {
//   // Clean up the content and trim whitespace
//   const trimmedContent = cellContent.trim();
  
//   // If the cell just contains a variable name (and potentially comments), it's the displayed variable
//   const variableDisplayRegex = /^(\s*#.*\n)*\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(\s*#.*)?$/;
//   const match = trimmedContent.match(variableDisplayRegex);
  
//   if (match) {
//     const potentialVariable = match[2];
    
//     // Ignore common Python keywords and functions
//     const pythonKeywords = ['if', 'else', 'elif', 'for', 'while', 'def', 'class', 'return', 'import', 'from', 'print'];
//     if (!pythonKeywords.includes(potentialVariable)) {
//       return potentialVariable;
//     }
//   }
  
//   return null;
// };

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
  const cells = notebookPanel.content.widgets;
  for (let i = 0; i < cells.length; i++) {
    const cellWidget = cells[i];
    const cellModel = cellWidget?.model;
    if (!cellModel) {
      continue;
    }
    const cellType = getCellType(cellModel);
    const cellContent = getCellContent(cellModel);
    
    if (cellType === 'markdown') {
      // Convert markdown cells to st.markdown
      const escapedContent = cellContent.replace(/"""/g, '\\"\\"\\"');
      streamlitCode.push(`st.markdown("""${escapedContent}""")`);
      streamlitCode.push("");
    } 
    else if (cellType === 'code') {
      // Include the original code
      streamlitCode.push("# Original code cell:");
      streamlitCode = streamlitCode.concat(cellContent.split('\n'));
      
      // Check if this cell has dataframe output
      if (cellWidget instanceof CodeCell && hasDataframeOutput(cellWidget)) {
        // Try to extract the variable being displayed
        //const variableName = extractDisplayedVariable(cellContent);
        const variableName = "df"
        
        if (variableName) {
          streamlitCode.push("");
          streamlitCode.push(`# Display dataframe`);
          streamlitCode.push(`st.dataframe(${variableName})`);
        } else {
          // If we couldn't identify the variable but the output is a dataframe,
          // add a comment suggesting the user might need to manually add display code
          streamlitCode.push("");
          streamlitCode.push(`# NOTE: Dataframe output detected, but couldn't determine variable name.`);
          streamlitCode.push(`# You may need to manually add "st.dataframe(...)" for this content.`);
        }
      }
      
      streamlitCode.push("");
    }
  }

  console.log(`Creating the file: ${outputPath}`);
  const streamlitSourceCode = streamlitCode.join('\n');
  console.log(streamlitSourceCode);

  // Eventually, we will write this to a file, but there is no uncertainty here, so we're skipping it for now. 
};