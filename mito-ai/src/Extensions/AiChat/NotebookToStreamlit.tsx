import { INotebookTracker } from '@jupyterlab/notebook';
import { CodeCell, ICellModel } from '@jupyterlab/cells';
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

// Helper function to check if a cell output contains a visualization
const detectVisualizationType = (cell: CodeCell): {
  hasViz: boolean;
  vizType: 'plotly' | 'matplotlib' | null;
} => {
  const outputs = cell.model.outputs;
  
  for (let i = 0; i < outputs.length; i++) {
    const output = outputs.get(i);
    const mimeTypes = output.data ? Object.keys(output.data) : [];
    
    // Check for Plotly-specific output types
    if (mimeTypes.includes('application/vnd.plotly.v1+json')) {
      return { hasViz: true, vizType: 'plotly' };
    }
    
    // For Matplotlib, look for image outputs
    if (mimeTypes.includes('image/png') || mimeTypes.includes('image/svg+xml')) {
      // For matplotlib, we need to examine the HTML data if available
      if (mimeTypes.includes('text/html')) {
        const html = output.data['text/html'] as string;
        
        // If the HTML contains plotly.js references, it's likely a plotly chart
        if (html.includes('plotly') || html.includes('Plotly')) {
          return { hasViz: true, vizType: 'plotly' };
        }
      }
      
      // Default to matplotlib for other image outputs
      return { hasViz: true, vizType: 'matplotlib' };
    }
  }
  
  return { hasViz: false, vizType: null };
};

// Extract all figure variable names from a code cell
const extractPlotlyFigVariableNames = (cellContent: string): string[] => {
  // Clean up the content and trim whitespace
  const trimmedContent = cellContent.trim();
  const figureVariables: string[] = [];
  
  // Check for common visualization patterns based on the type
  // Look for fig.show() or px.* patterns
  const plotlyPatterns = [
    // Common variable patterns for figures
    /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*px\./,
    /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*go\.Figure/,
    /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*ff\./,
    /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*plotly\./,
    // Show methods
    /([a-zA-Z_][a-zA-Z0-9_]*).show\(/
  ];
  
  const lines = trimmedContent.split('\n');
  
  // Find all variable assignments that match Plotly patterns
  for (const line of lines) {
    for (const pattern of plotlyPatterns) {
      const matches = [...line.matchAll(new RegExp(pattern, 'g'))];
      for (const match of matches) {
        if (match[1] && !figureVariables.includes(match[1])) {
          // Check if it's not a Python keyword
          const pythonKeywords = ['if', 'else', 'elif', 'for', 'while', 'def', 'class', 'return', 'import', 'from', 'print'];
          if (!pythonKeywords.includes(match[1])) {
            figureVariables.push(match[1]);
          }
        }
      }
    }
  } 
  
  return figureVariables;
};

// Process matplotlib code cell and transform for Streamlit
const transformMatplotlibCell = (cellContent: string): string[] => {
  const lines = cellContent.split('\n');
  const transformedLines: string[] = [];
  
  // Generate modified version with st.pyplot calls after each plt.show()
  transformedLines.push("# Modified code for Streamlit:");
  
  for (let i = 0; i < lines.length; i++) {
    
    // If this is a plt.show() line, swap it out for a st.pyplot call
    // Note: If a notebook cell has plt on the last line, it will render the graph in the notebook
    // NOT similarly, if there is a line of code that has a hanging matplotlib plot, it will NOT render in streamlit app
    if (lines[i]?.trim().startsWith('plt.show')) {
      transformedLines.push("st.pyplot(plt.gcf())");
    } else {
      transformedLines.push(lines[i] ?? '');
    }
  }
  
  return transformedLines;
};

// Process plotly code cell and transform for Streamlit
const transformPlotlyCell = (cellContent: string): string[] => {
  const lines = cellContent.split('\n');
  const transformedLines: string[] = [];
  
  // Try to extract all figure variables
  const figVariables = extractPlotlyFigVariableNames(cellContent);
  
  // Generate modified version with st.plotly_chart calls
  transformedLines.push("# Modified code for Streamlit:");
  
  if (figVariables.length > 0) {
    // Keep track of which figure variables we've already processed
    const processedFigs = new Set<string>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      
      // Check if this line contains a .show() call for any of our figure variables
      let matchedFig = false;
      for (const figVar of figVariables) {
        // If this is a plt.show() line, swap it out for a st.pyplot call
        // Note: If a notebook cell has plt on the last line, it will render the graph in the notebook
        // Similarly, if there is a line of code that has a hanging plotly plot, it will render in streamlit app
        if (line.trim().startsWith(`${figVar}.show`)) {
          transformedLines.push(`st.plotly_chart(${figVar})`);
          processedFigs.add(figVar);
          matchedFig = true;
          break;
        }
      }
      
      // If it's not a .show() call, keep the line as is
      if (!matchedFig) {
        transformedLines.push(line);
      }
    }
  } else {
    // If no figure variables were found, just include the original code
    transformedLines.push(...lines);
  }
  
  return transformedLines;
};

const transformMitoAppInput = (line: string): string => {

  console.log("Input string", line)

  const getVariableNameDefaultAndLabel = (line: string, identifier: string): [string, string, string] => {
    // Split on the equal sign to get the variable name. We must use this full
    // name because its what the python script uses. 
    const variableName = line.split(' ')[0]?.trim() || ''

    // Split on the identifier to get the unique label for this variable
    let variableLabel = variableName?.split(identifier)[1] || ''
    
    if (variableLabel.startsWith("_")) {
      variableLabel = variableLabel.slice(1)
    }

    // Get the value after the equal sign to get the default value for the variable
    const defaultValue = line.split('=')[1]?.trim() || ''

    return [variableName, variableLabel, defaultValue]
  } 

  const textInputIdentifer = 'mito_app_text_input'
  if (line.startsWith(textInputIdentifer)) {
    const [variableName, variableLabel, defaultValue] = getVariableNameDefaultAndLabel(line, textInputIdentifer)
    return `${variableName} = st.text_input('${variableLabel}', ${defaultValue})`
  }

  const numberInputIdentifier = 'mito_app_number_input'
  if (line.startsWith(numberInputIdentifier)) {
    const [variableName, variableLabel, defaultValue] = getVariableNameDefaultAndLabel(line, numberInputIdentifier)
    return `${variableName} = st.number_input('${variableLabel}', ${defaultValue})`
  }

  const dateInputIdentifier = 'mito_app_date_input'
  if (line.startsWith(dateInputIdentifier)) {
    const [variableName, variableLabel, defaultValue] = getVariableNameDefaultAndLabel(line, dateInputIdentifier)

    // The user is responsible for making sure the right hand side is a valid option:
    // "today", datetime.date, datetime.datetime, "YYYY-MM-DD". 
    return `${variableName} = st.date_input('${variableLabel}', ${defaultValue})`
  }

  const booleanInputIdentifier = 'mito_app_boolean_input'
  if (line.startsWith(booleanInputIdentifier)) {
    const [variableName, variableLabel, defaultValue] = getVariableNameDefaultAndLabel(line, booleanInputIdentifier)
    return `${variableName} = st.checkbox('${variableLabel}', ${defaultValue})`
  }

  // If there was no text_input to create, then just return the original line.
  return line
}

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
    }
  });

  console.log(`Creating the file: ${outputPath}`)
  const streamlitSourceCode = streamlitCode.join('\n');
  console.log(streamlitSourceCode)

  // Eventually, we will write this to a file, but there is no uncertainty here, so we're skipping it for now. 
};