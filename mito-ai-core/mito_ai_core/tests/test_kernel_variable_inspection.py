# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Kernel variable inspection script is loadable and valid Python."""

from mito_ai_core.kernel_variable_inspection import get_kernel_variable_inspection_script


def test_kernel_variable_inspection_script_loads_and_compiles() -> None:
    src = get_kernel_variable_inspection_script()
    assert "structured_globals" in src
    assert "scratch_" in src
    compile(src, "<kernel_variable_inspection>", "exec")
