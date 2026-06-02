#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Minimal Streamlit API recorder for card scripts.

Card code is written like a Streamlit app (st.metric, st.write, etc.) and executed
with `row` (a pandas Series for the selected row) in scope. Calls are recorded and
rendered in the mitosheet UI.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

import pandas as pd


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
        parts.append(_format_display_value(arg))
    if "body" in kwargs:
        parts.append(_format_display_value(kwargs["body"]))
    return "\n".join(parts)


class _RecorderColumn:
    """One column from st.columns(); mirrors the Streamlit column API."""

    def __init__(self, recorder: "StreamlitCardRecorder") -> None:
        self._recorder = recorder

    def metric(
        self,
        label: str,
        value: Any,
        delta: Any = None,
        delta_color: str = "normal",
        help: Optional[str] = None,
    ) -> None:
        self._recorder.metric(label, value, delta=delta, delta_color=delta_color, help=help)

    def write(self, *args: Any, **kwargs: Any) -> None:
        self._recorder.write(*args, **kwargs)

    def markdown(self, body: str, unsafe_allow_html: bool = False) -> None:
        self._recorder.markdown(body, unsafe_allow_html=unsafe_allow_html)

    def caption(self, body: str, help: Optional[str] = None) -> None:
        self._recorder.caption(body, help=help)


class StreamlitCardRecorder:
    """Records st.* calls as renderable card blocks."""

    def __init__(self) -> None:
        self.blocks: List[Dict[str, Any]] = []

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
        if delta is not None and _format_display_value(delta) != "":
            block["delta"] = _format_display_value(delta)
        self.blocks.append(block)

    def write(self, *args: Any, **kwargs: Any) -> None:
        content = _write_args_to_string(args, kwargs)
        if content.strip() != "":
            self.blocks.append({"type": "text", "content": content})

    def markdown(self, body: str, unsafe_allow_html: bool = False) -> None:
        self.blocks.append({"type": "text", "content": str(body)})

    def header(self, body: str, anchor: Optional[str] = None) -> None:
        self.blocks.append({"type": "header", "content": str(body)})

    def subheader(self, body: str, anchor: Optional[str] = None) -> None:
        self.blocks.append({"type": "header", "content": str(body)})

    def title(self, body: str, anchor: Optional[str] = None) -> None:
        self.blocks.append({"type": "header", "content": str(body)})

    def caption(self, body: str, help: Optional[str] = None) -> None:
        self.blocks.append({"type": "text", "content": str(body)})

    def divider(self) -> None:
        self.blocks.append({"type": "divider"})

    def table(self, data: Union[Dict[Any, Any], pd.DataFrame]) -> None:
        rows: List[List[str]] = []
        if isinstance(data, pd.DataFrame):
            if len(data) == 1:
                for col in data.columns:
                    rows.append([str(col), _format_display_value(data.iloc[0][col])])
            else:
                for _, series in data.iterrows():
                    for col in data.columns:
                        rows.append([str(col), _format_display_value(series[col])])
        elif isinstance(data, dict):
            for key, val in data.items():
                rows.append([str(key), _format_display_value(val)])
        if len(rows) > 0:
            self.blocks.append({"type": "table", "rows": rows})

    def columns(self, spec: Union[int, List[float]]) -> List[_RecorderColumn]:
        width = spec if isinstance(spec, int) else len(spec)
        return [_RecorderColumn(self) for _ in range(width)]


def execute_streamlit_card(code: str, row: pd.Series) -> List[Dict[str, Any]]:
    recorder = StreamlitCardRecorder()
    safe_builtins = {
        "str": str,
        "int": int,
        "float": float,
        "len": len,
        "round": round,
        "abs": abs,
        "min": min,
        "max": max,
        "sum": sum,
    }
    exec(
        code,
        {
            "__builtins__": safe_builtins,
            "st": recorder,
            "row": row,
            "pd": pd,
        },
    )
    return recorder.blocks


def render_card(code: str, df: pd.DataFrame, row_index: int) -> List[Dict[str, Any]]:
    if row_index < 0 or row_index >= len(df) or code.strip() == "":
        return []
    try:
        return execute_streamlit_card(code.strip(), df.iloc[row_index])
    except Exception:
        return [{"type": "text", "content": "Card script error."}]
