/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

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

// Extract all potential visualization variable names from a code cell
export const extractVisualizationVariables = (cellContent: string): string[] => {
    // Clean up the content and trim whitespace
    const trimmedContent = cellContent.trim();
    const vizVariables: string[] = [];

    // Check for common visualization patterns for various libraries
    const vizPatterns = [
        // Plotly patterns
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*px\./,
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*go\.Figure/,
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*ff\./,
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*plotly\./,
        
        // Matplotlib patterns
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*plt\.figure/,
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*plt\.subplots/,
        
        // Generic patterns that might be visualizations
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*.*\.(plot|scatter|bar|hist|pie|boxplot|violin)/,
        /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*.*\.(figure|Figure)/,
        
        // Any variable involved in a show() call
        /([a-zA-Z_][a-zA-Z0-9_]*)\.show\(/
    ];

    const lines = trimmedContent.split('\n');

    // Find all variable assignments that match visualization patterns
    for (const line of lines) {
        for (const pattern of vizPatterns) {
            const matches = [...line.matchAll(new RegExp(pattern, 'g'))];
            for (const match of matches) {
                // For plt.subplots(), capture both fig and ax variables
                if (pattern.toString().includes('subplots') && match[2]) {
                    if (match[1] && !vizVariables.includes(match[1])) {
                        vizVariables.push(match[1]); // fig variable
                    }
                    if (match[2] && !vizVariables.includes(match[2])) {
                        vizVariables.push(match[2]); // ax variable
                    }
                } else if (match[1] && !vizVariables.includes(match[1])) {
                    // Check if it's not a Python keyword
                    const pythonKeywords = ['if', 'else', 'elif', 'for', 'while', 'def', 'class', 'return', 'import', 'from', 'print'];
                    if (!pythonKeywords.includes(match[1])) {
                        vizVariables.push(match[1]);
                    }
                }
            }
        }
    }

    return vizVariables;
};

// Transform visualization code for Streamlit using runtime detection
export const transformVisualizationCell = (cellContent: string): string => {
    const lines = cellContent.split('\n');
    const transformedLines: string[] = [];
    
    // Extract figure variable names
    const figVariables = extractVisualizationVariables(cellContent);
    
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