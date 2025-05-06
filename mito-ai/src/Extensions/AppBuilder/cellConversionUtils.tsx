import { CodeCell, ICellModel } from "@jupyterlab/cells";

// Helper function to get cell content
export const getCellContent = (cell: ICellModel): string => {
    return cell.sharedModel.source;
};

// Helper function to get cell type
export const getCellType = (cell: ICellModel): string => {
    return cell.type;
};

// Helper function to check if a cell output contains a visualization
export const detectVisualizationType = (cell: CodeCell): {
    hasViz: boolean;
    vizType: 'plotly' | 'matplotlib' | null;
} => {
    // TODO: It would be nice to remove this entire function and just rely on 
    // parsing the content of the cell! This function relies on the cell outputs being
    // rendered! We don't really want this for a few reasons: 1) The user might not have
    // the notebook rendered 2) The rendered version of the notebook could be out of 
    // sync with the cell content. We _could_ detect this if we needed to, or just ignore it
    // for v1, or rerun the entire notebook before converting to a streamlit app, but ideally
    // we could just ignore all of that. TBD if we can reliably just use the cell content however.

    // TOOD: We are not detecting plotly graphs that are rendered with fig.show(renderer='iframe')

    const outputs = cell.model.outputs;

    for (let i = 0; i < outputs.length; i++) {
        const output = outputs.get(i);
        const mimeTypes = output.data ? Object.keys(output.data) : [];

        // Check for Plotly-specific output types
        if (mimeTypes.includes('application/vnd.plotly.v1+json')) {
            console.log("found with plotly mime type")
            return { hasViz: true, vizType: 'plotly' };
        }

        // For Matplotlib, look for image outputs
        if (mimeTypes.includes('image/png') || mimeTypes.includes('image/svg+xml')) {

            // Since the Mitosheet html contains references to plotly, we can't do this check 
            // outside of a more guarded check. Otherwise it will find plotly whenever there is 
            // a mitosheet in the cell output...
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
export const extractPlotlyFigVariableNames = (cellContent: string): string[] => {
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

// Generate the display_viz helper function for Streamlit
export const generateDisplayVizFunction = (): string => {
    return `
def display_viz(fig):
    """Display a visualization in Streamlit based on its type."""
    
    # Check for Plotly figure
    if hasattr(fig, 'update_layout') or str(type(fig)).find('plotly') >= 0:
        st.plotly_chart(fig)
        return
    
    # Check for Matplotlib figure
    if hasattr(fig, 'add_subplot') or str(type(fig)).find('matplotlib') >= 0:
        st.pyplot(fig)
        return
    
    # Fallback - try pyplot as it's most common
    try:
        st.pyplot(fig)
    except Exception:
        st.error(f"Couldn't display visualization of type: {type(fig)}")
        st.write(fig)  # Attempt to display as generic object
`;
};

// Transform visualization code for Streamlit using runtime detection
export const transformVisualizationCell = (cellContent: string): string => {
    const lines = cellContent.split('\n');
    const transformedLines: string[] = [];
    
    // Extract figure variable names
    const figVariables = extractPlotlyFigVariableNames(cellContent);
    
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        
        // Check for plt.show() calls. We need to replace these with display_viz(plt.gcf())
        // because we need to make sure we display the current figure.
        let replacedLine = false;
        if (line.trim().match(/plt\.show\(/)) {
            transformedLines.push("display_viz(plt.gcf())");
            replacedLine = true;
            continue;
        }
        
        // Check for figure.show() calls for any detected figure variables. Here, we need to pass
        // the figure name to display_viz.
        for (const figVar of figVariables) {
            if (line.trim().startsWith(`${figVar}.show`)) {
                transformedLines.push(`display_viz(${figVar})`);
                replacedLine = true;
                break;
            }
        }
        
        // If we didn't replace the line, keep the original
        if (!replacedLine) {
            transformedLines.push(line);
        }
    }
    
    return transformedLines.join('\n');
};

// Process matplotlib code cell and transform for Streamlit
export const transformMatplotlibCell = (cellContent: string): string => {
    const lines = cellContent.split('\n');
    const transformedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {

        // If this is a plt.show() line, swap it out for a st.pyplot call
        // Note: If a notebook cell has plt on the last line, it will render the graph in the notebook
        // NOT similarly, if there is a line of code that has a hanging matplotlib plot, it will NOT render in streamlit app
        // TODO: We are only looking for plt.show calls, but there are probably other ways to show a matplotlib graph, 
        // just like there are other ways to show a plotly graph
        if (lines[i]?.trim().startsWith('plt.show')) {
            transformedLines.push("st.pyplot(plt.gcf())");
        } else {
            transformedLines.push(lines[i] ?? '');
        }
    }

    return transformedLines.join('\n');
};

// Process plotly code cell and transform for Streamlit
export const transformPlotlyCell = (cellContent: string): string => {
    const lines = cellContent.split('\n');
    const transformedLines: string[] = [];

    // Try to extract all figure variables
    const figVariables = extractPlotlyFigVariableNames(cellContent);

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

    return transformedLines.join('\n');
};

export const transformMitoAppInput = (line: string): string => {

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
