import sys
from io import StringIO
import re


class Evals:

    def __init__(self,
            input_nb,
            output_nb,
            expected_output_nb,
            list_of_responses,
            conversation_history
        ):
        self.input_nb = input_nb
        self.output_nb = output_nb
        self.expected_output_nb = expected_output_nb
        self.list_of_responses = list_of_responses
        self.conversation_history = conversation_history
        self.immediate_next_response = list_of_responses[0]


    def compare_cells_exact_match(self, input_params):
        """
        Compares the cell content by cell_id in two notebooks(output and expected_output) for an exact match.
        Returns:
            bool: True if the cells match exactly, False otherwise.
        """
        cell_id = input_params["cell_id"]
        expected_output_cell = next((cell for cell in self.expected_output_nb.cells if cell.get('id') == cell_id), None)
        output_cell = next((cell for cell in self.output_nb.cells if cell.get('id') == cell_id), None)

        #print(f"expected_output_cell: {expected_output_cell}")
        #print(f"output_cell: {output_cell}")

        if expected_output_cell is None or output_cell is None:
            return False
        return expected_output_cell["source"].strip() == output_cell["source"].strip()


    def compare_next_response(self, input_params):
        """
        Compares the type and cell_type of the immediate next response of the agent
        Returns:
            bool: True if the types match, False otherwise.
        """
        response = self.immediate_next_response
        response_type = input_params["type"]
        cell_type = input_params["cell_type"]

        if response["type"]!=response_type or response["cell_update"]["cell_type"]!=cell_type:
            return False
        return True


    def check_new_cell_added(self, input_params):
        """
        Checks if a new cell is expected to be added
        Returns:
             bool: True a new cell addition is expected and False otherwise
        """
        expected_output = input_params["expected_output"]
        input_cells = [cell for cell in self.input_nb.cells if cell.cell_type == "code"]
        output_cells = [cell for cell in self.output_nb.cells if cell.cell_type == "code"]

        #print(f"expected_output: {expected_output}")
        #print(f"input_cells: {input_cells}")
        #print(f"output_cells: {output_cells}")

        result = True if len(output_cells) > len(input_cells) else False
        return result == expected_output


    def check_executed_variable_value_by_cell_id(self, input_params):
        """
        Executes all code cells in the notebook `output_nb` up to and including the cell with `cell_id`,
        Returns:
             bool: True if the value of `variable_name` matches the expected_value and False otherwise.
        """
        variable_name = input_params["variable_name"]
        cell_id = input_params["cell_id"]
        expected_value = input_params["expected_value"]

        globals_dict = {}
        old_stdout = sys.stdout
        sys.stdout = StringIO()

        try:
            for cell in self.output_nb.cells:
                if cell.cell_type != "code":
                    continue
                try:
                    exec(cell.source, globals_dict)
                except Exception as exec_err:
                    #print(f"Error in cell execution: {exec_err}")
                    return False
                if cell.get("id") == cell_id:
                    break
            return globals_dict.get(variable_name) == expected_value

        except Exception as e:
            #print(f"Unexpected error: {e}")
            return False

        finally:
            sys.stdout = old_stdout

    def check_executed_variable_value_by_cell_index(self, input_params):
        """
        Executes all code cells in the notebook `output_nb` up to and including the cell based on index value
        Returns:
             bool: True if the value of `variable_name` matches the expected_value and False otherwise.
        """
        variable_name = input_params["variable_name"]
        cell_index = input_params["cell_index"]
        expected_value = input_params["expected_value"]

        #print(f"variable_name: {variable_name}")
        #print(f"expected_value: {expected_value}")
        #print(f"cell_index: {cell_index}")

        globals_dict = {}
        old_stdout = sys.stdout
        sys.stdout = StringIO()

        try:
            #print("in try")
            for i in range(cell_index + 1):  # inclusive
                cell = self.output_nb.cells[i]
                if cell.cell_type != "code":
                    continue
                try:
                    exec(cell.source, globals_dict)
                except Exception as exec_err:
                    #print(f"Error in cell execution: {exec_err}")
                    return False
            #print(f"globals dict: {globals_dict.get(variable_name)}")
            return globals_dict.get(variable_name) == expected_value

        except Exception as e:
            #print(f"Unexpected error: {e}")
            return False

        finally:
            sys.stdout = old_stdout

    def check_executed_variable_type_by_id(self, input_params):
        """
        Executes all code cells in the notebook `output_nb` up to and including the cell with `cell_id`,
        Returns:
             cool: True if the type of `variable_name` matches the expected_type, and False otherwise.
        """
        variable_name = input_params["variable_name"]
        cell_id = input_params["cell_id"]
        expected_type = input_params["expected_type"]
        
        # TODO: We can probably get the cell index from the cell id 
        # and then call the check_executed_variable_value_by_cell_index 
        # function so we don't have to duplicate all of this logic.

        globals_dict = {}
        old_stdout = sys.stdout
        sys.stdout = StringIO()

        try:
            for cell in self.output_nb.cells:
                if cell.cell_type != "code":
                    continue
                try:
                    exec(cell.source, globals_dict)
                except Exception as exec_err:
                    #print(f"Error in cell execution: {exec_err}")
                    return False
                if cell.get("id") == cell_id:
                    break

            variable_value = globals_dict.get(variable_name, None)
            return isinstance(variable_value, expected_type)

        except Exception as e:
            #print(f"Unexpected error: {e}")
            return False

        finally:
            sys.stdout = old_stdout


    def check_executed_variable_type_by_cell_index(self, input_params):
        """
        Executes all code cells in the notebook `output_nb` up to and including the cell based on cell index
        Returns:
             bool: True if the type of `variable_name` matches the expected_type, and False otherwise.
        """
        if "cell_index" in input_params:
            cell_index = input_params["cell_index"]
        else:
            cell_index = len(self.output_nb.cells)-1
        variable_name = input_params["variable_name"]
        expected_type = input_params["expected_type"]

        globals_dict = {}
        old_stdout = sys.stdout
        sys.stdout = StringIO()

        try:
            for i in range(cell_index+1):
                cell = self.output_nb.cells[i]
                if cell.cell_type != "code":
                    continue
                try:
                    #print(f"cell_source: {cell.source}")
                    exec(cell.source, globals_dict)
                except Exception as exec_err:
                    #print(f"Error in cell execution: {exec_err}")
                    return False

            #print(f"globals_dict: {globals_dict}")
            variable_value = globals_dict.get(variable_name, None)
            return type(variable_value).__name__ == expected_type

        except Exception as e:
            #print(f"Unexpected error: {e}")
            return False

        finally:
            sys.stdout = old_stdout


    def check_cell_addition_index(self, input_params):
        """
        Checks if a new cell is added at the expected index
        Returns:
            bool: True if it is at the specified index and False otherwise
        """
        response = self.immediate_next_response
        expected_cell_index = input_params["index_expecting_change"]
        #print(f"response: {response}")
        if response["type"] == "cell_update" and response["cell_update"]["type"] == "new":
            return response["cell_update"]["index"] == expected_cell_index
        return False

    def test_correct_cell_edit(self, input_params):
        """
        Checks if the expected cell is edited in a cell update
        Returns:
            bool: True if the expected cell is edited and False otherwise
        """
        response = self.immediate_next_response
        expected_cell_to_edit = input_params["expected_cell_to_edit"]
        #print(f"response: {response}")
        #print(f"expected_cell_to_edit")
        if response["type"] == "cell_update" and response["cell_update"]["type"] == "modification":
            return response["cell_update"]["id"] == expected_cell_to_edit
        return False


    def check_mito_citation(self, input_params):
        """
        Checks if a MITO_CITATION object is present in the result
        Returns:
            bool; True if the MITO_CITATION object is present and False otherwise
        """
        last_response_message = self.list_of_responses[-1]["message"]
        citation_pattern = r"\[MITO_CITATION:[\w\-]+:\d+\]"
        match = re.search(citation_pattern, last_response_message)
        return True if match else False
