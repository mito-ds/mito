# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Load the canonical kernel variable-inspection script (see resources/)."""

from __future__ import annotations

from importlib import resources


def get_kernel_variable_inspection_script() -> str:
    """Return Python source executed in the kernel to emit structured variable JSON."""
    return resources.files("mito_ai_core.resources").joinpath("kernel_variable_inspection.txt").read_text(
        encoding="utf-8"
    )
