/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from "@jupyterlab/notebook";

// Function to generate requirements.txt content using the kernel with pipreqs
export const generateRequirementsTxt = async (
  notebookPanel: NotebookPanel,
  appFilename: string 
): Promise<string> => {

  // Initialize with fallback requirements in case kernel execution fails
  let requirementsContent = 'streamlit>=1.28.0'

  try {
    // Use the kernel to execute Python code using pipreqs
    const session = notebookPanel.sessionContext.session;
    if (session) {
      const sanitizedAppFilename = JSON.stringify(appFilename);

      // Create Python code to run pipreqs on the app file
      const pythonCode = `
import subprocess
import os
import tempfile
import shutil

# Check if the Streamlit app file exists in the notebook directory
app_py_filename = ${sanitizedAppFilename}
app_py_path = os.path.join(os.getcwd(), app_py_filename)
if not os.path.exists(app_py_path):
    print(f"Error: {app_py_filename} not found at {app_py_path}")
    exit(1)
notebook_dir = os.path.dirname(app_py_path)

try:
    # Create a temporary directory and copy the app file into it
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_app_path = os.path.join(tmpdir, app_py_filename)
        shutil.copy(app_py_path, tmp_app_path)

        # Run pipreqs on the temporary directory
        generate_req_in_file = subprocess.run(
            [
                'pipreqs',
                '--encoding=utf-8',
                '--savepath', os.path.join(notebook_dir, 'requirements.in'),
                '--force',
                tmpdir
            ],
            capture_output=True,
            text=True
        )

    print("Log: ", generate_req_in_file.stderr)

    # Read requirements.in and process each line
    requirements_in_path = os.path.join(notebook_dir, 'requirements.in')
    if os.path.exists(requirements_in_path):
        with open(requirements_in_path, 'r') as f:
            lines = f.readlines()
        
        processed_requirements = []
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Extract package name (everything before =)
            pkg_name = line.split('=')[0].strip()
            
            # Get package info using pip show
            try:
                result = subprocess.run(['pip', 'show', pkg_name], 
                                      capture_output=True, text=True, check=True)
                output = result.stdout
                
                # Parse the output to get Name and Version
                name = None
                version = None
                for output_line in output.split('\\n'):
                    if output_line.startswith('Name:'):
                        name = output_line.split(':', 1)[1].strip()
                    elif output_line.startswith('Version:'):
                        version = output_line.split(':', 1)[1].strip()
                
                if name and version:
                    processed_requirements.append(f"{name}=={version}")
                else:
                    processed_requirements.append(line)
            except subprocess.CalledProcessError:
                # If pip show fails, use the original line
                processed_requirements.append(line)
        
        # Print the processed requirements
        for req in processed_requirements:
            print(req)

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
      future.onIOPub = (msg: any): void => {
        if (msg.header.msg_type === 'stream' && msg.content.name === 'stdout') {
          const text = msg.content.text;
          if (text.startsWith('Log: ')) {
            console.error(text);
          } else {
            console.log('Found dependencies:\n', text);
            resultText += text;
          }
        }
      };

      // Wait for execution to complete
      await future.done;

      // Check if we got a non-empty result, add it to the requirements content
      if (resultText.trim()) {
        // Replace the default with pipreqs results
        requirementsContent = resultText.trim();

        const requiredPackages = ['streamlit', 'pandas', 'matplotlib', 'snowflake-sqlalchemy']
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
