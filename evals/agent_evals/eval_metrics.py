import nbformat
import sys
from io import StringIO

def compare_cells_exact_match(input_nb, output_nb, cell_id):
    """
    Compares the cell content by cell_id in two notebooks for an exact match.

    Parameters:
        input_nb (NotebookNode): The input notebook object.
        output_nb (NotebookNode): The output notebook object.
        cell_id (str): The ID of the cell to compare.

    Returns:
        bool: True if the cells match exactly, False otherwise.
    """
    input_cell = next((cell for cell in input_nb.cells if cell.get('id') == cell_id), None)
    output_cell = next((cell for cell in output_nb.cells if cell.get('id') == cell_id), None)

    if input_cell is None or output_cell is None:
        return False

    return input_cell == output_cell


def check_new_cell_added(input_nb, output_nb):
    """
    Returns True if a new code cell was added in output_nb compared to input_nb.
    """
    input_cells = [cell for cell in input_nb.cells if cell.cell_type == "code"]
    output_cells = [cell for cell in output_nb.cells if cell.cell_type == "code"]

    return len(output_cells) > len(input_cells)


def check_executed_variable_value(output_nb, variable_name, cell_id, expected_value):
    """
    Executes all code cells in the notebook `nb` up to and including the cell with `cell_id`,
    then returns True if the value of `variable_name` matches the expected_valye and False otherwise
    """
    globals_dict = {}
    old_stdout = sys.stdout
    sys.stdout = StringIO()

    try:
        for cell in output_nb.cells:
            if cell.cell_type != "code":
                continue
            exec(cell.source, globals_dict)
            if cell.get("id") == cell_id:
                break

        sys.stdout = old_stdout
        return globals_dict.get(variable_name, None)==expected_value

    except Exception as e:
        sys.stdout = old_stdout
        print(f"Error executing notebook cells: {e}")
        return False


def check_executed_variable_type(output_nb, variable_name,  cell_id, expected_type):
    """
    Executes all code cells in the notebook `nb` up to and including the cell with `cell_id`,
    then returns True if the type of `variable_name` matches the expected_type and False otherwise
    """
    globals_dict = {}
    old_stdout = sys.stdout
    sys.stdout = StringIO()

    try:
        for cell in output_nb.cells:
            if cell.cell_type != "code":
                continue
            exec(cell.source, globals_dict)
            if cell.get("id") == cell_id:
                break

        sys.stdout = old_stdout
        return type(globals_dict.get(variable_name, None))==expected_type

    except Exception as e:
        sys.stdout = old_stdout
        print(f"Error executing notebook cells: {e}")
        return False


def check_update_type(expected_response, observed_response):
    pass


def check_cell_type(expected_response, observed_response):
    pass

