# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest

from mito_ai_core.skills.types import Skill
from mito_ai_core.skills.utils import SKILLS, get_skill, list_available_skills, read_skill


class TestSkillRegistry:
    def test_excel_to_python_is_registered(self) -> None:
        assert "excel_to_python" in SKILLS
        assert SKILLS["excel_to_python"].description

    def test_list_available_skills(self) -> None:
        assert list_available_skills() == sorted(SKILLS.keys())


class TestGetSkill:
    def test_returns_content_for_registered_skill(self) -> None:
        content = get_skill("excel_to_python")
        assert content is not None
        assert "Configuration cell" in content

    def test_returns_none_for_missing_skill(self) -> None:
        assert get_skill("missing") is None


class TestReadSkill:
    def test_returns_skill_content(self) -> None:
        result = read_skill("excel_to_python")
        assert result.success
        assert result.tool_name == "read_skill"
        assert "mito_check_" in (result.output or "")

    def test_returns_error_for_missing_skill(self) -> None:
        result = read_skill("does_not_exist")
        assert not result.success
        assert "does_not_exist" in (result.error_message or "")
        assert "Available skills" in (result.error_message or "")

    def test_returns_error_for_empty_name(self) -> None:
        result = read_skill("")
        assert not result.success
        assert result.error_message is not None


class TestFormatAvailableSkills:
    def test_includes_name_and_description(self) -> None:
        from mito_ai_core.completions.prompt_builders.skills import format_available_skills

        formatted = format_available_skills()
        assert "excel_to_python:" in formatted
        assert "Convert Excel workbook logic" in formatted

    def test_custom_skill_in_registry(self, monkeypatch: pytest.MonkeyPatch) -> None:
        from mito_ai_core.completions.prompt_builders.skills import format_available_skills

        class CustomSkill(Skill):
            name = "custom_skill"
            description = "A test skill."

            def get_content(self) -> str:
                return "custom content"

        custom_skill = CustomSkill()
        monkeypatch.setitem(SKILLS, custom_skill.name, custom_skill)
        assert get_skill("custom_skill") == "custom content"
        assert "custom_skill: A test skill." in format_available_skills()
