/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import { KernelMessage } from '@jupyterlab/services';

export type Variable = {
    variable_name: string;
    type: string;
    value: any;
}

// TODO: Use something like raw-loader to load an actual python file 
// to make it easier to modify the script without creating syntax errors.
const pythonVariableInspectionScript = `import json
import inspect


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
    def convert_value(value):
        if pd.isna(value):
            # Handle None and NaN (convert to None, which maps to null in JSON)
            return None
        elif not isinstance(value, (str, int, float, bool, type(None))):
            return str(value)            
        return value 
        
    structure = {}
    for column in df.columns:
        structure[column] = {
            "dtype": str(df[column].dtype),
            "samples": [convert_value(x) for x in df[column].head(sample_size)]
        }
    return structure

def is_from_mitosheet(obj):
    """Check if an object is from any mitosheet module"""
    try:
        module = inspect.getmodule(obj)
        if module and (module.__name__.startswith('mitosheet')):
            return True

        # if the dictionary contains all of the mito functions, then we can assume that the object is from mitosheet
        mito_functions = ["STRIPTIMETOMONTHS", "GETNEXTVALUE", "FILLNAN"]
        if isinstance(obj, dict) and all(key in obj for key in mito_functions):
            return True


    except Exception:
        return False
    return False

def structured_globals():
    output = []
    for k, v in globals().items():

        # Skip mitosheet functions
        if is_from_mitosheet(v):
            continue

        if not k.startswith("_") and k not in ("In", "Out", "json") and not callable(v):
            
            if _is_pandas_imported and isinstance(v, pd.DataFrame):

                new_variable = {
                    "variable_name": k,
                    "type": "pd.DataFrame",
                    "value": get_dataframe_structure(v)
                }

                try:
                    # Check if the variable can be converted to JSON.
                    # If it can, add it to the outputs. If it can't, we just skip it.
                    # We check each variable individually so that we don't crash
                    # the entire variable inspection if just one variable cannot be serialized.
                    json.dumps(new_variable["value"])
                    output.append(new_variable)
                except:
                    pass

            else:

                new_variable = {
                    "variable_name": k,
                    "type": str(type(v)),
                    "value": repr(v)
                }

                try:
                    # Check if the variable can be converted to JSON.
                    # If it can, add it to the outputs. If it can't, we just skip it.
                    # We check each variable individually so that we don't crash
                    # the entire variable inspection if just one variable cannot be serialized.
                    json.dumps(new_variable["value"])
                    output.append(new_variable)
                except:
                    pass

    return json.dumps(output)

print(structured_globals())
`
// Function to fetch variables and sync with the frontend
export function fetchVariablesAndUpdateState(notebookPanel: NotebookPanel, setVariables: (variables: Variable[]) => void): void {
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