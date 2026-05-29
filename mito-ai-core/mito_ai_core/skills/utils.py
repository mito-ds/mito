# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Dict, Optional

from mito_ai_core.agent.types import ToolResult
from mito_ai_core.skills.database_rules import DatabaseRulesSkill
from mito_ai_core.skills.excel_to_python import ExcelToPythonSkill
from mito_ai_core.skills.types import Skill

SKILLS: Dict[str, Skill] = {
    ExcelToPythonSkill.name: ExcelToPythonSkill(),
    DatabaseRulesSkill.name: DatabaseRulesSkill(),
}


def get_available_skills() -> Dict[str, Skill]:
    return {
        name: skill for name, skill in SKILLS.items() if skill.is_available
    }


def get_skill(skill_name: str) -> Optional[str]:
    """Return skill content by name, or None if not registered or unavailable."""
    skill = get_available_skills().get(skill_name)
    if skill is None:
        return None
    return skill.get_content()


def read_skill(skill_name: str) -> ToolResult:
    """Load a skill and return it as a tool result."""
    if not skill_name or not skill_name.strip():
        return ToolResult(
            success=False,
            tool_name="read_skill",
            error_message="Skill name cannot be empty.",
        )

    sanitized_name = skill_name.strip()
    skill = get_available_skills().get(sanitized_name)
    if skill is None:
        available = sorted(get_available_skills().keys())
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
        output=f"Skill: {sanitized_name}\n\n{skill.get_content()}",
    )
