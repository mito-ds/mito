# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import importlib.util
import os
from types import ModuleType
from typing import Final, List, Optional

from mito_ai_core.agent.types import ToolResult
from mito_ai_core.utils.schema import MITO_FOLDER

SKILLS_DIR: Final[str] = os.path.dirname(__file__)
USER_SKILLS_DIR: Final[str] = os.path.join(MITO_FOLDER, "skills")
SKILL_CONTENT_ATTR: Final[str] = "CONTENT"
_EXCLUDED_SKILL_MODULES: Final[frozenset[str]] = frozenset({"utils", "__init__"})


def _sanitize_skill_name(skill_name: str) -> str:
    if not skill_name:
        raise ValueError("Skill name cannot be empty")

    if skill_name.endswith(".py"):
        skill_name = skill_name[:-3]
    elif skill_name.endswith(".md"):
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
    skills_dir_abs = os.path.abspath(SKILLS_DIR)
    user_dir_abs = os.path.abspath(USER_SKILLS_DIR)
    if not (
        resolved_path.startswith(skills_dir_abs)
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
            if f.endswith(".py")
            and not f.startswith(".")
            and f[:-3] not in _EXCLUDED_SKILL_MODULES
        ]
    except OSError:
        return []


def _load_content_from_module(module: ModuleType) -> Optional[str]:
    content = getattr(module, SKILL_CONTENT_ATTR, None)
    if content is None or not isinstance(content, str):
        return None
    return content


def _load_skill_from_path(path: str) -> Optional[str]:
    if not os.path.exists(path):
        return None

    module_name = f"mito_skill_{os.path.basename(path)[:-3]}"
    spec = importlib.util.spec_from_file_location(module_name, path)
    if spec is None or spec.loader is None:
        return None

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return _load_content_from_module(module)


def list_available_skills() -> List[str]:
    """Return sorted skill names from package and user skill directories."""
    names = set(_list_skills_in_dir(SKILLS_DIR))
    names.update(_list_skills_in_dir(USER_SKILLS_DIR))
    return sorted(names)


def get_skill(skill_name: str) -> Optional[str]:
    """Load a skill by name. User skills override package skills."""
    skill_name = _sanitize_skill_name(skill_name)

    user_path = os.path.join(USER_SKILLS_DIR, f"{skill_name}.py")
    _validate_skill_path(user_path, skill_name)
    user_content = _load_skill_from_path(user_path)
    if user_content is not None:
        return user_content

    skill_path = os.path.join(SKILLS_DIR, f"{skill_name}.py")
    _validate_skill_path(skill_path, skill_name)
    return _load_skill_from_path(skill_path)


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
