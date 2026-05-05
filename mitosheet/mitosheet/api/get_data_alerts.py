#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
LLM-backed data quality alerts for the AI Alerts sidebar.
"""

import json
import os
from typing import Any, Dict, List, Optional

import pandas as pd
from pandas.api import types as ptypes

from mitosheet.api.suggestions_api_utils import (
    get_suggestions_from_mito_server,
    get_suggestions_from_open_ai_compatible,
    get_suggestions_from_openai_key,
    salvage_truncated_json,
    strip_json_fences,
)
from mitosheet.types import StepsManagerType

DATA_ALERTS_PROMPT_VERSION = "data-alerts-v2"
MAX_COLUMNS_PROFILED = 60
MAX_SAMPLE_ROWS = 2000
MAX_ALERTS = 8
MAX_FIXES_PER_ALERT = 3
ALLOWED_SEVERITIES = frozenset({"high", "medium", "low"})


def _safe_float(value: Any) -> Optional[float]:
    try:
        if pd.isna(value):
            return None
        return float(value)
    except Exception:
        return None


def _truncate_value(value: Any, max_len: int = 60) -> str:
    text = str(value)
    return text if len(text) <= max_len else text[: max_len - 3] + "..."


def _build_profile(df: pd.DataFrame) -> Dict[str, Any]:
    total_rows = len(df.index)
    n = min(MAX_SAMPLE_ROWS, total_rows)
    sampled = df.sample(n=n) if n > 0 else df.iloc[0:0]

    column_summaries: List[Dict[str, Any]] = []
    for col_idx, col_name in enumerate(df.columns[:MAX_COLUMNS_PROFILED]):
        series = sampled[col_name]
        non_null = series.dropna()
        sample_size = len(series.index)
        non_null_size = len(non_null.index)

        summary: Dict[str, Any] = {
            "column_index": col_idx,
            "column_name": str(col_name),
            "dtype": str(df[col_name].dtype),
            "sample_null_pct": round(
                ((sample_size - non_null_size) / sample_size) if sample_size > 0 else 0.0, 4
            ),
            "sample_unique_ratio": round(
                (non_null.nunique(dropna=True) / non_null_size) if non_null_size > 0 else 0.0, 4
            ),
        }

        try:
            top_values = non_null.value_counts(dropna=True).head(3)
            summary["top_values"] = [
                {"value": _truncate_value(idx), "count": int(count)}
                for idx, count in top_values.items()
            ]
        except Exception:
            summary["top_values"] = []

        if ptypes.is_numeric_dtype(series.dtype):
            numeric = pd.to_numeric(non_null, errors="coerce").dropna()
            if len(numeric.index) > 0:
                desc = numeric.describe(percentiles=[0.25, 0.5, 0.75])
                summary["numeric_stats"] = {
                    "min": _safe_float(desc.get("min")),
                    "p25": _safe_float(desc.get("25%")),
                    "median": _safe_float(desc.get("50%")),
                    "p75": _safe_float(desc.get("75%")),
                    "max": _safe_float(desc.get("max")),
                    "mean": _safe_float(desc.get("mean")),
                    "std": _safe_float(desc.get("std")),
                }

        if ptypes.is_datetime64_any_dtype(series.dtype):
            datetimes = pd.to_datetime(non_null, errors="coerce").dropna()
            if len(datetimes.index) > 0:
                summary["datetime_range"] = {
                    "min": datetimes.min().isoformat(),
                    "max": datetimes.max().isoformat(),
                }

        if ptypes.is_object_dtype(series.dtype):
            try:
                lengths = non_null.astype(str).str.len()
                if len(lengths.index) > 0:
                    summary["string_length"] = {
                        "median": int(lengths.median()),
                        "max": int(lengths.max()),
                    }
            except Exception:
                pass

        column_summaries.append(summary)

    return {
        "total_rows": total_rows,
        "sample_rows_profiled": len(sampled.index),
        "total_columns": len(df.columns),
        "columns_profiled": len(column_summaries),
        "column_summaries": column_summaries,
    }


def _build_data_alerts_prompt(df_name: str, profile: Dict[str, Any]) -> str:
    column_catalog = "\n".join(
        [
            f"  {col['column_index']}: {repr(col['column_name'])} ({col['dtype']})"
            for col in profile["column_summaries"]
        ]
    )

    example_json = f"""{{
  "alerts": [
    {{
      "issue_type": "missing_values",
      "severity": "high",
      "title": "Missing values in important field",
      "description": "Column has a high share of missing values that may bias analysis.",
      "column_indices": [2],
      "fixes": [
        {{
          "title": "Drop rows where Age is missing",
          "description": "Removes any row that has a missing Age value.",
          "code": "{df_name} = {df_name}.dropna(subset=['Age'])"
        }},
        {{
          "title": "Fill missing Age with median",
          "description": "Replaces missing Age values with the column median.",
          "code": "{df_name}['Age'] = {df_name}['Age'].fillna({df_name}['Age'].median())"
        }}
      ]
    }}
  ]
}}"""

    return f"""You are a data quality analyst assistant.
Identify the most important data-cleaning issues an analyst should investigate first, and for each issue propose concrete pandas code that fixes it.

Dataframe variable name: {df_name}
Rows in dataframe: {profile['total_rows']}
Sample rows profiled: {profile['sample_rows_profiled']}
Columns profiled: {profile['columns_profiled']} of {profile['total_columns']}

Column index catalog (use ONLY these indices):
{column_catalog}

Per-column profile JSON:
{json.dumps(profile['column_summaries'])}

Respond with ONLY valid JSON (no markdown, no code fences) with this exact shape:
{example_json}

Rules:
- Return at most {MAX_ALERTS} alerts.
- severity must be one of: high, medium, low.
- issue_type should be short snake_case (examples: missing_values, inconsistent_format, outliers, potential_duplicates, constant_column, suspicious_distribution).
- title should be concise and specific to this dataset.
- description should explain why this matters for analysis in 1-2 sentences.
- column_indices must reference valid column indices from the catalog.
- Prefer high-signal issues that an analyst would reasonably inspect during cleaning.
- For each alert, include 1 to {MAX_FIXES_PER_ALERT} entries in 'fixes' that the user can apply with one click.
- Each fix MUST have: 'title' (short button label, max 8 words), 'description' (1 sentence), and 'code'.
- 'code' MUST be a single short pandas snippet (one or two statements) that uses ONLY the dataframe variable named '{df_name}' and modifies it in place (e.g. assigning back to {df_name} or to {df_name}['col']).
- 'code' MUST reference column names exactly as they appear in the column index catalog above.
- 'code' MUST NOT include imports, prints, comments, or read/write to disk.
- Prefer fixes that are safe and reversible. Order fixes from least to most destructive.
- If nothing stands out, return {{"alerts":[]}}."""


def _parse_alerts_json(completion: str) -> Any:
    text = strip_json_fences(completion)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        salvaged = salvage_truncated_json(text)
        if salvaged is None:
            raise
        # Validation drops any alert missing required fields, so a partially
        # recovered response surfaces the alerts that did make it through.
        return json.loads(salvaged)


def _validate_fixes(raw: Any, df_name: str) -> List[Dict[str, Any]]:
    if not isinstance(raw, list):
        return []

    fixes: List[Dict[str, Any]] = []
    for item in raw[:MAX_FIXES_PER_ALERT]:
        if not isinstance(item, dict):
            continue

        title = item.get("title")
        description = item.get("description")
        code = item.get("code")

        if not isinstance(title, str) or not title.strip():
            continue
        if not isinstance(description, str) or not description.strip():
            continue
        if not isinstance(code, str) or not code.strip():
            continue

        # Sanity check: the code should reference the dataframe variable so that the
        # ai_transformation step can detect it as a modified dataframe.
        if df_name not in code:
            continue

        fixes.append(
            {
                "fix_id": f"fix_{len(fixes)}",
                "title": title.strip()[:120],
                "description": description.strip()[:300],
                "code": code.strip(),
            }
        )

    return fixes


def _validate_alerts(raw: Any, max_columns: int, df_name: str) -> List[Dict[str, Any]]:
    if not isinstance(raw, dict):
        return []
    items = raw.get("alerts")
    if not isinstance(items, list):
        return []

    alerts: List[Dict[str, Any]] = []
    for item in items[:MAX_ALERTS]:
        if not isinstance(item, dict):
            continue

        issue_type = item.get("issue_type")
        severity = item.get("severity")
        title = item.get("title")
        description = item.get("description")
        column_indices = item.get("column_indices")

        if not isinstance(issue_type, str) or not issue_type.strip():
            continue
        if not isinstance(severity, str) or severity not in ALLOWED_SEVERITIES:
            continue
        if not isinstance(title, str) or not title.strip():
            continue
        if not isinstance(description, str) or not description.strip():
            continue
        if not isinstance(column_indices, list) or len(column_indices) == 0:
            continue

        normalized_indices: List[int] = []
        valid = True
        for idx in column_indices:
            if isinstance(idx, bool):
                valid = False
                break
            if isinstance(idx, float) and idx == int(idx):
                idx = int(idx)
            if not isinstance(idx, int) or idx < 0 or idx >= max_columns:
                valid = False
                break
            normalized_indices.append(idx)

        if not valid:
            continue

        alerts.append(
            {
                "issue_type": issue_type.strip()[:80],
                "severity": severity,
                "title": title.strip()[:200],
                "description": description.strip()[:700],
                "column_indices": normalized_indices,
                "fixes": _validate_fixes(item.get("fixes"), df_name),
            }
        )

    return alerts


def get_data_alerts(params: Dict[str, Any], steps_manager: StepsManagerType) -> Dict[str, Any]:
    sheet_index = params.get("sheet_index")
    if not isinstance(sheet_index, int):
        return {"error": "Invalid sheet_index"}

    state = steps_manager.curr_step.final_defined_state
    if sheet_index < 0 or sheet_index >= len(state.dfs):
        return {"error": "Invalid sheet index"}

    df = state.dfs[sheet_index]
    if df is None or len(df.columns) == 0:
        return {"prompt_version": DATA_ALERTS_PROMPT_VERSION, "alerts": []}

    profile = _build_profile(df)
    df_name = str(state.df_names[sheet_index]) if sheet_index < len(state.df_names) else "df"
    prompt = _build_data_alerts_prompt(df_name, profile)

    byo_url = steps_manager.mito_config.llm_url
    openai_api_key = os.environ.get("OPENAI_API_KEY")

    if byo_url is not None:
        llm_result = get_suggestions_from_open_ai_compatible(byo_url, prompt)
    elif openai_api_key is None:
        llm_result = get_suggestions_from_mito_server("data_alerts", prompt)
    else:
        llm_result = get_suggestions_from_openai_key(prompt)

    if "error" in llm_result:
        return {"error": llm_result["error"]}

    completion = llm_result.get("completion")
    if not isinstance(completion, str):
        return {"error": "Invalid response from language model."}

    try:
        parsed = _parse_alerts_json(completion)
    except (json.JSONDecodeError, ValueError):
        return {
            "error": "Could not parse AI alerts. The model did not return valid JSON.",
            "prompt_version": DATA_ALERTS_PROMPT_VERSION,
        }

    alerts = _validate_alerts(parsed, profile["columns_profiled"], df_name)
    return {
        "prompt_version": DATA_ALERTS_PROMPT_VERSION,
        "alerts": alerts,
        "df_name": df_name,
        "profile_metadata": {
            "rows_profiled": profile["sample_rows_profiled"],
            "total_rows": profile["total_rows"],
            "columns_profiled": profile["columns_profiled"],
            "total_columns": profile["total_columns"],
        },
    }
