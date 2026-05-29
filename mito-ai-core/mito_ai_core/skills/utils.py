# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
from typing import Final, List, Optional

from mito_ai_core.agent.types import ToolResult
from mito_ai_core.utils.schema import MITO_FOLDER

BUNDLED_SKILLS_DIR: Final[str] = os.path.join(os.path.dirname(__file__), "bundled")
USER_SKILLS_DIR: Final[str] = os.path.join(MITO_FOLDER, "skills")


def _sanitize_skill_name(skill_name: str) -> str:
    if not skill_name:
        raise ValueError("Skill name cannot be empty")

    if skill_name.endswith(".md"):
        skill_name = skill_name[:-3]

    if ".." in skill_name or "/" in skill_name or "\\" in skill_name:
        raise ValueError(f"Skill name contains invalid characters: {skill_name}")

    if os.path.isabs(skill_name):
        raise ValueError(f"Skill name cannot be an absolute path: {skill_name}")

    if "\x00" in skill_name:
        raise ValueError("Skill name cannot contain null bytes")

    invalid_chars = set("<>:|?*\"")
    if any(c in skill_name for c in invalid_chars):
        raise ValueError(f"Skill name contains invalid filename characters: {skill_name}")

    return skill_name


def _validate_skill_path(file_path: str, skill_name: str) -> None:
    resolved_path = os.path.abspath(file_path)
    bundled_dir_abs = os.path.abspath(BUNDLED_SKILLS_DIR)
    user_dir_abs = os.path.abspath(USER_SKILLS_DIR)
    if not (
        resolved_path.startswith(bundled_dir_abs)
        or resolved_path.startswith(user_dir_abs)
    ):
        raise ValueError(f"Invalid skill name: {skill_name}")


def _list_skills_in_dir(directory: str) -> List[str]:
    if not os.path.exists(directory):
        return []
    try:
        return [
            f[:-3]
            for f in os.listdir(directory)
            if f.endswith(".md") and not f.startswith(".")
        ]
    except OSError:
        return []


def list_available_skills() -> List[str]:
    """Return sorted skill names from bundled and user skill directories."""
    names = set(_list_skills_in_dir(BUNDLED_SKILLS_DIR))
    names.update(_list_skills_in_dir(USER_SKILLS_DIR))
    return sorted(names)


def get_skill(skill_name: str) -> Optional[str]:
    """Load a skill by name. User skills override bundled skills."""
    skill_name = _sanitize_skill_name(skill_name)

    user_path = os.path.join(USER_SKILLS_DIR, f"{skill_name}.md")
    _validate_skill_path(user_path, skill_name)
    if os.path.exists(user_path):
        with open(user_path, "r") as f:
            return f.read()

    bundled_path = os.path.join(BUNDLED_SKILLS_DIR, f"{skill_name}.md")
    _validate_skill_path(bundled_path, skill_name)
    if os.path.exists(bundled_path):
        with open(bundled_path, "r") as f:
            return f.read()

    return None


def read_skill(skill_name: str) -> ToolResult:
    """Load a skill document and return it as a tool result."""
    try:
        sanitized_name = _sanitize_skill_name(skill_name)
    except ValueError as e:
        return ToolResult(
            success=False,
            tool_name="read_skill",
            error_message=str(e),
        )

    content = get_skill(sanitized_name)
    if content is None:
        available = list_available_skills()
        available_text = ", ".join(available) if available else "(none)"
        return ToolResult(
            success=False,
            tool_name="read_skill",
            error_message=(
                f"Skill '{sanitized_name}' not found. "
                f"Available skills: {available_text}"
            ),
        )

    return ToolResult(
        success=True,
        tool_name="read_skill",
        output=f"Skill: {sanitized_name}\n\n{content}",
    )
