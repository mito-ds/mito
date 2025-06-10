/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from "@jupyterlab/notebook";

// Function to generate requirements.txt content using the kernel with pipreqs
export const generateRequirementsTxt = async (
  notebookTracker: INotebookTracker
): Promise<string> => {
  const notebookPanel = notebookTracker.currentWidget;
  if (!notebookPanel) {
    console.error('No notebook is currently active');
    return '';
  }

  // Initialize with fallback requirements in case kernel execution fails
  let requirementsContent = 'streamlit>=1.28.0'

  try {
    // Use the kernel to execute Python code using pipreqs
    const session = notebookPanel.sessionContext.session;
    if (session) {
      // Collect all code in the notebook to analyze with pipreqs
      const notebook = notebookPanel.content;
      let codeContent = '';

      // Gather all code cells content
      notebook.widgets.forEach(cell => {
        if (cell.model.type === 'code') {
          codeContent += cell.model.sharedModel.source + '\n\n';
        }
      });

      // Create Python code to run pipreqs on a temporary directory
      const pythonCode = `
import subprocess
import os
import tempfile

# Create a temporary directory for pipreqs to analyze
with tempfile.TemporaryDirectory() as temp_dir:
    # Save the notebook code to a temporary Python file
    temp_file = os.path.join(temp_dir, "notebook_code.py")
    with open(temp_file, "w") as f:
        f.write("""${codeContent}""")
    
    # Make sure pipreqs is installed
    try:
        # Run pipreqs on the temporary directory
        result = subprocess.run(
            ['pipreqs', '--force', '--savepath', '-', temp_dir],
            capture_output=True, 
            text=True
        )
        print(result.stdout)
    except Exception as e:
        print(f"Error running pipreqs: {e}")
`;

      const kernel = session.kernel

      if (kernel === null) {
        console.error('No kernel found');
        return requirementsContent;
      }

      // Execute the code and get the result
      const future = kernel.requestExecute({
        code: pythonCode,
        silent: false
      });

      // Variable to store our result
      let resultText = '';

      // Set up handler for output
      future.onIOPub = (msg: any) => {
        if (msg.header.msg_type === 'stream' && msg.content.name === 'stdout') {
          resultText += msg.content.text;
        }
      };

      // Wait for execution to complete
      await future.done;

      // Check if we got a non-empty result, add it to the requirements content
      if (resultText.trim()) {
        // Replace the default with pipreqs results
        requirementsContent = resultText.trim();

        const requiredPackages = ['streamlit', 'pandas', 'matplotlib']
        // Make sure the required packages are included
        for (const requiredPackage of requiredPackages) {
          if (!requirementsContent.includes(requiredPackage)) {
            requirementsContent = requiredPackage + '\n' + requirementsContent;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error generating requirements.txt:', error);
    // Keep using our fallback list
  }

  return requirementsContent;
};
