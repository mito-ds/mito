import { INotebookTracker } from "@jupyterlab/notebook";

// Function to generate requirements.txt content using the kernel
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
      // Use the kernel to execute Python code using pip freeze
      const session = notebookPanel.sessionContext.session;
      if (session) {
        // Create Python code to run pip freeze
        const pythonCode = `
  import subprocess
  result = subprocess.run(['pip', 'freeze'], capture_output=True, text=True)
  print(result.stdout)
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
            requirementsContent += '\n' + resultText.trim();
        }
      }
    } catch (error) {
      console.error('Error generating requirements.txt:', error);
      // Keep using our fallback list
    }
    
    return requirementsContent;
  };
  