from typing import Dict, Any, Tuple
import sys
from io import StringIO

def exec_code_and_get_globals_and_output(code: str) -> Tuple[Dict[str, Any], str]:
    """
    Executes the code and returns the globals and output.
    """
    # Capture output for actual code
    try:
        # Store the stdout so we can restore it after the code is executed
        old_stdout = sys.stdout

        # Create a new StringIO object to capture the output
        actual_output = StringIO()
        sys.stdout = actual_output

        # Create a new globals dictionary to store the variables
        globals = {}

        # Execute the code
        code = remove_process_pausing_code_lines(code)
        exec(code, globals)

        sys.stdout = old_stdout
        actual_output_str = actual_output.getvalue()
        
    except Exception as e:
        # Always restore the stdout
        sys.stdout = old_stdout
        raise e
    
    return globals, actual_output_str


def remove_process_pausing_code_lines(code: str) -> str:
    """
    When plt.show() is called, it pauses execution of the tests until the user closes the plot.
    """
    if "plt.show()" in code:
        return code.replace("plt.show()", "")
    return code
