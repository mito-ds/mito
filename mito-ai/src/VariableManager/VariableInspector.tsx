import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { KernelMessage } from '@jupyterlab/services';

export type Variables = Record<string, any>

// Function to fetch variables and sync with the frontend
async function fetchVariablesAndUpdateState(notebookPanel: NotebookPanel, setVariables: (variables: Variables) => void) {
    const kernel = notebookPanel.context.sessionContext.session?.kernel;
    if (kernel) {
        // Request the kernel to execute a command to fetch global variables
        const future = kernel.requestExecute({
            code: `import json; print(json.dumps({k: repr(v) for k, v in globals().items() if not k.startswith("_") and k not in ("In", "Out", "json") and not callable(v)}))`,
            
            // Adding silent: true prevents a execute_input message from being sent. This is important 
            // because it prevents an infinite loop where we fetch variables and in the process trigger 
            // a new execute_input which leads to fetching variables again.
            silent: true
        });

        // Listen for the output from the kernel
        future.onIOPub = (msg: KernelMessage.IMessage) => {
            // A 'stream' message represents standard output (stdout) or standard error (stderr) produced 
            // during the execution of code in the kernel.
            if (KernelMessage.isStreamMsg(msg)) {
                console.log("Found a stream message")
                if (msg.content.name === 'stdout') {
                    setVariables(JSON.parse(msg.content.text))
                }
            }
        };
    }
}

// Setup kernel execution listener
export function setupKernelListener(notebookTracker: INotebookTracker, setVariables: (variables: Variables) => void) {
    notebookTracker.currentChanged.connect((tracker, notebookPanel) => {
        if (!notebookPanel) {
            return;
        }

        // Listen to kernel messages
        notebookPanel.context.sessionContext.iopubMessage.connect((sender, msg: KernelMessage.IMessage) => {

            console.log(msg.header)

            // Watch for execute_input messages, which indicate is a request to execute code. 
            // Previosuly, we watched for 'execute_result' messages, but these are only returned
            // from the kernel when a code cell prints a value to the output cell, which is not what we want.
            // TODO: Check if there is a race condition where we might end up fetching variables before the 
            // code is executed. I don't think this is the case because the kernel runs in one thread I believe.
            if (msg.header.msg_type === 'execute_input') {
                fetchVariablesAndUpdateState(notebookPanel, setVariables);
            }
        });
    });
}