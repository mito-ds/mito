# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import pytest
from mito_ai_core.completions.prompt_builders.prompt_section_registry import (
    get_max_trim_after_messages,
    get_all_section_classes,
    SectionRegistry
)
from mito_ai_core.completions.models import AIOptimizedCell, KernelVariable

def test_get_max_trim_after_messages_returns_actual_max():
    """Test that get_max_trim_after_messages returns the correct maximum value from all sections."""
    # Get all section classes and their trim_after_messages values
    section_classes = get_all_section_classes()
    trim_values = []
    
    for section_class in section_classes:
        trim_value = getattr(section_class, 'trim_after_messages', None)
        if trim_value is not None:
            trim_values.append(trim_value)
    
    if trim_values:
        expected_max = max(trim_values)
        actual_max = get_max_trim_after_messages()
        assert actual_max == expected_max
    else:
        # If all are None, should return 0
        assert get_max_trim_after_messages() == 0


def test_get_all_section_classes():
    """Test that get_all_section_classes returns all section classes."""
    section_classes = get_all_section_classes()
    
    # Verify it returns a list
    assert isinstance(section_classes, list)
    assert len(section_classes) > 0
    
    # Verify all items are classes from SectionRegistry
    for section_class in section_classes:
        assert section_class in SectionRegistry.__dict__.values()
        # Verify they have trim_after_messages attribute
        assert hasattr(section_class, 'trim_after_messages')


def test_files_section_normalizes_file_entries_to_json() -> None:
    files = [
        "results.csv",
        "sales.csv",
        "data/clean.parquet",
    ]

    section = SectionRegistry.Files(files)

    assert json.loads(section.content) == [
        {"path": "results.csv"},
        {"path": "sales.csv"},
        {"path": "data/clean.parquet"},
    ]


def test_variables_section_normalizes_kernel_variables() -> None:
    variables = [
        KernelVariable(variable_name="df", type="pd.DataFrame", value={"rows": 10}),
        KernelVariable(variable_name="threshold", type="int", value=5),
        KernelVariable(variable_name="series", type="pd.Series", value=[1, 2, 3]),
    ]

    section = SectionRegistry.Variables(variables)

    assert json.loads(section.content) == [
        {"name": "df", "type": "pd.DataFrame", "value": {"rows": 10}},
        {"name": "threshold", "type": "int", "value": 5},
        {"name": "series", "type": "pd.Series", "value": [1, 2, 3]},
    ]


def test_notebook_section_normalizes_cells_with_required_fields() -> None:
    cells = [
        AIOptimizedCell(cell_type="code", id="cell-1", code="import pandas as pd"),
        AIOptimizedCell(cell_type="markdown", id="cell-2", code="# Title"),
        AIOptimizedCell(cell_type="code", id="cell-3", code="df.head()"),
    ]

    section = SectionRegistry.Notebook(cells)

    assert json.loads(section.content) == [
        {
            "index": 0,
            "id": "cell-1",
            "cell_type": "code",
            "content": "import pandas as pd",
        },
        {
            "index": 1,
            "id": "cell-2",
            "cell_type": "markdown",
            "content": "# Title",
        },
        {
            "index": 2,
            "id": "cell-3",
            "cell_type": "code",
            "content": "df.head()",
        },
    ]

