#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Streamlit API recorder for card scripts.

Card code is written like a Streamlit app. On run, these names are in scope:
  st, row, df, row_index, pd, np

Calls are recorded and rendered in the mitosheet card UI.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, Union

import pandas as pd

try:
    import numpy as np
except ImportError:
    np = None  # type: ignore

MAX_DATAFRAME_ROWS = 12
MAX_DATAFRAME_COLS = 8

_SAFE_BUILTINS = {
    "str": str,
    "int": int,
    "float": float,
    "bool": bool,
    "len": len,
    "round": round,
    "abs": abs,
    "min": min,
    "max": max,
    "sum": sum,
    "pow": pow,
    "range": range,
    "enumerate": enumerate,
    "zip": zip,
    "sorted": sorted,
    "list": list,
    "dict": dict,
    "tuple": tuple,
    "set": set,
    "isinstance": isinstance,
    "format": format,
    "all": all,
    "any": any,
}


def _format_display_value(value: Any) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        f = float(value)
        if f == 0:
            return "0"
        af = abs(f)
        if af >= 1_000_000:
            return f"{f:,.0f}"
        if af >= 10_000:
            return f"{f:,.2f}".rstrip("0").rstrip(".")
        if af >= 1:
            rounded = round(f, 2)
            return str(int(rounded)) if rounded == int(rounded) else str(rounded)
        if af >= 0.01:
            return str(round(f, 4))
        return format(f, ".4g")
    return str(value)


def _write_args_to_string(args: tuple, kwargs: dict) -> str:
    parts: List[str] = []
    for arg in args:
        if arg is None:
            continue
        if isinstance(arg, pd.DataFrame):
            parts.append(arg.to_string(index=False))
        elif isinstance(arg, pd.Series):
            parts.append(arg.to_string())
        elif isinstance(arg, dict):
            parts.append(json.dumps(arg, default=str, indent=2))
        else:
            parts.append(_format_display_value(arg))
    if "body" in kwargs:
        parts.append(_format_display_value(kwargs["body"]))
    return "\n".join(parts)


def _dict_to_table_rows(data: Dict[Any, Any]) -> List[List[str]]:
    return [[str(key), _format_display_value(val)] for key, val in data.items()]


def _dataframe_to_grid_block(data: pd.DataFrame) -> Dict[str, Any]:
    limited = data.head(MAX_DATAFRAME_ROWS)
    if len(limited.columns) > MAX_DATAFRAME_COLS:
        limited = limited.iloc[:, :MAX_DATAFRAME_COLS]
    columns = [str(c) for c in limited.columns]
    rows: List[List[str]] = []
    for row_tuple in limited.itertuples(index=False):
        rows.append([_format_display_value(v) for v in row_tuple])
    return {"type": "dataframe", "columns": columns, "rows": rows}


class _RecorderProxy:
    """Forwards any st.* call from a column or container to the root recorder."""

    def __init__(self, recorder: "StreamlitCardRecorder") -> None:
        self._recorder = recorder

    def __getattr__(self, name: str) -> Any:
        return getattr(self._recorder, name)


class _RecorderContainer(_RecorderProxy):
    def __enter__(self) -> "_RecorderContainer":
        return self

    def __exit__(self, *args: Any) -> None:
        return None


class StreamlitCardRecorder:
    """Records st.* calls as renderable card blocks."""

    def __init__(self) -> None:
        self.blocks: List[Dict[str, Any]] = []

    def _append_text(self, content: str, style: str = "text") -> None:
        if content.strip() != "":
            self.blocks.append({"type": style, "content": content})

    def _append_alert(self, variant: str, body: Any) -> None:
        content = _format_display_value(body) if not isinstance(body, str) else body
        if str(content).strip() != "":
            self.blocks.append({"type": "alert", "variant": variant, "content": str(content)})

    def _delta_tone(self, delta_str: str, delta_color: str) -> Optional[str]:
        """Map Streamlit delta_color + delta text to up | down | neutral for CSS."""
        if delta_color == "off":
            return None
        stripped = delta_str.strip()
        if stripped == "":
            return None
        inferred: Optional[str] = None
        if stripped[0] in "+▲↑":
            inferred = "up"
        elif stripped[0] in "-▼↓":
            inferred = "down"
        if inferred is None:
            return "neutral"
        if delta_color == "inverse":
            return "down" if inferred == "up" else "up" if inferred == "down" else "neutral"
        return inferred

    def metric(
        self,
        label: str,
        value: Any,
        delta: Any = None,
        delta_color: str = "normal",
        help: Optional[str] = None,
    ) -> None:
        block: Dict[str, Any] = {
            "type": "metric",
            "label": str(label),
            "value": _format_display_value(value),
        }
        if delta is not None:
            delta_str = _format_display_value(delta)
            if delta_str != "":
                block["delta"] = delta_str
                tone = self._delta_tone(delta_str, delta_color)
                if tone is not None:
                    block["delta_tone"] = tone
        self.blocks.append(block)

    def write(self, *args: Any, **kwargs: Any) -> None:
        for arg in args:
            if isinstance(arg, pd.DataFrame):
                self.dataframe(arg)
                continue
            if isinstance(arg, dict) and not kwargs:
                self.table(arg)
                continue
        content = _write_args_to_string(args, kwargs)
        self._append_text(content)

    def markdown(self, body: str, unsafe_allow_html: bool = False) -> None:
        self._append_text(str(body))

    def header(self, body: str, anchor: Optional[str] = None) -> None:
        self.blocks.append({"type": "header", "content": str(body)})

    def subheader(self, body: str, anchor: Optional[str] = None) -> None:
        self.blocks.append({"type": "header", "content": str(body)})

    def title(self, body: str, anchor: Optional[str] = None) -> None:
        self.blocks.append({"type": "header", "content": str(body)})

    def text(self, body: str) -> None:
        self._append_text(str(body))

    def caption(self, body: str, help: Optional[str] = None) -> None:
        self.blocks.append({"type": "caption", "content": str(body)})

    def code(self, body: str, language: str = "python") -> None:
        self.blocks.append({"type": "code", "content": str(body)})

    def latex(self, body: str) -> None:
        self.blocks.append({"type": "code", "content": str(body)})

    def divider(self) -> None:
        self.blocks.append({"type": "divider"})

    def info(self, body: Any, icon: Optional[str] = None) -> None:
        self._append_alert("info", body)

    def success(self, body: Any, icon: Optional[str] = None) -> None:
        self._append_alert("success", body)

    def warning(self, body: Any, icon: Optional[str] = None) -> None:
        self._append_alert("warning", body)

    def error(self, body: Any, icon: Optional[str] = None) -> None:
        self._append_alert("error", body)

    def exception(self, exception: BaseException) -> None:
        self._append_alert("error", str(exception))

    def json(self, body: Any) -> None:
        self.code(json.dumps(body, default=str, indent=2))

    def table(self, data: Union[Dict[Any, Any], pd.DataFrame]) -> None:
        if isinstance(data, pd.DataFrame):
            if len(data.columns) <= 2 and len(data) <= 20:
                rows: List[List[str]] = []
                for _, series in data.iterrows():
                    if len(data.columns) == 2:
                        rows.append([
                            _format_display_value(series.iloc[0]),
                            _format_display_value(series.iloc[1]),
                        ])
                    else:
                        for col in data.columns:
                            rows.append([str(col), _format_display_value(series[col])])
                if len(rows) > 0:
                    self.blocks.append({"type": "table", "rows": rows})
            else:
                self.dataframe(data)
            return
        if isinstance(data, dict):
            rows = _dict_to_table_rows(data)
            if len(rows) > 0:
                self.blocks.append({"type": "table", "rows": rows})

    def dataframe(
        self,
        data: Union[pd.DataFrame, pd.Series, Dict[Any, Any]],
        width: Any = None,
        height: Any = None,
        use_container_width: bool = True,
    ) -> None:
        if isinstance(data, pd.Series):
            data = data.to_frame().T
        elif isinstance(data, dict):
            data = pd.DataFrame([data])
        if isinstance(data, pd.DataFrame) and len(data) > 0:
            self.blocks.append(_dataframe_to_grid_block(data))

    def columns(self, spec: Union[int, List[float]]) -> List[_RecorderProxy]:
        width = spec if isinstance(spec, int) else len(spec)
        return [_RecorderProxy(self) for _ in range(width)]

    def container(self, border: bool = False) -> _RecorderContainer:
        return _RecorderContainer(self)

    def empty(self) -> _RecorderContainer:
        return _RecorderContainer(self)

    def space(self, size: Any = None) -> None:
        pass

    def __getattr__(self, name: str) -> Any:
        def _fallback(*args: Any, **kwargs: Any) -> None:
            self.write(*args, **kwargs)
        return _fallback


def execute_streamlit_card(
    code: str, df: pd.DataFrame, row_index: int
) -> List[Dict[str, Any]]:
    row = df.iloc[row_index]
    recorder = StreamlitCardRecorder()

    namespace: Dict[str, Any] = {
        "__builtins__": _SAFE_BUILTINS,
        "st": recorder,
        "row": row,
        "df": df,
        "row_index": row_index,
        "pd": pd,
    }
    if np is not None:
        namespace["np"] = np

    exec(code, namespace)
    return recorder.blocks


def render_card(code: str, df: pd.DataFrame, row_index: int) -> List[Dict[str, Any]]:
    if row_index < 0 or row_index >= len(df) or code.strip() == "":
        return []
    try:
        return execute_streamlit_card(code.strip(), df, row_index)
    except Exception as exc:
        return [{"type": "alert", "variant": "error", "content": f"Card script error: {exc}"}]
