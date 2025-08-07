# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

def add_line_numbers_to_code(code: str) -> str:
    """Add line numbers to the code"""
    code_with_line_numbers = ""
    for i, line in enumerate(code.split('\n'), 1):
        code_with_line_numbers += f"{i:3d}: {line}\n"
        
    return code_with_line_numbers