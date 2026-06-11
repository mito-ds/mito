# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from datetime import datetime, timezone
from typing import Any, Dict, Final, List, Optional, Union
import json
import os
import uuid

from mito_ai_core.agent.types import ToolResult
from mito_ai_core.utils.schema import MITO_FOLDER

VERIFIED_REPORTS_DIR_PATH: Final[str] = os.path.join(MITO_FOLDER, "verified_reports")


def _sanitize_report_name(report_name: str) -> str:
    if not report_name:
        raise ValueError("Report name cannot be empty")

    if report_name.endswith(".json"):
        report_name = report_name[:-5]

    if ".." in report_name or "/" in report_name or "\\" in report_name:
        raise ValueError(f"Report name contains invalid characters: {report_name}")

    if os.path.isabs(report_name):
        raise ValueError(f"Report name cannot be an absolute path: {report_name}")

    if "\x00" in report_name:
        raise ValueError("Report name cannot contain null bytes")

    invalid_chars = set("<>:|?*\"")
    if any(c in report_name for c in invalid_chars):
        raise ValueError(f"Report name contains invalid filename characters: {report_name}")

    return report_name


def _validate_report_path(file_path: str, report_name: str) -> None:
    resolved_path = os.path.abspath(file_path)
    reports_dir_abs = os.path.abspath(VERIFIED_REPORTS_DIR_PATH)
    if not resolved_path.startswith(reports_dir_abs):
        raise ValueError(f"Invalid report name: {report_name}")


def _get_report_path(report_name: str) -> str:
    report_name = _sanitize_report_name(report_name)
    file_path = os.path.join(VERIFIED_REPORTS_DIR_PATH, f"{report_name}.json")
    _validate_report_path(file_path, report_name)
    return file_path


def _ensure_reports_dir() -> None:
    if not os.path.exists(VERIFIED_REPORTS_DIR_PATH):
        os.makedirs(VERIFIED_REPORTS_DIR_PATH)


def _load_report(report_name: str) -> Optional[Dict[str, Any]]:
    file_path = _get_report_path(report_name)
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r") as f:
        return json.load(f)


def _save_report(report: Dict[str, Any]) -> None:
    _ensure_reports_dir()
    name = _sanitize_report_name(report["name"])
    file_path = _get_report_path(name)
    with open(file_path, "w") as f:
        json.dump(report, f, indent=2)


def get_all_verified_reports() -> List[Dict[str, Any]]:
    _ensure_reports_dir()
    reports: List[Dict[str, Any]] = []
    try:
        for filename in os.listdir(VERIFIED_REPORTS_DIR_PATH):
            if not filename.endswith(".json"):
                continue
            report_name = filename[:-5]
            report = _load_report(report_name)
            if report is None:
                continue
            snippets = report.get("snippets", [])
            reports.append({
                "name": report.get("name", report_name),
                "description": report.get("description", ""),
                "snippet_count": len(snippets),
            })
    except OSError as e:
        print(f"Error reading verified reports directory: {e}")
    return sorted(reports, key=lambda r: r["name"])


def get_verified_report(report_name: str) -> Optional[Dict[str, Any]]:
    return _load_report(report_name)


def create_or_update_report(report_name: str, description: str) -> Dict[str, Any]:
    report_name = _sanitize_report_name(report_name)
    existing = _load_report(report_name)
    if existing is None:
        report = {
            "name": report_name,
            "description": description,
            "snippets": [],
        }
    else:
        report = existing
        report["description"] = description
    _save_report(report)
    return report


def delete_verified_report(report_name: str) -> None:
    file_path = _get_report_path(report_name)
    if os.path.exists(file_path):
        os.remove(file_path)


def get_snippet(report_name: str, snippet_id: str) -> Optional[Dict[str, Any]]:
    report = _load_report(report_name)
    if report is None:
        return None
    for snippet in report.get("snippets", []):
        if snippet.get("id") == snippet_id:
            return snippet
    return None


def add_snippet(
    report_name: str,
    code: str,
    comment: str,
    ai_context: str,
    *,
    description: Optional[str] = None,
) -> Dict[str, Any]:
    report_name = _sanitize_report_name(report_name)
    report = _load_report(report_name)
    if report is None:
        report = {
            "name": report_name,
            "description": description or "",
            "snippets": [],
        }
    elif description is not None:
        report["description"] = description

    snippet = {
        "id": str(uuid.uuid4()),
        "code": code,
        "comment": comment,
        "ai_context": ai_context,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    report.setdefault("snippets", []).append(snippet)
    _save_report(report)
    return snippet


def update_snippet(
    report_name: str,
    snippet_id: str,
    *,
    comment: Optional[str] = None,
    ai_context: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    report = _load_report(report_name)
    if report is None:
        return None
    for snippet in report.get("snippets", []):
        if snippet.get("id") == snippet_id:
            if comment is not None:
                snippet["comment"] = comment
            if ai_context is not None:
                snippet["ai_context"] = ai_context
            _save_report(report)
            return snippet
    return None


def delete_snippet(report_name: str, snippet_id: str) -> bool:
    report = _load_report(report_name)
    if report is None:
        return False
    snippets = report.get("snippets", [])
    new_snippets = [s for s in snippets if s.get("id") != snippet_id]
    if len(new_snippets) == len(snippets):
        return False
    report["snippets"] = new_snippets
    _save_report(report)
    return True


def format_report_content(report: Dict[str, Any]) -> str:
    lines = [f"Report: {report.get('name', '')}", "", f"Description: {report.get('description', '')}", ""]
    snippets = report.get("snippets", [])
    if not snippets:
        lines.append("No snippets in this report.")
        return "\n".join(lines)

    for i, snippet in enumerate(snippets, start=1):
        lines.append(f"--- Snippet {i} (id: {snippet.get('id', '')}) ---")
        if snippet.get("comment"):
            lines.append(f"User comment: {snippet['comment']}")
        if snippet.get("ai_context"):
            lines.append(f"Context: {snippet['ai_context']}")
        lines.append("Code:")
        lines.append(snippet.get("code", ""))
        lines.append("")
    return "\n".join(lines)


def read_verified_report(report_name: str) -> ToolResult:
    if not report_name or not report_name.strip():
        return ToolResult(
            success=False,
            tool_name="read_verified_report",
            error_message="Verified report name cannot be empty.",
        )

    sanitized_name = report_name.strip()
    report = get_verified_report(sanitized_name)
    if report is None:
        available = [r["name"] for r in get_all_verified_reports()]
        available_text = ", ".join(available) if available else "(none)"
        return ToolResult(
            success=False,
            tool_name="read_verified_report",
            error_message=(
                f"Verified report '{sanitized_name}' not found. "
                f"Available reports: {available_text}"
            ),
        )

    return ToolResult(
        success=True,
        tool_name="read_verified_report",
        output=format_report_content(report),
    )
