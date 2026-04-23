# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any, Dict, List, Optional

from mito_ai_core.completions.models import AIOptimizedCell as CoreAIOptimizedCell
from mito_ai_core.completions.models import KernelVariable


def _coerce_kernel_variables(raw: Any) -> Optional[List[KernelVariable]]:
    """JSON gives list of dicts; normalize to ``KernelVariable`` instances."""
    if raw is None:
        return None
    out: List[KernelVariable] = []
    for item in raw:
        if isinstance(item, KernelVariable):
            out.append(item)
        elif isinstance(item, dict):
            out.append(
                KernelVariable(
                    variable_name=str(item.get("variable_name", "")),
                    type=str(item.get("type", "")),
                    value=item.get("value"),
                )
            )
        elif isinstance(item, str):
            out.append(KernelVariable(variable_name=item, type="", value=None))
        else:
            raise ValueError(f"Invalid kernel variable payload: {item!r}")
    return out


def _coerce_files(raw: Any) -> Optional[List[str]]:
    """Normalize frontend file payloads to path strings."""
    if raw is None:
        return None
    out: List[str] = []
    for item in raw:
        if isinstance(item, str):
            out.append(item)
        elif isinstance(item, dict):
            out.append(str(item.get("file_name", "")))
        else:
            raise ValueError(f"Invalid file payload: {item!r}")
    return out


def _coerce_ai_optimized_cells(raw: Any) -> Optional[List[CoreAIOptimizedCell]]:
    """Normalize frontend notebook cell payloads to ``AIOptimizedCell`` instances."""
    if raw is None:
        return None
    out: List[CoreAIOptimizedCell] = []
    for item in raw:
        if isinstance(item, CoreAIOptimizedCell):
            out.append(item)
        elif isinstance(item, dict):
            out.append(
                CoreAIOptimizedCell(
                    cell_type=str(item.get("cell_type", "")),
                    id=str(item.get("id", "")),
                    code=str(item.get("code", "")),
                )
            )
        else:
            raise ValueError(f"Invalid aiOptimizedCells payload: {item!r}")
    return out


def validate_metadata_types(metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Return metadata with known structured fields coerced to backend types."""
    normalized_metadata = dict(metadata)

    if "variables" in normalized_metadata:
        normalized_metadata["variables"] = _coerce_kernel_variables(
            normalized_metadata.get("variables")
        )
    if "files" in normalized_metadata:
        normalized_metadata["files"] = _coerce_files(normalized_metadata.get("files"))
    if "aiOptimizedCells" in normalized_metadata:
        normalized_metadata["aiOptimizedCells"] = _coerce_ai_optimized_cells(
            normalized_metadata.get("aiOptimizedCells")
        )

    return normalized_metadata
