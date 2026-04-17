# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest

from mito_ai.completions.metadata_validation_utils import validate_metadata_types
from mito_ai_core.completions.models import AIOptimizedCell, KernelVariable


def test_validate_metadata_types_coerces_supported_fields() -> None:
    raw_metadata = {
        "variables": [{"variable_name": "df", "type": "pd.DataFrame", "value": None}],
        "files": [{"file_name": "sales.csv"}],
        "aiOptimizedCells": [{"cell_type": "code", "id": "1", "code": "print('hi')"}],
        "input": "hello",
    }

    metadata = validate_metadata_types(raw_metadata)

    assert isinstance(metadata["variables"][0], KernelVariable)
    assert isinstance(metadata["files"][0], str)
    assert isinstance(metadata["aiOptimizedCells"][0], AIOptimizedCell)
    assert metadata["input"] == "hello"


def test_validate_metadata_types_returns_copy() -> None:
    raw_metadata = {"input": "hello"}

    metadata = validate_metadata_types(raw_metadata)

    assert metadata == raw_metadata
    assert metadata is not raw_metadata


def test_validate_metadata_types_raises_for_invalid_payload() -> None:
    with pytest.raises(ValueError, match="Invalid file payload"):
        validate_metadata_types({"files": [123]})
