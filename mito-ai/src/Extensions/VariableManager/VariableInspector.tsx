import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { KernelMessage } from '@jupyterlab/services';

export type Variable = {
    variable_name: string;
    type: string;
    value: any;
}

// TODO: Use something like raw-loader to load an actual python file 
// to make it easier to modify the script without creating syntax errors.
const pythonVariableInspectionScript = `import json


# We need to check if pandas is imported so we know if its safe
# to check for pandas dataframes 
_is_pandas_imported = False
try:
    import pandas as pd
    _is_pandas_imported = True
except:
    pass

# Function to convert dataframe to structured format
def get_dataframe_structure(df, sample_size=5):
    structure = {}
    for column in df.columns:
        structure[column] = {
            "dtype": str(df[column].dtype),
            "samples": df[column].head(sample_size).tolist()
        }
    return structure

def structured_globals():
    output = []
    for k, v in globals().items():
        if not k.startswith("_") and k not in ("In", "Out", "json") and not callable(v):
            if _is_pandas_imported and isinstance(v, pd.DataFrame):
                output.append({
                    "variable_name": k,
                    "type": "pd.DataFrame",
                    "value": get_dataframe_structure(v)
                })
            else:
                output.append({
                    "variable_name": k,
                    "type": str(type(v)),
                    "value": repr(v)
                })

    return json.dumps(output)

print(structured_globals())
`
// Function to fetch variables and sync with the frontend
async function fetchVariablesAndUpdateState(notebookPanel: NotebookPanel, setVariables: (variables: Variable[]) => void) {
    const kernel = notebookPanel.context.sessionContext.session?.kernel;
    if (kernel) {
        // Request the kernel to execute a command to fetch global variables
        const future = kernel.requestExecute({
            code: pythonVariableInspectionScript,
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
                if (msg.content.name === 'stdout') {
                    try {
                        setVariables(JSON.parse(msg.content.text))
                    } catch (e) {
                        console.log("Error parsing variables", e)
                    }
                }
            }
        };
    }
}

// Setup kernel execution listener
export function setupKernelListener(notebookTracker: INotebookTracker, setVariables: (variables: Variable[]) => void) {
    notebookTracker.currentChanged.connect((tracker, notebookPanel) => {
        if (!notebookPanel) {
            return;
        }

        // Listen to kernel messages
        notebookPanel.context.sessionContext.iopubMessage.connect((sender, msg: KernelMessage.IMessage) => {
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