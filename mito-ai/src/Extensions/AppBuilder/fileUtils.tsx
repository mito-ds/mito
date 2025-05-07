/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from "@jupyterlab/notebook";

export const saveFileWithKernel = async (
  notebookTracker: INotebookTracker,
  filePath: string,
  fileContent: string
): Promise<void> => {
  const notebookPanel = notebookTracker.currentWidget;
  if (!notebookPanel) {
    console.error('No notebook is currently active');
    return;
  }

  try {
    // Use the kernel to execute Python code
    const session = notebookPanel.sessionContext.session;
    if (session) {
      // Escape any triple quotes in the source code
      const escapedContent = fileContent.replace(/"""/g, '\\"\\"\\"');

      // Create Python code to save the file
      const pythonCode = `
import os

# Ensure directory exists
os.makedirs(os.path.dirname("${filePath.replace(/\\/g, '\\\\')}"), exist_ok=True)

# Save the file
with open("${filePath.replace(/\\/g, '\\\\')}", 'w') as f:
    f.write("""${escapedContent}""")

print(f"File saved successfully to ${filePath}")
        `;

      if (!session.kernel) {
        throw new Error('Kernel is not available');
      }
      // Execute the code
      const future = session.kernel.requestExecute({
        code: pythonCode,
        silent: false
      });

      // Set up handler for output
      future.onIOPub = (msg: any) => {
        if (msg.header.msg_type === 'stream' && msg.content.name === 'stdout') {
          console.log('Python output:', msg.content.text);
        }
      };

      // Wait for execution to complete
      await future.done;
      console.log(`File save completed for: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error saving file to ${filePath}:`, error);
  }
};