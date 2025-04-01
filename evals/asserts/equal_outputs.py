# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

def assert_equal_outputs(expected_output: str, actual_output: str) -> bool:
    """
    Compares the output of two code executions. Returns True if the outputs are equal,
    and False otherwise.
    """
    
    return expected_output == actual_output
